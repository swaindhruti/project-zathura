import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';

interface GameHeaderProps {
  firePoints: number;
  xpPoints: number;
}

const GameHeader: React.FC<GameHeaderProps> = ({ firePoints, xpPoints }) => {
  return (
    <div className='flex justify-between items-center py-4 px-4'>
      <Menu size={24} />
      <div className='flex gap-2'>
        <div className='rounded-full bg-[#292929] px-3 py-1 flex items-center gap-1.5'>
          <span className='text-orange-500'>🔥</span>
          <span className='text-white font-semibold font-inter'>{firePoints}</span>
        </div>

        <div className='rounded-full bg-[#292929] px-3 py-1 flex items-center gap-1.5'>
          <span className='text-yellow-400'>🏅</span>
          <span className='text-white font-semibold font-inter'>{xpPoints} XP</span>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
