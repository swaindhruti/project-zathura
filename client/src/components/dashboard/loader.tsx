import React from 'react';

interface LoaderProps {
  difficulty: string;
  mode: string;
}

export default function Loader({ difficulty, mode }: LoaderProps) {
  return (
    <div className='flex flex-col items-center justify-center h-[80vh] px-5'>
      <div className='relative w-20 h-20 mb-4'>
        <div
          className='absolute w-full h-full rounded-full 
                         border-t-4 border-l-4 border-r-4 border-transparent 
                         border-b-4 border-green-500 
                         animate-spin'
          style={{
            background: 'linear-gradient(101deg, rgba(144, 254, 149, 0.1), rgba(78, 125, 80, 0.1))',
          }}
        ></div>
      </div>
      <div className='flex flex-col items-center'>
        <h2 className='text-xl font-[700] text-white mb-1'>Loading Game</h2>
        <p className='text-sm text-white/60 font-satoshi'>
          Preparing your {difficulty} level {mode} game...
        </p>
      </div>
      <div className='w-full max-w-xs bg-[#262e27] rounded-lg h-2 mt-6 overflow-hidden'>
        <div
          className='h-full bg-green-500 animate-pulse rounded-lg'
          style={{
            width: '60%',
            background: 'linear-gradient(90deg, #90fe95, #4e7d50)',
          }}
        ></div>
      </div>
    </div>
  );
}
