'use client';

import React, { useEffect, useState, useRef } from 'react';
import Loader from './loader';
import { useApi } from '@/hooks/use-api';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

export default function Game({ difficulty, mode }: GameProps) {
  const { isLoading, makeRequest } = useApi();
  const { data: session, status } = useSession();
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [gameId, setGameId] = useState<string | null>(null);
  const router = useRouter();
  // Track if we've started fetching to avoid duplicate requests
  const isFetchingRef = useRef(false);

  // Add timer state
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track results for submission
  const [results, setResults] = useState<PuzzleResult[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const totalTimeRef = useRef<number>(0);
  const [totalScore, setTotalScore] = useState(0);

  // Update the getPuzzles function to correctly handle the API response
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

      // The structure is response.puzzle.game.questions as per the log
      if (response.puzzle && response.puzzle.success && response.puzzle.game) {
        // Set the gameId for final submission
        setGameId(response.puzzle.game.id);

        // Set the puzzles array from the questions array
        setPuzzles(response.puzzle.game.questions);

        // Initialize timer for first puzzle
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
    if (status === 'authenticated' && !puzzles && !isFetchingRef.current) {
      isFetchingRef.current = true;
      const token = session.accessToken;
      getPuzzles(token!);
    }
  }, [status, session, puzzles]);

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
    setTimeLeft(30); // This sets the timer back to 30 seconds
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
    } else {
      submitGameResults();
      setCurrentPuzzleIndex(0);
      toast.success('You have completed all puzzles!');
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
        setTotalScore((prevScore) => prevScore + 1);
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

  if (isLoading) {
    return <Loader difficulty={difficulty} mode={mode} />;
  }

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
