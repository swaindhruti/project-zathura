import { Server, Socket } from "socket.io";
import {
  GameType,
  GameDifficulty,
  createGameSession,
  generateGameQuestions,
  validateHectocAnswer,
} from "../controllers/gameController";

// Active game sessions
const activeSessions: Record<string, any> = {};
// Waiting players queue
const waitingPlayers: Record<string, any> = {
  [GameType.MATH_CHALLENGE]: {
    [GameDifficulty.EASY]: [],
    [GameDifficulty.MEDIUM]: [],
    [GameDifficulty.HARD]: [],
  },
  [GameType.WORD_SCRAMBLE]: {
    [GameDifficulty.EASY]: [],
    [GameDifficulty.MEDIUM]: [],
    [GameDifficulty.HARD]: [],
  },
  [GameType.HECTOC_GAME]: {
    [GameDifficulty.EASY]: [],
    [GameDifficulty.MEDIUM]: [],
    [GameDifficulty.HARD]: [],
  },
};

// Initialize the socket handler for games
export default (io: Server) => {
  // Create a namespace for games
  const gameIo = io.of("/game");

  gameIo.on("connection", (socket: Socket) => {
    console.log(`User connected to game: ${socket.id}`);

    // Handle joining a game queue
    socket.on("join_queue", ({ userId, username, gameType, difficulty }) => {
      console.log(`${username} joined ${gameType} ${difficulty} queue`);

      const player = {
        id: userId,
        socketId: socket.id,
        username,
        score: 0,
        progress: 0,
        answers: [],
        ready: false,
      };

      // Add player to appropriate queue
      waitingPlayers[gameType][difficulty].push(player);

      // Check if we have enough players to start a game
      if (waitingPlayers[gameType][difficulty].length >= 2) {
        const player1 = waitingPlayers[gameType][difficulty].shift();
        const player2 = waitingPlayers[gameType][difficulty].shift();

        // Create a new game session
        const gameSession = createGameSession(gameType, difficulty) as {
          id: string;
          type: GameType;
          difficulty: GameDifficulty;
          players: Array<{
            id: string;
            socketId: string;
            username: string;
            score: number;
            progress: number;
            answers: any[];
            ready: boolean;
          }>;
        };
        gameSession.players = [player1, player2];

        // Store the session
        activeSessions[gameSession.id] = gameSession;

        // Add players to the game room
        gameIo.sockets.get(player1.socketId)?.join(gameSession.id);
        gameIo.sockets.get(player2.socketId)?.join(gameSession.id);

        // Notify players that game is ready
        gameIo.to(gameSession.id).emit("game_ready", {
          gameId: gameSession.id,
          type: gameSession.type,
          difficulty: gameSession.difficulty,
          players: [
            { id: player1.id, username: player1.username },
            { id: player2.id, username: player2.username },
          ],
        });
      } else {
        // Notify the player they're in queue
        socket.emit("in_queue", {
          position: waitingPlayers[gameType][difficulty].length,
          gameType,
          difficulty,
        });
      }
    });

    // Handle player ready status
    socket.on("player_ready", ({ gameId, userId }) => {
      const game = activeSessions[gameId];
      if (!game) return;

      // Update player ready status
      const playerIndex = game.players.findIndex(
        (p: { id: string }) => p.id === userId
      );
      if (playerIndex !== -1) {
        game.players[playerIndex].ready = true;
      }

      // Check if all players are ready
      const allReady: boolean = game.players.every(
        (p: { ready: boolean }) => p.ready
      );
      if (allReady) {
        game.status = "in_progress";
        game.startTime = Date.now();

        // Send questions to players
        interface GameStartPayload {
          gameId: string;
          questions: Array<{
            question: string;
            validDigits?: number[];
            validTarget?: number;
          }>;
          timeLimit: number;
          gameType: GameType;
        }

        interface HectocQuestion {
          question: string;
          validDigits: number[];
          validTarget: number;
        }

        interface StandardQuestion {
          question: string;
        }

        type GameQuestion = HectocQuestion | StandardQuestion;

        const gameStartPayload: GameStartPayload = {
          gameId,
          questions: game.questions.map((q: GameQuestion) => {
            if (game.type === GameType.HECTOC_GAME) {
              const hectocQuestion = q as HectocQuestion;
              return {
                question: hectocQuestion.question,
                validDigits: hectocQuestion.validDigits,
                validTarget: hectocQuestion.validTarget,
              };
            }
            const standardQuestion = q as StandardQuestion;
            return { question: standardQuestion.question };
          }),
          timeLimit: 180, // 3 minutes for the whole game
          gameType: game.type,
        };

        gameIo.to(gameId).emit("game_start", gameStartPayload);

        // Set a timer for game end
        setTimeout(() => {
          if (
            activeSessions[gameId] &&
            activeSessions[gameId].status === "in_progress"
          ) {
            endGame(gameId);
          }
        }, 180000);
      }
    });

    // Handle player answer submission
    socket.on(
      "submit_answer",
      ({ gameId, userId, questionIndex, answer, timeSpent }) => {
        const game = activeSessions[gameId];
        if (!game || game.status !== "in_progress") return;

        const playerIndex: number = game.players.findIndex(
          (p: { id: string }) => p.id === userId
        );
        if (playerIndex === -1) return;

        const player = game.players[playerIndex];
        const question = game.questions[questionIndex];

        let isCorrect = false;

        // Check if the answer is correct based on game type
        if (game.type === GameType.HECTOC_GAME) {
          isCorrect = validateHectocAnswer(answer, question);
        } else {
          isCorrect = question.answer.toString() === answer.toString();
        }

        // Update player progress and score
        player.progress = Math.max(player.progress, questionIndex + 1);
        if (isCorrect) {
          // Calculate score based on difficulty, game type and time spent
          let baseScore = 0;

          if (game.type === GameType.HECTOC_GAME) {
            baseScore =
              game.difficulty === GameDifficulty.EASY
                ? 20
                : game.difficulty === GameDifficulty.MEDIUM
                  ? 40
                  : 60;
          } else {
            baseScore =
              game.difficulty === GameDifficulty.EASY
                ? 10
                : game.difficulty === GameDifficulty.MEDIUM
                  ? 20
                  : 30;
          }

          const timeBonus = Math.max(0, 5 - timeSpent / 1000); // Bonus for fast answers
          player.score += Math.round(baseScore + timeBonus);
        }

        // Record the answer
        player.answers[questionIndex] = { answer, isCorrect, timeSpent };

        // Update the game state
        activeSessions[gameId] = game;

        // Notify all players about the progress
        gameIo.to(gameId).emit("game_progress", {
          gameId,
          players: game.players.map(
            (p: {
              id: string;
              username: string;
              score: number;
              progress: number;
            }) => ({
              id: p.id,
              username: p.username,
              score: p.score,
              progress: p.progress,
            })
          ),
          lastAnswer: {
            playerId: player.id,
            questionIndex,
            isCorrect,
          },
        });

        // Check if all players completed all questions
        const allDone = game.players.every(
          (p: { progress: number }) => p.progress >= game.questions.length
        );
        if (allDone) {
          endGame(gameId);
        }
      }
    );

    // Handle player leaving a game
    socket.on("leave_game", ({ gameId, userId }) => {
      leaveGame(socket, gameId, userId);
    });

    // Handle disconnections
    socket.on("disconnect", () => {
      console.log(`User disconnected from game: ${socket.id}`);

      // Remove from waiting queues
      Object.values(GameType).forEach((type) => {
        Object.values(GameDifficulty).forEach((diff) => {
          const queue = waitingPlayers[type][diff];
          const playerIndex: number = queue.findIndex(
            (p: { socketId: string }) => p.socketId === socket.id
          );
          if (playerIndex !== -1) {
            queue.splice(playerIndex, 1);
          }
        });
      });

      // Handle active games
      for (const gameId in activeSessions) {
        const game = activeSessions[gameId];
        const playerIndex: number = game.players.findIndex(
          (p: { socketId: string }) => p.socketId === socket.id
        );

        if (playerIndex !== -1) {
          leaveGame(socket, gameId, game.players[playerIndex].id);
          break;
        }
      }
    });
  });

  // Helper function to end a game
  interface PlayerAnswer {
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
  }

  interface PlayerResult {
    id: string;
    username: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    avgTimePerQuestion: number;
  }

  interface GameSession {
    id: string;
    type: GameType;
    difficulty: GameDifficulty;
    players: Array<{
      id: string;
      socketId: string;
      username: string;
      score: number;
      progress: number;
      answers: PlayerAnswer[];
      ready: boolean;
    }>;
    questions: Array<{
      question: string;
      answer: string;
    }>;
    status: "waiting" | "in_progress" | "completed";
    startTime?: number;
    endTime?: number;
  }

  function endGame(gameId: string): void {
    const game: GameSession | undefined = activeSessions[gameId];
    if (!game) return;

    game.status = "completed";
    game.endTime = Date.now();

    // Calculate results and statistics
    const results: PlayerResult[] = game.players.map((player) => {
      const correctAnswers = player.answers.filter(
        (a) => a && a.isCorrect
      ).length;
      const avgTime =
        player.answers.reduce((sum, a) => sum + (a ? a.timeSpent : 0), 0) /
        Math.max(1, player.answers.length);

      return {
        id: player.id,
        username: player.username,
        score: player.score,
        correctAnswers,
        totalQuestions: game.questions.length,
        avgTimePerQuestion: avgTime / 1000, // in seconds
      };
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Send results to all players
    gameIo.to(gameId).emit("game_over", {
      gameId,
      results,
      winner: results[0],
    });

    // Remove game session after a delay
    setTimeout(() => {
      delete activeSessions[gameId];
    }, 60000); // Keep the game data for 1 minute for player review
  }

  // Helper function to handle player leaving a game
  function leaveGame(socket: Socket, gameId: string, userId: string): void {
    const game: GameSession | undefined = activeSessions[gameId];
    if (!game) return;

    socket.leave(gameId);

    // If the game is waiting or already completed, just remove the player
    if (game.status === "waiting") {
      game.players = game.players.filter(
        (p: { id: string }) => p.id !== userId
      );

      // If no players left, remove the game
      if (game.players.length === 0) {
        delete activeSessions[gameId];
      }
      // Otherwise notify remaining players
      else {
        gameIo.to(gameId).emit("player_left", {
          gameId,
          userId,
          remainingPlayers: game.players.length,
        });
      }
    }
    // If the game is in progress, end it with the other player as winner
    else if (game.status === "in_progress") {
      const remainingPlayer = game.players.find(
        (p: { id: string }) => p.id !== userId
      );
      if (remainingPlayer) {
        gameIo.to(gameId).emit("game_over", {
          gameId,
          results: [
            {
              id: remainingPlayer.id,
              username: remainingPlayer.username,
              score: remainingPlayer.score,
              correctAnswers: remainingPlayer.answers.filter(
                (a: PlayerAnswer | undefined) => a && a.isCorrect
              ).length,
              totalQuestions: game.questions.length,
              winner: true,
              reason: "opponent_left",
            },
          ],
          winner: {
            id: remainingPlayer.id,
            username: remainingPlayer.username,
            score: remainingPlayer.score,
          },
        });
      }

      // Mark the game as completed
      game.status = "completed";
      game.endTime = Date.now();

      // Remove the game after a delay
      setTimeout(() => {
        delete activeSessions[gameId];
      }, 60000);
    }
  }
};
