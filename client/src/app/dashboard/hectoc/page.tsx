'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X } from 'lucide-react';

export default function HectocGame() {
  // Game state
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('moderate');
  const [currentPuzzle, setCurrentPuzzle] = useState<{
    questionId: string;
    digits: number[];
  } | null>(null);
  const [solution, setSolution] = useState('');
  const [verification, setVerification] = useState<{
    isValid?: boolean;
    reason?: string;
    result?: number;
  } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [actualSolution, setActualSolution] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Function to fetch a new puzzle
  const fetchPuzzle = async () => {
    try {
      setIsLoading(true);
      setVerification(null);
      setShowSolution(false);
      setActualSolution('');

      const response = await axios.post('/api/hectoc/puzzle', {
        difficulty,
      });

      if (response.data.puzzle && response.data.puzzle.length > 0) {
        setCurrentPuzzle(response.data.puzzle[0]);
        setGameStarted(true);
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error('Error fetching puzzle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to verify the solution
  const verifySolution = async () => {
    if (!currentPuzzle) return;

    try {
      setIsLoading(true);
      const timeToSolve = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      const response = await axios.post('/api/hectoc/verify', {
        digits: currentPuzzle.digits,
        solution,
        target: 100,
      });

      setVerification(response.data);

      // If this was a legitimate game, save the result
      if (gameStarted && response.data) {
        await axios.post('/api/hectoc/save-score', {
          gameId: 'practice', // For a real game, use the actual gameId
          results: [
            {
              qId: currentPuzzle.questionId,
              user_ans: solution,
              isCorrect: response.data.isValid,
              timeToSolve,
            },
          ],
          totalScore: response.data.isValid ? 1 : 0,
          totalTime: timeToSolve,
        });
      }
    } catch (error) {
      console.error('Error verifying solution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get the actual solution
  const getSolutionFromAPI = async () => {
    if (!currentPuzzle) return;

    try {
      setIsLoading(true);
      const response = await axios.post('/api/hectoc/solution', {
        questionId: currentPuzzle.questionId,
      });

      if (response.data && !response.data.error) {
        setActualSolution(response.data.solution);
        setShowSolution(true);
      } else {
        setActualSolution('Solution not available');
        setShowSolution(true);
      }
    } catch (error) {
      console.error('Error getting solution:', error);
      setActualSolution('Error retrieving solution');
      setShowSolution(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to format the expression for display
  const formatExpression = (expr: string) => {
    return expr.replace(/\*/g, '×').replace(/\//g, '÷');
  };

  return (
    <div className='container mx-auto p-4 max-w-3xl'>
      <h1 className='text-2xl font-bold mb-6 text-center'>Hectoc Game</h1>

      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Game Controls</CardTitle>
          <CardDescription>Select difficulty and start a new game</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row gap-4 items-center'>
            <div className='w-full md:w-1/3'>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Difficulty' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='easy'>Easy</SelectItem>
                  <SelectItem value='moderate'>Moderate</SelectItem>
                  <SelectItem value='difficult'>Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className='w-full md:w-auto' onClick={fetchPuzzle} disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              New Puzzle
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentPuzzle ? (
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Current Puzzle</CardTitle>
            <CardDescription>Create an expression using these digits to equal 100</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-center gap-3 mb-6'>
              {currentPuzzle.digits.map((digit, index) => (
                <Badge
                  key={index}
                  variant='outline'
                  className='text-2xl py-3 px-5 font-bold border-2'
                >
                  {digit}
                </Badge>
              ))}
            </div>

            <div className='flex flex-col gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Your Solution (use +, -, *, / and parentheses)
                </label>
                <Input
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder='e.g.: (1+2)*3+4+5+6'
                />
              </div>

              <div className='flex gap-2'>
                <Button
                  className='w-full'
                  onClick={verifySolution}
                  disabled={isLoading || !solution}
                >
                  {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Check Solution'}
                </Button>
                <Button
                  className='w-full'
                  variant='outline'
                  onClick={getSolutionFromAPI}
                  disabled={isLoading || showSolution}
                >
                  Show Solution
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className='flex-col items-start'>
            {verification && (
              <div
                className={`mt-4 p-3 rounded-md w-full ${verification.isValid ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <div className='flex items-center'>
                  {verification.isValid ? (
                    <Check className='h-5 w-5 text-green-600 mr-2' />
                  ) : (
                    <X className='h-5 w-5 text-red-600 mr-2' />
                  )}
                  <p className={verification.isValid ? 'text-green-700' : 'text-red-700'}>
                    {verification.isValid ? 'Correct!' : verification.reason}
                  </p>
                </div>
              </div>
            )}

            {showSolution && (
              <div className='mt-4 p-3 bg-blue-50 rounded-md w-full'>
                <p className='font-medium text-blue-800'>
                  Solution: {formatExpression(actualSolution)}
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card className='text-center p-10'>
          <CardContent>
            <p className='text-gray-500'>
              Select a difficulty level and click "New Puzzle" to start playing!
            </p>
          </CardContent>
        </Card>
      )}

      <div className='text-center mt-8'>
        <Button variant='outline' onClick={() => (window.location.href = '/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
