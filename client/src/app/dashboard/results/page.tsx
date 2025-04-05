'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useApi } from '@/hooks/use-api';
import { toast } from 'sonner';

interface GameResult {
  id: string;
  gameId: string;
  createdAt: string;
  totalScore: number;
  totalTime: number;
  isWinner: boolean;
  results: Array<{
    qId: string;
    user_ans: string;
    isCorrect: boolean;
    timeToSolve: number;
  }>;
  game: {
    difficulty: string;
    target: number;
    isDuel: boolean;
    status: string;
    startedAt: string;
    endedAt: string | null;
  };
}

interface Stats {
  totalGames: number;
  gamesWon: number;
  averageScore: number;
  averageTime: number;
  bestTime: number;
  bestScore: number;
}

export default function ResultsPage() {
  const { data: session } = useSession();
  const { isLoading, makeRequest } = useApi();
  const [results, setResults] = useState<GameResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    gamesWon: 0,
    averageScore: 0,
    averageTime: 0,
    bestTime: Number.MAX_SAFE_INTEGER,
    bestScore: 0,
  });

  useEffect(() => {
    if (session?.accessToken) {
      fetchResults();
    }
  }, [session]);

  const fetchResults = async () => {
    try {
      const response = await makeRequest('GET', '/hectoc/results', session?.accessToken!);

      if (response && response.success && Array.isArray(response.results)) {
        setResults(response.results);
        calculateStats(response.results);
      } else {
        toast.error('Failed to fetch results');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Error fetching your game history');
    }
  };

  const calculateStats = (gameResults: GameResult[]) => {
    if (!gameResults || gameResults.length === 0) return;

    const totalGames = gameResults.length;
    const gamesWon = gameResults.filter((game) => game.isWinner).length;
    let totalScore = 0;
    let totalTime = 0;
    let bestTime = Number.MAX_SAFE_INTEGER;
    let bestScore = 0;

    gameResults.forEach((game) => {
      totalScore += game.totalScore;
      totalTime += game.totalTime;

      if (game.totalTime < bestTime && game.totalTime > 0) {
        bestTime = game.totalTime;
      }

      if (game.totalScore > bestScore) {
        bestScore = game.totalScore;
      }
    });

    setStats({
      totalGames,
      gamesWon,
      averageScore: Math.round((totalScore / totalGames) * 100) / 100,
      averageTime: Math.round((totalTime / totalGames) * 100) / 100,
      bestTime: bestTime === Number.MAX_SAFE_INTEGER ? 0 : bestTime,
      bestScore,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className='px-5 py-10'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-6'>Game Results</h1>
        <div className='w-full h-64 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-5 py-10'>
      <h1 className='text-4xl font-[900] tracking-wide text-white mb-6'>Game Results</h1>

      {/* Stats Summary */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
        <div className='game-mode-card p-6'>
          <div className='text-white'>
            <h3 className='text-xl font-bold mb-4'>Overview</h3>
            <div className='grid grid-cols-2 gap-y-3'>
              <p>Total Games:</p>
              <p className='text-right font-bold'>{stats.totalGames}</p>
              <p>Games Won:</p>
              <p className='text-right font-bold'>{stats.gamesWon}</p>
              <p>Win Rate:</p>
              <p className='text-right font-bold'>
                {stats.totalGames > 0 ? Math.round((stats.gamesWon / stats.totalGames) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className='game-mode-card p-6'>
          <div className='text-white'>
            <h3 className='text-xl font-bold mb-4'>Performance</h3>
            <div className='grid grid-cols-2 gap-y-3'>
              <p>Average Score:</p>
              <p className='text-right font-bold'>{stats.averageScore}</p>
              <p>Best Score:</p>
              <p className='text-right font-bold'>{stats.bestScore}</p>
              <p>Average Time:</p>
              <p className='text-right font-bold'>{formatTime(stats.averageTime)}</p>
              <p>Best Time:</p>
              <p className='text-right font-bold'>{formatTime(stats.bestTime)}</p>
            </div>
          </div>
        </div>
        <div className='game-mode-card p-6'>
          <div className='text-white'>
            <h3 className='text-xl font-bold mb-4'>Achievements</h3>
            <div className='grid grid-cols-1 gap-y-3'>
              <p className={stats.totalGames >= 10 ? 'text-green-400' : 'text-gray-500'}>
                {stats.totalGames >= 10 ? '✅' : '❌'} Played 10+ Games
              </p>
              <p className={stats.gamesWon >= 5 ? 'text-green-400' : 'text-gray-500'}>
                {stats.gamesWon >= 5 ? '✅' : '❌'} Won 5+ Games
              </p>
              <p className={stats.bestScore >= 5 ? 'text-green-400' : 'text-gray-500'}>
                {stats.bestScore >= 5 ? '✅' : '❌'} Scored 5+ in a Game
              </p>
              <p
                className={
                  stats.bestTime <= 60 && stats.bestTime > 0 ? 'text-green-400' : 'text-gray-500'
                }
              >
                {stats.bestTime <= 60 && stats.bestTime > 0 ? '✅' : '❌'} Completed in Under 1 Min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Game History Table */}
      <div className='game-mode-card p-6 mb-8'>
        <h2 className='text-2xl font-bold text-white mb-6'>Game History</h2>
        {results.length === 0 ? (
          <p className='text-white text-center'>
            No game history found. Start playing to see your results!
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full text-white'>
              <thead>
                <tr className='border-b border-gray-700'>
                  <th className='px-4 py-3 text-left'>Date</th>
                  <th className='px-4 py-3 text-left'>Difficulty</th>
                  <th className='px-4 py-3 text-center'>Mode</th>
                  <th className='px-4 py-3 text-center'>Score</th>
                  <th className='px-4 py-3 text-center'>Time</th>
                  {results.some((result) => result.game.isDuel) && (
                    <th className='px-4 py-3 text-center'>Result</th>
                  )}
                  <th className='px-4 py-3 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className='border-b border-gray-700 hover:bg-gray-800'>
                    <td className='px-4 py-3'>{formatDate(result.createdAt)}</td>
                    <td className='px-4 py-3 capitalize'>{result.game.difficulty}</td>
                    <td className='px-4 py-3 text-center'>
                      {result.game.isDuel ? 'Duel' : 'Solo'}
                    </td>
                    <td className='px-4 py-3 text-center font-bold'>{result.totalScore}</td>
                    <td className='px-4 py-3 text-center'>{formatTime(result.totalTime)}</td>
                    {result.game.isDuel && (
                      <td className='px-4 py-3 text-center'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${result.isWinner ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
                        >
                          {result.isWinner ? 'Winner' : 'Completed'}
                        </span>
                      </td>
                    )}
                    <td className='px-4 py-3 text-center'>
                      <button
                        onClick={() => setSelectedGame(result)}
                        className='bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm'
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Game Details Modal */}
      {selectedGame && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='game-mode-card p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-2xl font-bold text-white'>Game Details</h3>
              <button
                onClick={() => setSelectedGame(null)}
                className='text-gray-400 hover:text-white'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
              <div className='bg-gray-800 p-3 rounded-lg'>
                <p className='text-gray-400 text-xs'>Difficulty</p>
                <p className='text-white font-bold capitalize'>{selectedGame.game.difficulty}</p>
              </div>
              <div className='bg-gray-800 p-3 rounded-lg'>
                <p className='text-gray-400 text-xs'>Mode</p>
                <p className='text-white font-bold'>{selectedGame.game.isDuel ? 'Duel' : 'Solo'}</p>
              </div>
              <div className='bg-gray-800 p-3 rounded-lg'>
                <p className='text-gray-400 text-xs'>Total Score</p>
                <p className='text-white font-bold'>{selectedGame.totalScore}</p>
              </div>
              <div className='bg-gray-800 p-3 rounded-lg'>
                <p className='text-gray-400 text-xs'>Total Time</p>
                <p className='text-white font-bold'>{formatTime(selectedGame.totalTime)}</p>
              </div>
            </div>

            <h4 className='text-xl font-bold text-white mb-4'>Question Details</h4>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-white'>
                <thead>
                  <tr className='border-b border-gray-700'>
                    <th className='px-4 py-3 text-left'>#</th>
                    <th className='px-4 py-3 text-left'>Your Answer</th>
                    <th className='px-4 py-3 text-center'>Result</th>
                    <th className='px-4 py-3 text-center'>Time (sec)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGame.results.map((question, index) => (
                    <tr key={question.qId} className='border-b border-gray-700'>
                      <td className='px-4 py-3'>{index + 1}</td>
                      <td className='px-4 py-3 font-mono'>
                        {question.user_ans || 'No answer provided'}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${question.isCorrect ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
                        >
                          {question.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-center'>{question.timeToSolve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='mt-6 flex justify-end'>
              <button
                onClick={() => setSelectedGame(null)}
                className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
