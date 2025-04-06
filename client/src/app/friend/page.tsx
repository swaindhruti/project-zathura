'use client';
import GameNavigation from '@/components/layout/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const VSFriendFlow = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [currentView, setCurrentView] = useState<'main' | 'createRoom'>('main');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const userId = 'VS12345';

  const handleCreateRoomClick = () => {
    setCurrentView('createRoom');
  };

  const handleBackClick = () => {
    setCurrentView('main');
  };

  const playerOptions = [2, 3, 4, 5, 6];

  return (
    <div className=' text-white min-h-screen p-4'>
      <div className='max-w-md mx-auto'>
        {/* Main title */}
        <div className='flex justify-between'>
          <span
            className='flex w-8 h-8 p-1.5 justify-center align-center items-center cursor-pointer'
            style={{
              borderRadius: '7.111px',
              border: '0.889px solid #393939',
              background: '#FFF',
              boxShadow: '0px 4px 0px 0px #373737',
            }}
            onClick={currentView === 'createRoom' ? handleBackClick : undefined}
          >
            <ArrowLeft color='#000' />
          </span>
          <h1 className='text-2xl font-medium mb-8 text-[#fff]'>
            {currentView === 'main' ? 'Invite Friends' : 'Create Your Room'}
          </h1>
          <div></div>
        </div>

        {currentView === 'main' ? (
          <>
            {/* Tabs */}
            <div className='flex border-b border-[#49454F] mb-8 justify-evenly'>
              <button
                className={`pb-2 px-4 font-medium ${activeTab === 'friends' ? 'text-[#90FE95] border-b-2 border-[#90FE95]' : 'text-[#86858d]'}`}
                onClick={() => setActiveTab('friends')}
              >
                Friends
              </button>
              <button
                className={`pb-2 px-4 font-medium ${activeTab === 'requests' ? 'text-[#90FE95] border-b-2 border-[#90FE95]' : 'text-[#86858d]'}`}
                onClick={() => setActiveTab('requests')}
              >
                Requests
              </button>
            </div>

            {/* Empty state */}
            <div className='text-center flex flex-col mt-16 justify-center'>
              <div>
                <span className='flex justify-center items-center w-full h-full mx-auto mb-4'>
                  <Image
                    src='https://res.cloudinary.com/dqqyuvg1v/image/upload/v1743897023/Frame_2609334_aftwjc.png'
                    height={200}
                    width={200}
                    alt='add'
                    className='mx-auto mb-4'
                  />
                </span>
              </div>

              <div className='mb-8'>
                <b>OR</b>
              </div>

              <div className='grid grid-rows-2 gap-1 mb-10'>
                <p className='text-center text-[#797979] text-xs font-medium'>
                  Friend not on the app?
                </p>
                <p className='text-center text-[#797979] text-xs font-medium'>
                  Share this ID with your friends
                </p>
              </div>

              {/* Action buttons */}
              <div className='grid grid-rows-2 gap-4 mb-20'>
                <button
                  className='py-3 px-4 rounded-lg font-medium text-white'
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #6D6D6D',
                    background: '#292929',
                    boxShadow: '0px 3px 0px 0px #4E4E4E',
                  }}
                  onClick={handleCreateRoomClick}
                >
                  Create Room
                </button>
                <button
                  className='py-3 px-4 rounded-lg font-medium text-white'
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #6D6D6D',
                    background: '#292929',
                    boxShadow: '0px 3px 0px 0px #4E4E4E',
                  }}
                >
                  Join Room
                </button>
              </div>
            </div>
          </>
        ) : (
          // Create Room View
          <div className='text-center flex flex-col mt-8 justify-center'>
            <div className='mb-10'>
              <p className='text-left text-white text-base font-medium mb-3'>Number of Players</p>
              <div className='relative'>
                <div
                  className='p-3 rounded-lg flex justify-between items-center cursor-pointer'
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
                    className='absolute top-full left-0 right-0 mt-1 rounded-lg z-10'
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
                className='w-full py-3 px-4 rounded-lg font-medium text-white'
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
        )}

        <GameNavigation />
      </div>
    </div>
  );
};

export default VSFriendFlow;
