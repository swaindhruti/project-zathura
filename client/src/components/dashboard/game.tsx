'use client';

import React, { useEffect, useState, useRef } from 'react';
import Loader from './loader';
import { useApi } from '@/hooks/use-api';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSocketEvents } from '@/hooks/useSocketEvents';

interface GameProps {
  difficulty: string;
  mode: string;
}

interface Puzzle {
  questionId: string;
  digits: number[];
}

interface PuzzleResult {
  qId: string;
  user_ans: string;
  isCorrect: boolean;
  timeToSolve: number;
}

interface Player {
  id: string;
  username: string;
  score: number;
  currentPuzzleIndex: number;
  isFinished: boolean;
}

interface OnlinePlayer {
  id: string;
  username: string;
  difficulty: string | null;
  status: 'available' | 'playing' | 'away';
}

interface GameInvitation {
  invitationId: string;
  fromPlayer: {
    id: string;
    username: string;
  };
  difficulty: string;
}

export default function Game({ difficulty, mode }: GameProps) {
  const { isLoading, makeRequest } = useApi();
  const { data: session, status } = useSession();
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [gameId, setGameId] = useState<string | null>(null);
  const router = useRouter();
  const isFetchingRef = useRef(false);

  // Socket related states for multiplayer
  const { isConnected, joinRoom, leaveRoom, emit, on } = useSocketEvents();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(mode !== 'solo');
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Online players list and invitations
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [pendingInvitation, setPendingInvitation] = useState<GameInvitation | null>(null);
  const [sentInvitation, setSentInvitation] = useState<{ id: string; toPlayer: string } | null>(
    null
  );

  // Timer state
  const [timeLeft, setTimeLeft] = useState(300);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Results tracking
  const [results, setResults] = useState<PuzzleResult[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const totalTimeRef = useRef<number>(0);
  const [totalScore, setTotalScore] = useState(0);

  // Update player online status
  useEffect(() => {
    if (isConnected && status === 'authenticated' && session?.user) {
      // Announce player is online
      emit('playerOnline', {
        player: {
          id: session.user.id as string,
          username: session.user.name as string,
          score: 0,
          currentPuzzleIndex: 0,
          isFinished: false,
        },
        difficulty: isMultiplayer ? difficulty : null,
      });

      // Request online players list
      emit('getOnlinePlayers', '');

      // Listen for online players list updates
      const onlinePlayersCleanup = on('onlinePlayersList', (players: OnlinePlayer[]) => {
        setOnlinePlayers(players);
      });

      // Listen for game invitations
      const invitationCleanup = on('gameInvitation', (invitation: GameInvitation) => {
        setPendingInvitation(invitation);

        // Auto-dismiss after 30 seconds if not responded to
        setTimeout(() => {
          setPendingInvitation((current) =>
            current?.invitationId === invitation.invitationId ? null : current
          );
        }, 30000);
      });

      // Listen for invitation sent confirmation
      const invitationSentCleanup = on(
        'invitationSent',
        (data: { invitationId: string; toPlayer: string }) => {
          setSentInvitation({ id: data.invitationId, toPlayer: data.toPlayer });
          toast.success(`Invitation sent to ${data.toPlayer}`);
        }
      );

      // Listen for invitation errors
      const invitationErrorCleanup = on('invitationError', (data: { message: string }) => {
        toast.error(data.message);
        setSentInvitation(null);
      });

      // Listen for invitation declined
      const invitationDeclinedCleanup = on(
        'invitationDeclined',
        (data: { invitationId: string; playerName: string }) => {
          toast.info(`${data.playerName} declined your invitation`);
          setSentInvitation(null);
        }
      );

      // Listen for invitation expired
      const invitationExpiredCleanup = on(
        'invitationExpired',
        (data: { invitationId: string; toPlayer: string }) => {
          toast.info(`Invitation to ${data.toPlayer} expired`);
          setSentInvitation(null);
        }
      );

      // Listen for invitation cancelled
      const invitationCancelledCleanup = on('invitationCancelled', () => {
        setPendingInvitation(null);
        toast.info('Invitation was cancelled');
      });

      return () => {
        if (onlinePlayersCleanup) onlinePlayersCleanup();
        if (invitationCleanup) invitationCleanup();
        if (invitationSentCleanup) invitationSentCleanup();
        if (invitationErrorCleanup) invitationErrorCleanup();
        if (invitationDeclinedCleanup) invitationDeclinedCleanup();
        if (invitationExpiredCleanup) invitationExpiredCleanup();
        if (invitationCancelledCleanup) invitationCancelledCleanup();
      };
    }
  }, [isConnected, status, session, isMultiplayer, difficulty, emit, on]);

  // Handle sending an invitation
  const handleInvitePlayer = (playerId: string) => {
    if (!session?.user) return;

    emit('invitePlayer', {
      fromPlayer: {
        id: session.user.id as string,
        username: session.user.name as string,
        score: 0,
        currentPuzzleIndex: 0,
        isFinished: false,
      },
      toPlayerId: playerId,
      difficulty,
    });
  };

  // Handle responding to an invitation
  const handleRespondToInvitation = (accept: boolean) => {
    if (!pendingInvitation) return;

    emit('respondToInvitation', {
      invitationId: pendingInvitation.invitationId,
      accept,
    });

    setPendingInvitation(null);

    if (accept) {
      setIsWaitingForOpponent(true);
    }
  };

  // Cancel a sent invitation
  const handleCancelInvitation = () => {
    if (!sentInvitation) return;

    emit('cancelInvitation', {
      invitationId: sentInvitation.id,
    });

    setSentInvitation(null);
    toast.info('Invitation cancelled');
  };

  useEffect(() => {
    if (isMultiplayer && isConnected && status === 'authenticated' && session?.user) {
      const player: Player = {
        id: session.user.id as string,
        username: session.user.name as string,
        score: 0,
        currentPuzzleIndex: 0,
        isFinished: false,
      };

      setCurrentPlayer(player);

      const matchCleanup = on(
        'matchFound',
        (data: { roomId: string; players: Player[]; puzzles: Puzzle[] }) => {
          setRoomId(data.roomId);
          joinRoom(data.roomId);

          const opponentPlayer = data.players.find((p) => p.id !== player.id);
          if (opponentPlayer) {
            setOpponent(opponentPlayer);
          }
          console.log(data);
          setPuzzles(data.puzzles);
          setIsWaitingForOpponent(false);
          setSentInvitation(null);

          resetTimer();
          startTimeRef.current = Date.now();
        }
      );

      const progressCleanup = on(
        'opponentProgress',
        (data: {
          playerId: string;
          currentPuzzleIndex: number;
          score: number;
          isFinished: boolean;
        }) => {
          if (data.playerId !== player.id) {
            setOpponent((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                currentPuzzleIndex: data.currentPuzzleIndex,
                score: data.score,
                isFinished: data.isFinished,
              };
            });

            // If opponent finished, show notification
            if (data.isFinished) {
              toast.info('Opponent has finished all puzzles!');
            }
          }
        }
      );

      // Listen for game end event
      const gameEndCleanup = on(
        'gameEnded',
        (data: { winnerId: string; players: Player[]; reason?: string }) => {
          const winner = data.players.find((p) => p.id === data.winnerId);

          if (winner) {
            setWinner(winner.username);
          }

          // Show different message if opponent disconnected
          if (data.reason === 'opponent_disconnected') {
            toast.info('Your opponent disconnected. You win by default!');
          }

          setMatchEnded(true);

          // Update final opponent state
          const opponentData = data.players.find((p) => p.id !== player.id);
          if (opponentData) {
            setOpponent(opponentData);
          }
        }
      );

      // Listen for player left event
      const playerLeftCleanup = on('playerLeft', (data: { playerId: string; username: string }) => {
        toast.info(`${data.username} has left the game`);
      });

      return () => {
        if (matchCleanup) matchCleanup();
        if (progressCleanup) progressCleanup();
        if (gameEndCleanup) gameEndCleanup();
        if (playerLeftCleanup) playerLeftCleanup();
        if (roomId) leaveRoom(roomId);
      };
    }
  }, [isMultiplayer, isConnected, status, session, emit, on, joinRoom, leaveRoom, roomId]);

  // Get puzzles for solo mode
  async function getPuzzles(token: string) {
    try {
      const response = await makeRequest('POST', '/hectoc/puzzle', token, {
        difficulty: difficulty,
      });
      console.log(response);

      if (!response) {
        toast.error('Error Creating Puzzle');
        return;
      }

      if (response.puzzle && response.puzzle.success && response.puzzle.game) {
        setGameId(response.puzzle.game.id);
        setPuzzles(response.puzzle.game.questions);
        resetTimer();
        startTimeRef.current = Date.now();
      } else {
        toast.error('Invalid puzzle data received');
      }
    } catch (error) {
      console.error('Failed to load puzzles:', error);
      toast.error('Failed to load puzzles');
    }
  }

  // Solo mode puzzle fetching
  useEffect(() => {
    if (!isMultiplayer && status === 'authenticated' && !puzzles && !isFetchingRef.current) {
      isFetchingRef.current = true;
      const token = session!.accessToken;
      getPuzzles(token!);
    }
  }, [status, session, puzzles, isMultiplayer]);

  // Timer effect
  useEffect(() => {
    if (!puzzles || puzzles.length === 0) return;

    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else {
      // Time's up!
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, puzzles]);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeLeft(30); // 30 seconds per puzzle
    startTimeRef.current = Date.now();
  };

  const handleTimeUp = () => {
    const timeToSolve = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    totalTimeRef.current += timeToSolve;

    // Store result for the timed-out puzzle
    if (puzzles) {
      const newResult: PuzzleResult = {
        qId: puzzles[currentPuzzleIndex].questionId,
        user_ans: '',
        isCorrect: false,
        timeToSolve,
      };

      setResults((prevResults) => [...prevResults, newResult]);
    }

    toast.error("Time's up!");
    moveToNextPuzzle();
  };

  const moveToNextPuzzle = () => {
    if (!puzzles) return;

    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
      setUserInput('');
      resetTimer();

      // Update player progress for multiplayer
      if (isMultiplayer && roomId && currentPlayer) {
        const updatedPlayer = {
          ...currentPlayer,
          currentPuzzleIndex: currentPuzzleIndex + 1,
          score: totalScore,
        };

        setCurrentPlayer(updatedPlayer);

        // Emit progress update to other players
        emit('updateProgress', {
          roomId,
          player: updatedPlayer,
        });
      }
    } else {
      // Player finished all puzzles
      if (isMultiplayer && roomId && currentPlayer) {
        const finalPlayer = {
          ...currentPlayer,
          isFinished: true,
          score: totalScore,
          currentPuzzleIndex: puzzles.length,
        };

        setCurrentPlayer(finalPlayer);

        // Emit completion to server
        emit('playerFinished', {
          roomId,
          player: finalPlayer,
        });
      } else {
        // Solo mode completion
        submitGameResults();
        setCurrentPuzzleIndex(0);
        toast.success('You have completed all puzzles!');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput) return toast.error('Please enter a solution!');

    const timeToSolve = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    totalTimeRef.current += timeToSolve;

    try {
      const res = await makeRequest('POST', '/hectoc/verify', session?.accessToken!, {
        digits: puzzles![currentPuzzleIndex].digits,
        solution: userInput,
      });

      const newResult: PuzzleResult = {
        qId: puzzles![currentPuzzleIndex].questionId,
        user_ans: userInput,
        isCorrect: res.isValid,
        timeToSolve,
      };

      setResults((prevResults) => [...prevResults, newResult]);

      if (res.isValid) {
        // Award 10 points for correct answer in multiplayer
        const pointsToAdd = isMultiplayer ? 10 : 1;
        setTotalScore((prevScore) => prevScore + pointsToAdd);
        toast.success('Correct!');
      } else {
        setTimeLeft((prevTime) => prevTime - 5);
        toast.error(res.reason || 'Incorrect solution');
      }

      moveToNextPuzzle();
    } catch (error) {
      console.error('Error verifying solution:', error);
      toast.error('Error checking solution');
    }

    setUserInput('');
  };

  const submitGameResults = async () => {
    if (!gameId || results.length === 0 || !session?.accessToken) return;

    try {
      const response = await makeRequest('POST', '/hectoc/save', session.accessToken, {
        gameId,
        results,
        totalScore,
        totalTime: totalTimeRef.current,
      });

      if (response.success) {
        toast.success('Results saved successfully!');
        router.push('/dashboard/results');
      } else {
        toast.error('Error saving results');
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error('Error submitting results');
    }
  };

  // Render pending invitation notification
  const renderPendingInvitation = () => {
    if (!pendingInvitation) return null;

    return (
      <div className='fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-600 w-[90%] max-w-md'>
        <h3 className='text-xl font-bold text-white mb-2'>Game Invitation</h3>
        <p className='text-gray-300 mb-4'>
          <span className='font-bold'>{pendingInvitation.fromPlayer.username}</span> has invited you
          to play a {pendingInvitation.difficulty} difficulty match
        </p>
        <div className='flex justify-between'>
          <button
            onClick={() => handleRespondToInvitation(true)}
            className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded'
          >
            Accept
          </button>
          <button
            onClick={() => handleRespondToInvitation(false)}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded'
          >
            Decline
          </button>
        </div>
      </div>
    );
  };

  // Render sent invitation status
  const renderSentInvitation = () => {
    if (!sentInvitation) return null;

    return (
      <div className='fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-600 w-[90%] max-w-md'>
        <h3 className='text-xl font-bold text-white mb-2'>Waiting for Response</h3>
        <p className='text-gray-300 mb-4'>
          Invitation sent to <span className='font-bold'>{sentInvitation.toPlayer}</span>
        </p>
        <div className='flex justify-center'>
          <button
            onClick={handleCancelInvitation}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded'
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Render loading state
  if (isLoading) {
    return <Loader difficulty={difficulty} mode={mode} />;
  }

  // Render online players list for multiplayer mode
  if (isMultiplayer && !roomId && !isWaitingForOpponent) {
    return (
      <div className='px-5 py-2'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>Find Opponents</h1>
        <p className='text-white mb-4 font-satoshi font-[500] text-sm'>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
        </p>

        {renderPendingInvitation()}
        {renderSentInvitation()}

        <div className='bg-gray-900 rounded-lg p-4 mb-6'>
          <h2 className='text-xl font-bold text-white mb-4'>Online Players</h2>

          {onlinePlayers.length === 0 ? (
            <p className='text-gray-400 py-4 text-center'>No players available right now</p>
          ) : (
            <div className='space-y-3'>
              {onlinePlayers.map((player) => (
                <div
                  key={player.id}
                  className='flex items-center justify-between bg-gray-800 p-3 rounded-lg'
                >
                  <div>
                    <p className='font-semibold text-white'>{player.username}</p>
                    <p className='text-sm text-gray-400'>
                      {player.difficulty ? `${player.difficulty} difficulty` : 'No preference'}
                    </p>
                  </div>
                  <button
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50'
                    disabled={!!sentInvitation}
                    onClick={() => handleInvitePlayer(player.id)}
                  >
                    Challenge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='text-center'>
          <p className='text-gray-400 mb-3'>Can't find anyone to play with?</p>
          <button
            onClick={() => router.push('/dashboard/game/solo/' + difficulty)}
            className='bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium'
          >
            Play Solo Instead
          </button>
        </div>
      </div>
    );
  }

  // Render waiting for opponent state
  if (isMultiplayer && isWaitingForOpponent) {
    return <Loader difficulty={difficulty} mode={mode} />;
  }

  // Render match ended state
  if (isMultiplayer && matchEnded) {
    return (
      <div className='px-5 py-2'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>Game Finished!</h1>

        <div className='game-mode-card multiplayer-card p-6 flex flex-col items-center justify-center'>
          <h2 className='text-2xl font-bold text-white mb-6'>
            {winner === currentPlayer?.username ? 'You won! 🎉' : `${winner} won! 👑`}
          </h2>

          <div className='flex justify-between w-full max-w-md bg-gray-800 p-4 rounded-lg mb-6'>
            <div className='text-center'>
              <p className='text-gray-400'>You</p>
              <p className='text-2xl font-bold text-white'>{totalScore}</p>
              <p className='text-sm text-gray-400'>
                {currentPlayer?.isFinished
                  ? 'Completed'
                  : `${currentPlayer?.currentPuzzleIndex}/${puzzles?.length} puzzles`}
              </p>
            </div>

            <div className='text-center'>
              <p className='text-gray-400'>{opponent?.username}</p>
              <p className='text-2xl font-bold text-white'>{opponent?.score}</p>
              <p className='text-sm text-gray-400'>
                {opponent?.isFinished
                  ? 'Completed'
                  : `${opponent?.currentPuzzleIndex}/${puzzles?.length} puzzles`}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className='bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium'
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render multiplayer game UI
  if (isMultiplayer && !isWaitingForOpponent) {
    return (
      <div className='px-5 py-2'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>Multiplayer Game</h1>
        <p className='text-white mb-3 font-satoshi font-[500] text-sm'>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty - VS{' '}
          {opponent?.username}
        </p>

        {/* Opponent progress bar */}
        <div className='bg-gray-800 rounded-full h-4 mb-6'>
          <div
            className='bg-blue-600 h-4 rounded-full'
            style={{
              width: `${opponent && puzzles ? (opponent.currentPuzzleIndex / puzzles.length) * 100 : 0}%`,
            }}
          ></div>
        </div>

        {/* Score display */}
        <div className='flex justify-between mb-6'>
          <div className='text-white'>
            <p className='text-sm'>Your Score</p>
            <p className='text-2xl font-bold'>{totalScore}</p>
          </div>
          <div className='text-white text-right'>
            <p className='text-sm'>{opponent?.username}'s Score</p>
            <p className='text-2xl font-bold'>{opponent?.score}</p>
          </div>
        </div>

        <div className='game-mode-card multiplayer-card p-6'>
          {!puzzles ? (
            <p className='text-white'>Loading puzzles...</p>
          ) : (
            <div className='flex flex-col items-center'>
              <h2 className='text-2xl font-bold text-white mb-6'>
                Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
              </h2>

              {/* Timer Display */}
              <div
                className={`mb-4 text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}
              >
                Time Left: {timeLeft}s
              </div>

              <div className='flex gap-4 mb-8'>
                {puzzles[currentPuzzleIndex].digits.map((digit, index) => (
                  <div
                    key={index}
                    className='w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl font-bold text-white'
                  >
                    {digit}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} className='w-full max-w-md'>
                <div className='flex flex-col gap-4'>
                  <input
                    type='text'
                    value={userInput}
                    onChange={handleInputChange}
                    placeholder='Enter your solution'
                    className='p-3 rounded-lg border border-gray-600 bg-gray-800 text-white'
                  />
                  <button
                    type='submit'
                    className='bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium'
                  >
                    Submit Solution
                  </button>
                </div>
              </form>

              <div className='mt-6 text-white'>
                <p className='text-center text-gray-400 text-sm'>
                  Use the given digits and operations like +, -, *, /, () to create an expression
                  equal to 100
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render solo game UI (original)
  return (
    <div>
      <div className='px-5 py-2'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>Game Page</h1>
        <p className='text-white mb-8 font-satoshi font-[500] text-sm'>
          {mode.charAt(0).toUpperCase() + mode.slice(1)} -{' '}
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
        </p>

        <div className='game-mode-card multiplayer-card p-6'>
          {!puzzles ? (
            <p className='text-white'>Loading puzzles...</p>
          ) : (
            <div className='flex flex-col items-center'>
              <h2 className='text-2xl font-bold text-white mb-6'>
                Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
              </h2>

              {/* Timer Display */}
              <div
                className={`mb-4 text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}
              >
                Time Left: {timeLeft}s
              </div>

              <div className='flex gap-4 mb-8'>
                {puzzles &&
                  puzzles[currentPuzzleIndex].digits.map((digit, index) => (
                    <div
                      key={index}
                      className='w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl font-bold text-white'
                    >
                      {digit}
                    </div>
                  ))}
              </div>
              <form onSubmit={handleSubmit} className='w-full max-w-md'>
                <div className='flex flex-col gap-4'>
                  <input
                    type='text'
                    value={userInput}
                    onChange={handleInputChange}
                    placeholder='Enter your solution'
                    className='p-3 rounded-lg border border-gray-600 bg-gray-800 text-white'
                  />
                  <button
                    type='submit'
                    className='bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium'
                  >
                    Submit Solution
                  </button>
                </div>
              </form>

              <div className='mt-6 text-white'>
                <p className='text-center text-gray-400 text-sm'>
                  Use the given digits and operations like +, -, *, /, () to create an expression
                  equal to 100
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
