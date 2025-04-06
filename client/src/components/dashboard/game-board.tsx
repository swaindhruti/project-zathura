'use client';

import React from 'react';
import { Puzzle } from '@/types/game';

interface GameBoardProps {
  puzzles: Puzzle[] | null;
  currentPuzzleIndex: number;
  timeLeft: number;
  userInput: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function GameBoard({
  puzzles,
  currentPuzzleIndex,
  timeLeft,
  userInput,
  onInputChange,
  onSubmit,
}: GameBoardProps) {
  if (!puzzles) {
    return <p className='text-white'>Loading puzzles...</p>;
  }

  return (
    <div className='flex flex-col items-center'>
      <h2 className='text-2xl font-bold text-white mb-6 font-satoshi'>
        Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
      </h2>

      <div
        className={`font-satoshi mb-4 text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}
      >
        Time Left: {timeLeft}s
      </div>

      <div className='flex gap-4 mb-8 font-air'>
        {puzzles[currentPuzzleIndex].digits.map((digit, index) => (
          <div
            key={index}
            className='w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl font-bold text-white'
          >
            {digit}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className='w-full max-w-md'>
        <div className='flex flex-col gap-4 font-satoshi'>
          <input
            type='text'
            value={userInput}
            onChange={onInputChange}
            placeholder='Enter your solution'
            className='p-3 rounded-lg border border-gray-600 bg-gray-800 text-white'
          />
          <button
            type='submit'
            className='font-satoshi bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105'
          >
            Submit Solution
          </button>
        </div>
      </form>

      <div className='mt-6 text-white'>
        <p className='text-center text-gray-400 text-sm font-satoshi'>
          Use the given digits and operations like +, -, *, /, () to create an expression equal to
          100
        </p>
      </div>
    </div>
  );
}
