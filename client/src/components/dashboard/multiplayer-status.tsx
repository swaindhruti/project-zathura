'use client';

import React from 'react';
import { Player } from '@/types/game';

interface MultiplayerStatusProps {
  currentPlayer: Player | null;
  opponent: Player | null;
  totalScore: number;
  puzzlesLength: number;
}

export default function MultiplayerStatus({
  currentPlayer,
  opponent,
  totalScore,
  puzzlesLength,
}: MultiplayerStatusProps) {
  return (
    <>
      <div className='bg-gray-800 rounded-full h-4 mb-6'>
        <div
          className='bg-blue-600 h-4 rounded-full'
          style={{
            width: `${opponent ? (opponent.currentPuzzleIndex / puzzlesLength) * 100 : 0}%`,
          }}
        ></div>
      </div>

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
    </>
  );
}
