'use client';
import React from 'react';

import { Users, Clock, User } from 'lucide-react';
import GameModeCard from '@/components/dashboard/game-mode-card';

import Image from 'next/image';

const Dashboard = () => {
  return (
    <div className='px-5 py-2 flex flex-col h-[78dvh]'>
      {/* Header section fixed at top */}
      <div className='flex items-start flex-col gap-1.5 mb-6'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>HECTOCLASH</h1>
        <p className='text-white font-satoshi font-[500] text-sm'>Welcome to the arena warrior!</p>
      </div>

      {/* Game modes centered in the remaining space */}
      <div className='flex flex-col gap-3 w-full flex-grow flex-shrink-0 justify-center'>
        <GameModeCard
          link='/dashboard/multiplayer'
          title='MULTIPLAYER'
          subtitle='Quick-Duel Match'
          className='multiplayer-card'
          tags={[
            {
              icon: <Users size={16} />,
              text: 'PvP',
            },
            {
              icon: <Clock size={16} />,
              text: 'Real Time',
            },
          ]}
          icon={
            <div>
              <Image src={'/icons/sword.svg'} alt='sword' width={80} height={80} />
            </div>
          }
        />

        <GameModeCard
          link='coming-soon'
          title='TOURNAMENT'
          subtitle='Quick-Duel Match'
          className='tournament-card'
          tags={[
            {
              icon: <Users size={16} />,
              text: 'Grp v Grp',
            },
            {
              icon: <Clock size={16} />,
              text: 'Real Time',
            },
          ]}
          icon={
            <div className='crossed-swords'>
              <Image
                src={'/icons/trophy.svg'}
                alt='sword'
                width={80}
                height={80}
                className='brightness-[300%]'
              />
            </div>
          }
        />

        <div className='grid grid-cols-2 gap-2'>
          <GameModeCard
            link='/dashboard/dual'
            title='VS FRIENDS'
            subtitle='Quick-Duel Match'
            className='friends-card'
            tags={[
              {
                icon: <User size={16} />,
                text: 'You v Friend',
              },
            ]}
          />

          <GameModeCard
            link='/dashboard/solo'
            title='SOLO'
            subtitle='Training Ground'
            className='solo-card'
            tags={[
              {
                icon: <User size={16} />,
                text: 'Solo',
              },
              {
                icon: <Clock size={16} />,
                text: 'Practice',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
