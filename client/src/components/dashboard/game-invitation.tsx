'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import Image from 'next/image';
import { GameInvitation } from '@/types/game';

interface GameInvitationProps {
  pendingInvitation: GameInvitation | null;
  sentInvitation: { id: string; toPlayer: string } | null;
  onRespondToInvitation: (accept: boolean) => void;
  onCancelInvitation: () => void;
}

export default function GameInvitationUI({
  pendingInvitation,
  sentInvitation,
  onRespondToInvitation,
  onCancelInvitation,
}: GameInvitationProps) {
  if (!pendingInvitation && !sentInvitation) return null;

  return (
    <>
      {pendingInvitation && (
        <div className='fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 p-4 rounded-lg shadow-lg border-[1px] border-[#757575]/80 w-[90%] max-w-md'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-xl font-bold text-white'>GAME INVITATION</h3>
            <Image src={'/icons/sword.svg'} alt='challenge' width={24} height={24} />
          </div>

          <div className='bg-[#292929] p-3 rounded-lg mb-4'>
            <p className='text-gray-300'>
              <span className='font-bold text-white'>{pendingInvitation.fromPlayer.username}</span>{' '}
              has challenged you to a{' '}
              <span className='text-green-500'>{pendingInvitation.difficulty}</span> difficulty
              match
            </p>
          </div>

          <div className='flex justify-between gap-3'>
            <button
              onClick={() => onRespondToInvitation(true)}
              className='flex-1 bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105'
            >
              Accept
            </button>
            <button
              onClick={() => onRespondToInvitation(false)}
              className='flex-1 bg-[#292929] border border-[#757575] hover:bg-[#353535] text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105'
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {sentInvitation && (
        <div className='fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 p-4 rounded-lg shadow-lg border-[1px] border-[#757575]/80 w-[90%] max-w-md'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-xl font-bold text-white'>WAITING FOR RESPONSE</h3>
            <Clock size={20} className='text-[#90FE95]' />
          </div>

          <div className='bg-[#292929] p-3 rounded-lg mb-4 flex items-center justify-center'>
            <div className='mr-3'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[#90FE95]'></div>
            </div>
            <p className='text-gray-300'>
              Invitation sent to{' '}
              <span className='font-bold text-white'>{sentInvitation.toPlayer}</span>
            </p>
          </div>

          <div className='flex justify-center'>
            <button
              onClick={onCancelInvitation}
              className='bg-[#292929] border border-[#757575] hover:bg-[#353535] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
