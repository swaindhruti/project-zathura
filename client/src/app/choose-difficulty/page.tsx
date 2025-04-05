import React from 'react';
import { ArrowLeft } from 'lucide-react';

function App() {
  return (
    <div className='min-h-screen bg-[#1C1C1E] text-white p-4'>
      {/* Header */}
      <div className='flex justify-between items-center mb-12'>
        <button className='p-2 bg-[#FFF] rounded-xl'>
          <ArrowLeft size={20} color='#000' />
        </button>
        <button
          className='px-4 py-2 flex items-center gap-2'
          style={{
            borderRadius: '8px',
            border: '1px solid #6D6D6D',
            background: '#292929',
            boxShadow: '0px 3px 0px 0px #4E4E4E',
          }}
        >
          How to Play?
        </button>
      </div>

      {/* Title */}
      <h1 className='text-3xl font-bold mb-16'>
        Choose Difficulty
        <br />
        Level ?
      </h1>

      {/* Difficulty Buttons */}
      <div className='space-y-4'>
        <button
          className='w-full py-6 text-2xl font-bold transition-all duration-300 ease-in-out hover:scale-105 active:border-[3px] active:border-[#00EFCA] rounded-[10px] border border-[#757575]'
          style={{
            background:
              'linear-gradient(101deg, #90FE95 -26.31%, #4E7D50 -19.97%, #49724A -15.38%, #426644 -10.33%, #1E1E1E 14.18%, #262E27 69.8%, rgba(144, 254, 149, 0.55) 207.82%)',
          }}
        >
          EASY
        </button>
        <button
          className='w-full py-6 text-2xl font-bold transition-all duration-300 ease-in-out hover:scale-105 active:border-[3px] active:border-[#00EFCA] rounded-[10px] border border-[#757575]'
          style={{
            background:
              'linear-gradient(104deg, #90D7FE -28.13%, #4E757D -21.61%, #496672 -16.89%, #426466 -11.7%, #1E1E1E 13.51%, #262A2E 70.71%, rgba(144, 236, 254, 0.55) 212.64%)',
          }}
        >
          MEDIUM
        </button>
        <button
          className='w-full py-6 text-2xl font-bold transition-all duration-300 ease-in-out hover:scale-105 active:border-[3px] active:border-[#00EFCA] rounded-[10px] border border-[#757575]'
          style={{
            background:
              'linear-gradient(104deg, #FEAB90 -28.13%, #7D4E4E -21.61%, #724D49 -16.89%, #664B42 -11.7%, #1E1E1E 13.51%, #2E2726 70.71%, rgba(254, 144, 144, 0.55) 212.64%)',
          }}
        >
          HARD
        </button>
      </div>

      {/* Search Players Button */}
      <div className='mt-12 mb-10'>
        <button
          className='w-full py-4 rounded-xl text-[#FFF] font-normal transition-all duration-300 hover:scale-105 active:scale-85 active:translate-y-1 active:shadow-none focus:outline-none focus:ring-2 focus:ring-[#3AFFE1] focus:ring-opacity-50'
          style={{
            borderRadius: '8px',
            border: '1px solid #90FE95',
            opacity: 0.5,
            background: '#292929',
            boxShadow: '0px 3px 0px 0px #3AFFE1',
          }}
        >
          SEARCH PLAYERS
        </button>
      </div>
    </div>
  );
}

export default App;
