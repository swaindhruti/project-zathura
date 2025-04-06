import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FlameIcon, TestTube, UserCircle } from 'lucide-react';

interface GameHeaderProps {
  firePoints: number;
  xpPoints: number;
}

const GameHeader: React.FC<GameHeaderProps> = ({ firePoints, xpPoints }) => {
  return (
    <div className='flex justify-between items-center px-5 py-3 bg-black/20'>
      <div className='flex gap-3'>
        <div className='flex items-center gap-1'>
          <FlameIcon />
          <span className='text-white text-sm font-[500]'>{firePoints}</span>
        </div>

        <div className='flex items-center gap-1'>
          <TestTube />
          <span className='text-white text-sm font-[500]'>{xpPoints}</span>
        </div>
      </div>

      <Link href='/dashboard/profile' className='text-white hover:text-[#90FE95] transition-colors'>
        <UserCircle size={28} />
      </Link>
    </div>
  );
};

export default GameHeader;
