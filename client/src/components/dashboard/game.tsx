'use client';

import React, { useEffect, useState, useRef } from 'react';
import Loader from './loader';
import { useApi } from '@/hooks/use-api';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { Player, OnlinePlayer, GameInvitation, Puzzle, PuzzleResult } from '@/types/game';
import GameInvitationUI from './game-invitation';
import OnlinePlayersList from './online-players';
import GameBoard from './game-board';
interface GameProps {
  difficulty: string;
  mode: string;
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

  const { isConnected, joinRoom, leaveRoom, emit, on } = useSocketEvents();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(mode !== 'solo');
  const isDualMode = mode === 'dual';
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [pendingInvitation, setPendingInvitation] = useState<GameInvitation | null>(null);
  const [sentInvitation, setSentInvitation] = useState<{ id: string; toPlayer: string } | null>(
    null
  );

  const [timeLeft, setTimeLeft] = useState(300);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [results, setResults] = useState<PuzzleResult[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const totalTimeRef = useRef<number>(0);
  const [totalScore, setTotalScore] = useState(0);

  const [playerFinalScore, setPlayerFinalScore] = useState(0);
  const [opponentFinalScore, setOpponentFinalScore] = useState(0);

  useEffect(() => {
    if (isConnected && status === 'authenticated' && session?.user) {
      emit('playerOnline', {
        player: {
          id: session.user.id as string,
          username: session.user.username as string,
          score: 0,
          currentPuzzleIndex: 0,
          isFinished: false,
        },
        difficulty: isMultiplayer ? difficulty : null,
        mode: mode,
      });

      emit('getOnlinePlayers', '');

      if (isMultiplayer && !isDualMode) {
        setIsWaitingForOpponent(true);
        emit('joinMatchmaking', {
          player: {
            id: session.user.id as string,
            username: session.user.username as string,
            score: 0,
            currentPuzzleIndex: 0,
            isFinished: false,
          },
          difficulty,
          mode: mode,
        });
      }

      const onlinePlayersCleanup = on('onlinePlayersList', (players: OnlinePlayer[]) => {
        setOnlinePlayers(players);
      });

      const invitationCleanup = on('gameInvitation', (invitation: GameInvitation) => {
        setPendingInvitation(invitation);
        setTimeout(() => {
          setPendingInvitation((current) =>
            current?.invitationId === invitation.invitationId ? null : current
          );
        }, 30000);
      });

      const invitationSentCleanup = on(
        'invitationSent',
        (data: { invitationId: string; toPlayer: string }) => {
          setSentInvitation({ id: data.invitationId, toPlayer: data.toPlayer });
          toast.success(`Invitation sent to ${data.toPlayer}`);
        }
      );

      const invitationErrorCleanup = on('invitationError', (data: { message: string }) => {
        toast.error(data.message);
        setSentInvitation(null);
      });

      const invitationDeclinedCleanup = on(
        'invitationDeclined',
        (data: { invitationId: string; playerName: string }) => {
          toast.info(`${data.playerName} declined your invitation`);
          setSentInvitation(null);
        }
      );

      const invitationExpiredCleanup = on(
        'invitationExpired',
        (data: { invitationId: string; toPlayer: string }) => {
          toast.info(`Invitation to ${data.toPlayer} expired`);
          setSentInvitation(null);
        }
      );

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

  const handleInvitePlayer = (playerId: string) => {
    if (!session?.user) return;

    emit('invitePlayer', {
      fromPlayer: {
        id: session.user.id as string,
        username: session.user.username as string,
        score: 0,
        currentPuzzleIndex: 0,
        isFinished: false,
      },
      toPlayerId: playerId,
      difficulty,
    });
  };

  const handleRespondToInvitation = (accept: boolean) => {
    if (!pendingInvitation) return;

    emit('respondToInvitation', {
      invitationId: pendingInvitation.invitationId,
      accept,
    });

    setPendingInvitation(null);
    if (accept) setIsWaitingForOpponent(true);
  };

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
        username: session.user.username as string,
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
          if (opponentPlayer) setOpponent(opponentPlayer);
          console.log(data.puzzles);
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
            setOpponentFinalScore(data.score);
            setOpponent((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                currentPuzzleIndex: data.currentPuzzleIndex,
                score: data.score,
                isFinished: data.isFinished,
              };
            });
            if (data.isFinished) toast.info('Opponent has finished all puzzles!');
          }
        }
      );

      const gameEndCleanup = on(
        'gameEnded',
        (data: { winnerId: string | null; players: Player[]; reason?: string }) => {
          if (timerRef.current) clearTimeout(timerRef.current);
          setMatchEnded(true);

          const opponentData = data.players.find((p) => p.id !== player.id);
          const playerData = data.players.find((p) => p.id === player.id);

          if (opponentData) {
            setOpponent(opponentData);
            setOpponentFinalScore(opponentData.score);
          }

          if (playerData) {
            setPlayerFinalScore(playerData.score);
          }

          console.log(
            'Final scores - Player:',
            playerData?.score,
            'Opponent:',
            opponentData?.score
          );

          if (opponentData && playerData && opponentData.score === playerData.score) {
            setWinner('draw');
            toast.info("It's a draw! Both players have the same score.");
          } else if (!data.winnerId) {
            setWinner('draw');
          } else {
            const winner = data.players.find((p) => p.id === data.winnerId);
            if (winner) setWinner(winner.username);
          }

          if (data.reason === 'opponent_disconnected') {
            toast.info('Your opponent disconnected. You win by default!');
          }
        }
      );

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

  async function getPuzzles(token: string) {
    try {
      const response = await makeRequest('POST', '/hectoc/puzzle', token, {
        difficulty: difficulty,
      });

      if (!response) {
        toast.error('Error Creating Puzzle');
        return;
      }

      if (response.puzzle && response.puzzle.success && response.puzzle.game) {
        setGameId(response.puzzle.game.id);
        console.log(response.puzzle);
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

  useEffect(() => {
    if (!isMultiplayer && status === 'authenticated' && !puzzles && !isFetchingRef.current) {
      isFetchingRef.current = true;
      const token = session!.accessToken;
      getPuzzles(token!);
    }
  }, [status, session, puzzles, isMultiplayer]);

  useEffect(() => {
    if (!puzzles || puzzles.length === 0) return;

    if (matchEnded) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, puzzles, matchEnded]);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeLeft(30);
    startTimeRef.current = Date.now();
  };

  const handleTimeUp = () => {
    const timeToSolve = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    totalTimeRef.current += timeToSolve;

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

      let newTotalScore = totalScore;

      if (res.isValid) {
        const pointsToAdd = isMultiplayer ? 10 : 1;
        newTotalScore = totalScore + pointsToAdd;
        setTotalScore(newTotalScore);
        toast.success('Correct!');
      } else {
        setTimeLeft((prevTime) => prevTime - 5);
        toast.error(res.reason || 'Incorrect solution');
      }

      moveToNextPuzzle(newTotalScore);
    } catch (error) {
      console.error('Error verifying solution:', error);
      toast.error('Error checking solution');
    }

    setUserInput('');
  };

  const moveToNextPuzzle = (newScore = totalScore) => {
    if (!puzzles) return;

    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
      setUserInput('');
      resetTimer();

      if (isMultiplayer && roomId && currentPlayer) {
        const updatedPlayer = {
          ...currentPlayer,
          currentPuzzleIndex: currentPuzzleIndex + 1,
          score: newScore,
        };

        setCurrentPlayer(updatedPlayer);
        emit('updateProgress', { roomId, player: updatedPlayer });
      }
    } else {
      if (isMultiplayer && roomId && currentPlayer) {
        const finalPlayer = {
          ...currentPlayer,
          isFinished: true,
          score: newScore,
          currentPuzzleIndex: puzzles.length,
        };

        setCurrentPlayer(finalPlayer);
        emit('playerFinished', { roomId, player: finalPlayer });
      } else {
        submitGameResults();
        setCurrentPuzzleIndex(0);
        toast.success('You have completed all puzzles!');
      }
    }
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

  if (isLoading) {
    return <Loader difficulty={difficulty} mode={mode} />;
  }

  if (isMultiplayer && !roomId && !isWaitingForOpponent) {
    return (
      <div className='px-5 py-2'>
        <div className='flex items-start flex-col gap-1.5'>
          <h1 className='text-4xl font-[900] tracking-wide text-white mb-1 font-air'>
            {isDualMode ? 'DIRECT CHALLENGE' : 'HECTOCLASH'}
          </h1>
          <p className='text-white mb-4 font-satoshi font-[500] text-sm'>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty -
            {isDualMode ? ' Challenge a Specific Player' : ' Find Opponents'}
          </p>
        </div>

        <GameInvitationUI
          pendingInvitation={pendingInvitation}
          sentInvitation={sentInvitation}
          onRespondToInvitation={handleRespondToInvitation}
          onCancelInvitation={handleCancelInvitation}
        />

        <OnlinePlayersList
          onlinePlayers={onlinePlayers}
          sentInvitation={sentInvitation}
          onInvitePlayer={handleInvitePlayer}
          onPlaySolo={() => router.push('/dashboard/solo/' + difficulty)}
          isDualMode={isDualMode}
        />
      </div>
    );
  }

  console.log(opponent?.score, currentPlayer?.score);

  if (isMultiplayer && isWaitingForOpponent) {
    return (
      <div className='px-5 py-2'>
        <div className='flex items-start flex-col gap-1.5'>
          <h1 className='text-4xl font-[900] tracking-wide text-white mb-1 font-air'>
            {isDualMode ? 'DIRECT CHALLENGE' : 'HECTOCLASH'}
          </h1>
          <p className='text-white mb-4 font-satoshi font-[500] text-sm'>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty -
            {isDualMode ? ' Waiting for player to accept...' : ' Finding an opponent...'}
          </p>
        </div>

        <div className='game-mode-card p-6 flex flex-col items-center justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#90FE95] mb-4'></div>
          <p className='text-white text-lg mb-6'>
            {isDualMode
              ? 'Waiting for opponent to respond...'
              : 'Looking for an opponent with matching criteria...'}
          </p>

          {!isDualMode && (
            <button
              onClick={() => {
                emit('leaveMatchmaking', '');
                setIsWaitingForOpponent(false);
              }}
              className='bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-6 py-3 rounded-lg transition-all duration-300'
            >
              Cancel Matchmaking
            </button>
          )}

          {isDualMode && sentInvitation && (
            <button
              onClick={handleCancelInvitation}
              className='bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-6 py-3 rounded-lg transition-all duration-300'
            >
              Cancel Invitation
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isMultiplayer && matchEnded) {
    return (
      <div className='px-5 py-2'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>Game Finished!</h1>

        <div className='game-mode-card multiplayer-card p-6 flex flex-col items-center justify-center mt-5'>
          <h2 className='text-2xl font-bold text-white mb-6 font-air capitalize'>
            {opponentFinalScore === playerFinalScore
              ? "It's a draw! 🤝"
              : winner === currentPlayer?.username
                ? 'You won! 🎉'
                : `${winner} won! 👑`}
          </h2>

          <div className='flex justify-between w-full max-w-md bg-[#292929] p-4 rounded-lg mb-6'>
            <div className='text-center font-satoshi'>
              <p className='text-gray-400'>You</p>
              <p className='text-2xl font-bold text-white'>{playerFinalScore}</p>
              <p className='text-xs text-gray-400'>
                {currentPlayer?.isFinished
                  ? 'Completed'
                  : `${currentPlayer?.currentPuzzleIndex}/${puzzles?.length} puzzles`}
              </p>
            </div>

            <div className='text-center font-satoshi'>
              <p className='text-gray-400'>{opponent?.username}</p>
              <p className='text-2xl font-bold text-white'>{opponentFinalScore}</p>
              <p className='text-xs text-gray-400'>
                {opponent?.isFinished
                  ? 'Completed'
                  : `${opponent?.currentPuzzleIndex}/${puzzles?.length} puzzles`}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className='font-satoshi bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105'
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  if (isMultiplayer && !isWaitingForOpponent) {
    return (
      <div className='px-5 py-2'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>
          {isDualMode ? 'DIRECT CHALLENGE' : 'HECTOCLASH'}
        </h1>
        <p className='text-white mb-3 font-satoshi font-[500] text-sm'>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty - VS{' '}
          {opponent?.username}
        </p>

        <div className='flex justify-between bg-[#292929] p-3 rounded-lg mb-4 text-white font-satoshi'>
          <div className='text-center'>
            <p>You: {totalScore} points</p>
            <p className='text-xs text-gray-400'>
              {currentPlayer?.isFinished
                ? 'Completed'
                : `${currentPuzzleIndex + 1}/${puzzles?.length}`}
            </p>
          </div>
          <div className='text-center'>
            <p>
              {opponent?.username}: {opponent?.score || 0} points
            </p>
            <p className='text-xs text-gray-400'>
              {opponent?.isFinished
                ? 'Completed'
                : `${opponent?.currentPuzzleIndex || 0}/${puzzles?.length}`}
            </p>
          </div>
        </div>

        <div className='game-mode-card multiplayer-card p-6'>
          <GameBoard
            puzzles={puzzles}
            currentPuzzleIndex={currentPuzzleIndex}
            timeLeft={timeLeft}
            userInput={userInput}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='px-5 py-2'>
      <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>HECTOCLASH</h1>
      <p className='text-white mb-3 font-satoshi font-[500] text-sm'>
        {mode.charAt(0).toUpperCase() + mode.slice(1)} -{' '}
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
      </p>

      <div className='game-mode-card solo-card p-6'>
        <GameBoard
          puzzles={puzzles}
          currentPuzzleIndex={currentPuzzleIndex}
          timeLeft={timeLeft}
          userInput={userInput}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
