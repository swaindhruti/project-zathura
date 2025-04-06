'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

const CreateRoomView = ({
  playerCount,
  setPlayerCount,
  showDropdown,
  setShowDropdown,
}: {
  playerCount: number;
  setPlayerCount: (count: number) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
}) => {
  const playerOptions = [2, 3, 4, 5, 6];

  return (
    <div className='text-center flex flex-col mt-8 justify-center'>
      <div className='mb-10'>
        <p className='text-left text-white text-base font-medium mb-3 font-satoshi'>
          Number of Players
        </p>
        <div className='relative'>
          <div
            className='p-3 rounded-lg flex justify-between items-center cursor-pointer font-satoshi'
            style={{
              borderRadius: '8px',
              border: '1px solid #6D6D6D',
              background: '#292929',
            }}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{playerCount} Players</span>
            <ChevronDown size={20} />
          </div>

          {showDropdown && (
            <div
              className='absolute top-full left-0 right-0 mt-1 rounded-lg z-10 font-satoshi'
              style={{
                background: '#292929',
                border: '1px solid #6D6D6D',
              }}
            >
              {playerOptions.map((num) => (
                <div
                  key={num}
                  className='p-3 cursor-pointer hover:bg-[#3A3A3A]'
                  onClick={() => {
                    setPlayerCount(num);
                    setShowDropdown(false);
                  }}
                >
                  {num} Players
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='mt-auto'>
        <button
          className='w-full py-3 px-4 rounded-lg font-medium text-white font-satoshi'
          style={{
            borderRadius: '8px',
            border: '1px solid #6D6D6D',
            background: '#292929',
            boxShadow: '0px 3px 0px 0px #4E4E4E',
          }}
        >
          Generate Room ID
        </button>
      </div>
    </div>
  );
};

export default CreateRoomView;
