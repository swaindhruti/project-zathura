import { Server, Socket } from "socket.io";
import {
  GameType,
  GameDifficulty,
  createGameSession,
  generateGameQuestions,
  validateHectocAnswer,
} from "../src/controllers/gameController";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

// Spectators tracking
const gameSpectators: Record<
  string,
  Array<{ id: string; socketId: string; username: string }>
> = {};

// Initialize the socket handler for games
export default (io: Server) => {
  // Create a namespace for games
  const gameIo = io.of("/game");

  // Create a namespace for friend requests
  const friendIo = io.of("/friends");

  gameIo.on("connection", (socket: Socket) => {
    console.log(`User connected to game: ${socket.id}`);

    // Handle joining a game queue
    socket.on(
      "join_queue",
      ({
        userId,
        username,
        gameType,
        difficulty,
      }: {
        userId: string;
        username: string;
        gameType: GameType;
        difficulty: GameDifficulty;
      }) => {
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

          // Initialize spectators array for this game
          gameSpectators[gameSession.id] = [];

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
      }
    );

    // NEW: Handle spectating a game
    socket.on(
      "spectate_game",
      async ({
        userId,
        username,
        gameId,
      }: {
        userId: string;
        username: string;
        gameId: string;
      }) => {
        console.log(`${username} is spectating game: ${gameId}`);

        const game = activeSessions[gameId];
        if (!game) {
          socket.emit("spectate_error", { message: "Game not found" });
          return;
        }

        // Add the spectator to the game room
        socket.join(gameId);

        // Add to spectators list
        const spectator = { id: userId, socketId: socket.id, username };
        gameSpectators[gameId] = gameSpectators[gameId] || [];
        gameSpectators[gameId].push(spectator);

        // Notify everyone in the game room that a spectator joined
        gameIo.to(gameId).emit("spectator_joined", {
          gameId,
          spectator: { id: userId, username },
          spectatorCount: gameSpectators[gameId].length,
        });

        // Send current game state to the spectator
        if (game.status === "in_progress") {
          socket.emit("game_in_progress", {
            gameId,
            players: game.players.map((p: any) => ({
              id: p.id,
              username: p.username,
              score: p.score,
              progress: p.progress,
            })),
            timeRemaining: game.startTime
              ? Math.max(0, 180 - (Date.now() - game.startTime) / 1000)
              : 0,
          });
        }

        // Record in database if userId is provided
        if (userId) {
          try {
            await prisma.hectocSpectator.create({
              data: {
                userId,
                duelId: gameId,
              },
            });
          } catch (error) {
            // Check if it's a foreign key constraint error
            if ((error as any).code === "P2003") {
              console.log(
                `Note: Cannot record spectator for game ${gameId} - game exists in memory but not in database`
              );
              // This is expected during testing/development, so we'll just log it
            } else {
              // Log other unexpected errors
              console.error("Error recording spectator:", error);
            }
          }
        }
      }
    );

    // Handle player ready status
    socket.on(
      "player_ready",
      ({ gameId, userId }: { gameId: string; userId: string }) => {
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
      }
    );

    // Handle player answer submission
    socket.on(
      "submit_answer",
      ({
        gameId,
        userId,
        questionIndex,
        answer,
        timeSpent,
      }: {
        gameId: string;
        userId: string;
        questionIndex: number;
        answer: string;
        timeSpent: number;
      }) => {
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
    socket.on(
      "leave_game",
      ({ gameId, userId }: { gameId: string; userId: string }) => {
        leaveGame(socket, gameId, userId);
      }
    );

    // NEW: Handle spectator leaving a game
    socket.on(
      "leave_spectating",
      ({ gameId, userId }: { gameId: string; userId: string }) => {
        leaveSpectating(socket, gameId, userId);
      }
    );

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

      // Check if user was a spectator of any game
      for (const gameId in gameSpectators) {
        const spectatorIndex = gameSpectators[gameId]?.findIndex(
          (s) => s.socketId === socket.id
        );

        if (spectatorIndex !== -1 && spectatorIndex !== undefined) {
          const spectator = gameSpectators[gameId][spectatorIndex];
          leaveSpectating(socket, gameId, spectator.id);
          break;
        }
      }

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

  // Initialize friend request socket
  friendIo.on("connection", (socket: Socket) => {
    console.log(`User connected to friend system: ${socket.id}`);

    // Store user's socket ID for notifications
    let currentUserId: string | null = null;

    // Associate user with their socket
    socket.on("authenticate", ({ userId }: { userId: string }) => {
      if (userId) {
        currentUserId = userId;
        socket.join(`user:${userId}`); // Join user-specific room
        console.log(`User ${userId} authenticated`);
      }
    });

    // Handle sending friend request
    socket.on(
      "send_friend_request",
      async ({
        senderId,
        receiverId,
      }: {
        senderId: string;
        receiverId: string;
      }) => {
        try {
          // Check if there's already a request or friendship
          const existingRequest = await prisma.friendRequest.findUnique({
            where: {
              senderId_receiverId: {
                senderId,
                receiverId,
              },
            },
          });

          if (existingRequest) {
            socket.emit("friend_request_error", {
              message: "Friend request already sent",
            });
            return;
          }

          const reverseRequest = await prisma.friendRequest.findUnique({
            where: {
              senderId_receiverId: {
                senderId: receiverId,
                receiverId: senderId,
              },
            },
          });

          if (reverseRequest) {
            socket.emit("friend_request_error", {
              message: "You already have a pending request from this user",
            });
            return;
          }

          const existingFriendship = await prisma.friendship.findFirst({
            where: {
              OR: [
                { userId: senderId, friendId: receiverId },
                { userId: receiverId, friendId: senderId },
              ],
            },
          });

          if (existingFriendship) {
            socket.emit("friend_request_error", {
              message: "You are already friends with this user",
            });
            return;
          }

          // Create the friend request
          const friendRequest = await prisma.friendRequest.create({
            data: {
              senderId,
              receiverId,
              status: "PENDING",
            },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          // Notify sender of success
          socket.emit("friend_request_sent", { friendRequest });

          // Notify receiver about new friend request
          friendIo.to(`user:${receiverId}`).emit("friend_request_received", {
            friendRequest,
          });
        } catch (error) {
          console.error("Error sending friend request:", error);
          socket.emit("friend_request_error", {
            message: "Failed to send friend request",
          });
        }
      }
    );

    // Handle accepting friend request
    socket.on(
      "accept_friend_request",
      async ({ requestId, userId }: { requestId: string; userId: string }) => {
        try {
          const friendRequest = await prisma.friendRequest.findFirst({
            where: {
              id: requestId,
              receiverId: userId,
              status: "PENDING",
            },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          if (!friendRequest) {
            socket.emit("friend_request_error", {
              message: "Friend request not found",
            });
            return;
          }

          // Update request status
          await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: "ACCEPTED" },
          });

          // Create friendship (both ways)
          await prisma.friendship.createMany({
            data: [
              { userId, friendId: friendRequest.senderId },
              { userId: friendRequest.senderId, friendId: userId },
            ],
          });

          // Notify both users
          socket.emit("friend_request_accepted", {
            friend: friendRequest.sender,
          });

          friendIo
            .to(`user:${friendRequest.senderId}`)
            .emit("friend_request_accepted_by_other", {
              friend: friendRequest.receiver,
            });
        } catch (error) {
          console.error("Error accepting friend request:", error);
          socket.emit("friend_request_error", {
            message: "Failed to accept friend request",
          });
        }
      }
    );

    // Handle rejecting friend request
    socket.on(
      "reject_friend_request",
      async ({ requestId, userId }: { requestId: string; userId: string }) => {
        try {
          const friendRequest = await prisma.friendRequest.findFirst({
            where: {
              id: requestId,
              receiverId: userId,
              status: "PENDING",
            },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          });

          if (!friendRequest) {
            socket.emit("friend_request_error", {
              message: "Friend request not found",
            });
            return;
          }

          // Update request status
          await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" },
          });

          // Notify receiver
          socket.emit("friend_request_rejected", {
            requestId,
          });
        } catch (error) {
          console.error("Error rejecting friend request:", error);
          socket.emit("friend_request_error", {
            message: "Failed to reject friend request",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`User disconnected from friend system: ${socket.id}`);
      if (currentUserId) {
        // Handle cleanup if needed
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

  async function endGame(gameId: string): Promise<void> {
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

    // Update game stats in database if it's a Hectoc game
    if (game.type === GameType.HECTOC_GAME) {
      try {
        const winnerId = results[0]?.id;

        if (winnerId) {
          // Update winner stats
          await prisma.user.update({
            where: { id: winnerId },
            data: {
              gamesWon: { increment: 1 },
              gamesPlayed: { increment: 1 },
              // You could implement more sophisticated rating algorithms
              rating: { increment: 10 },
            },
          });

          // Update loser stats
          const loserId = results[1]?.id;
          if (loserId) {
            await prisma.user.update({
              where: { id: loserId },
              data: {
                gamesPlayed: { increment: 1 },
                rating: { decrement: 5 },
              },
            });
          }
        }
      } catch (error) {
        console.error("Error updating game stats:", error);
      }
    }

    // Send results to all players and spectators
    gameIo.to(gameId).emit("game_over", {
      gameId,
      results,
      winner: results[0],
    });

    // Remove game session after a delay
    setTimeout(() => {
      // Clear spectators
      delete gameSpectators[gameId];
      // Clear game session
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
        delete gameSpectators[gameId];
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

        // Update stats in database
        try {
          // Winner gets a win and game played
          prisma.user.update({
            where: { id: remainingPlayer.id },
            data: {
              gamesWon: { increment: 1 },
              gamesPlayed: { increment: 1 },
              rating: { increment: 5 }, // Small rating boost for opponent leaving
            },
          });

          // Leaver gets a game played and rating decrease
          prisma.user.update({
            where: { id: userId },
            data: {
              gamesPlayed: { increment: 1 },
              rating: { decrement: 10 }, // Penalty for leaving
            },
          });
        } catch (error) {
          console.error("Error updating stats after player left:", error);
        }
      }

      // Mark the game as completed
      game.status = "completed";
      game.endTime = Date.now();

      // Remove the game after a delay
      setTimeout(() => {
        delete gameSpectators[gameId];
        delete activeSessions[gameId];
      }, 60000);
    }
  }

  // Helper function to handle spectator leaving a game
  async function leaveSpectating(
    socket: Socket,
    gameId: string,
    userId: string
  ): Promise<void> {
    socket.leave(gameId);

    if (gameSpectators[gameId]) {
      // Remove from spectators list
      gameSpectators[gameId] = gameSpectators[gameId].filter(
        (s) => s.id !== userId
      );

      // Notify room that spectator left
      gameIo.to(gameId).emit("spectator_left", {
        gameId,
        spectatorId: userId,
        spectatorCount: gameSpectators[gameId].length,
      });

      // Clean up database record
      if (userId) {
        try {
          await prisma.hectocSpectator
            .deleteMany({
              where: {
                userId: userId as string,
                duelId: gameId as string,
              },
            })
            .catch((err: Error) => {
              // Check if it's a foreign key constraint error
              if ("code" in err && err.code === "P2003") {
                console.log(
                  `Note: Cannot delete spectator record - record may not exist in database`
                );
              } else {
                console.error("Error removing spectator record:", err);
              }
            });
        } catch (error) {
          console.error("Error removing spectator:", error);
        }
      }
    }
  }
};
