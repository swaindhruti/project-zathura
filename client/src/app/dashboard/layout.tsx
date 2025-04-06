'use client';

import GameHeader from '@/components/dashboard/game-header';
import GameNavigation from '@/components/layout/navigation';
import { SocketProvider } from '@/context/SocketContext';
import React from 'react';

export default function DashboardLayout({ children }: React.PropsWithChildren<{}>) {
  return (
    <SocketProvider>
      <div className='min-h-screen bg-[#1E1E1E] text-white flex justify-center relative'>
        <div className='fixed inset-0 z-0 bg-[#141414]'>
          <div className='absolute top-0 left-0 w-full h-full'>
            <div className='absolute top-10 left-10 w-96 h-96 rounded-full bg-[#90fe95] blur-[150px] opacity-25'></div>
            <div className='absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#90d7fe] blur-[150px] opacity-25'></div>

            <div className='absolute top-[15%] left-[20%] text-[60px] text-white opacity-30 animate-bounce duration-[8000ms]'>
              ∑
            </div>
            <div className='absolute top-[30%] right-[25%] text-[70px] text-white opacity-30 animate-pulse duration-[6000ms]'>
              π
            </div>
            <div className='absolute top-[50%] left-[65%] text-[50px] text-white opacity-30 animate-bounce duration-[7000ms]'>
              √
            </div>
            <div className='absolute bottom-[35%] left-[10%] text-[80px] text-white opacity-30 animate-pulse duration-[9000ms]'>
              ∫
            </div>
            <div className='absolute top-[65%] right-[15%] text-[55px] text-white opacity-30 animate-bounce duration-[8500ms]'>
              ±
            </div>
            <div className='absolute bottom-[20%] left-[40%] text-[65px] text-white opacity-30 animate-pulse duration-[7500ms]'>
              Δ
            </div>
            <div className='absolute top-[40%] left-[30%] text-[45px] text-white opacity-30 animate-bounce duration-[6500ms]'>
              ∞
            </div>
            <div className='absolute bottom-[50%] right-[35%] text-[75px] text-white opacity-30 animate-pulse duration-[10000ms]'>
              θ
            </div>
          </div>
        </div>

        <div className=' w-full max-w-[475px] relative shadow-2xl z-10'>
          <div className='min-h-screen bg-[#1E1E1E] bg-opacity-90 text-white'>
            <GameHeader firePoints={8} xpPoints={12} />
            {children}
            <GameNavigation />
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}
