'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { OnlinePlayer } from '@/types/game';

interface OnlinePlayersProps {
  onlinePlayers: OnlinePlayer[];
  sentInvitation: { id: string; toPlayer: string } | null;
  onInvitePlayer: (playerId: string) => void;
  onPlaySolo: () => void;
}

export default function OnlinePlayersList({
  onlinePlayers,
  sentInvitation,
  onInvitePlayer,
  onPlaySolo,
}: OnlinePlayersProps) {
  return (
    <>
      <div className='game-mode-card multiplayer-card p-5 mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold text-white font-air'>ONLINE PLAYERS</h2>
          <Users size={20} className='text-[#90FE95]' />
        </div>

        {onlinePlayers.length === 0 ? (
          <div className='bg-[#292929] p-5 rounded-lg text-center font-satoshi'>
            <p className='text-gray-400 py-2'>No players available right now</p>
            <p className='text-xs text-gray-500'>Try again later or play solo</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {onlinePlayers.map((player) => (
              <div
                key={player.id}
                className='flex items-center justify-between bg-[#292929] p-3 rounded-lg border border-[#757575]/30 hover:border-[#90FE95]/30 transition-all'
              >
                <div>
                  <p className='font-semibold text-white capitalize font-satoshi'>
                    {player.username}
                  </p>
                  <div className='flex items-center'>
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        player.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    ></div>
                    <p className='text-xs text-gray-400 font-satoshi'>
                      {player.difficulty ? `${player.difficulty} difficulty` : 'Any difficulty'}
                    </p>
                  </div>
                </div>
                <button
                  className='bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 font-satoshi'
                  disabled={!!sentInvitation}
                  onClick={() => onInvitePlayer(player.id)}
                >
                  Challenge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='text-center'>
        <p className='text-gray-400 mb-3 font-satoshi'>Can't find anyone to play with?</p>
        <button onClick={onPlaySolo} className='search-players-button font-satoshi'>
          Play Solo Instead
        </button>
      </div>
    </>
  );
}
