import React from 'react';

interface PerformanceCardProps {
  rank: number;
  percentile: number;
}

const PerformanceCard = ({ rank, percentile }: PerformanceCardProps) => {
  return (
    <div
      className='mx-4 mb-6 p-4 rounded-xl border border-[#90FE95] bg-[#292929] relative overflow-hidden'
      style={{ boxShadow: '0px 3px 0px 0px #3affe1' }}
    >
      {/* Updated gradient background */}
      <div className='absolute inset-0 bg-gradient-to-br from-green-500 via-black to-green-800/60 opacity-40'></div>

      <div className='relative z-10 flex items-center w-full'>
        <div className='bg-[#3AFFE1] text-black font-bold text-lg p-2 rounded-lg mr-4 flex items-center justify-center min-w-[50px]'>
          #{rank}
        </div>
        <div className='text-white font-medium'>
          You are doing better than <span className='text-[#90FE95] font-bold'>{percentile}%</span>{' '}
          of other players!
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;
