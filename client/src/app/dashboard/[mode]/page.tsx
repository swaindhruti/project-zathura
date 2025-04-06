import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function DifficultySelector({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  console.log(mode);
  return (
    <div className='min-h-screen bg-[#1C1C1E] text-white p-4 flex justify-center'>
      <div className='w-full max-w-md mx-auto'>
        <div className='flex justify-between items-center mb-8 md:mb-12'>
          <Link href={'/dashboard'} className='p-2 bg-[#FFF] rounded-xl'>
            <ArrowLeft size={20} color='#000' />
          </Link>
          <button className='help-button font-satoshi'>How to Play ?</button>
        </div>

        <h1 className='text-2xl md:text-3xl font-semibold mb-10 md:mb-16 font-air'>
          Choose Difficulty
          <br />
          Level ?
        </h1>

        <div className='flex items-center gap-4 flex-col !w-full'>
          <Link href={`/dashboard/${mode}/easy`} className='w-full'>
            <button className='difficulty-button difficulty-easy'>EASY</button>
          </Link>
          <Link href={`/dashboard/${mode}/moderate`} className='w-full'>
            <button className='difficulty-button difficulty-medium'>MEDIUM</button>
          </Link>
          <Link href={`/dashboard/${mode}/hard`} className='w-full'>
            <button className='difficulty-button difficulty-hard'>HARD</button>
          </Link>
        </div>

        {/* <div className='mt-8 md:mt-12 mb-6 md:mb-10'>
          <button className='search-players-button'>SEARCH PLAYERS</button>
        </div> */}
      </div>
    </div>
  );
}

export default DifficultySelector;
