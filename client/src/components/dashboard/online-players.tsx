'use client';

import React from 'react';
import { OnlinePlayer } from '@/types/game';

interface OnlinePlayersListProps {
  onlinePlayers: OnlinePlayer[];
  sentInvitation: { id: string; toPlayer: string } | null;
  onInvitePlayer: (playerId: string) => void;
  onPlaySolo: () => void;
  isDualMode?: boolean;
}

export default function OnlinePlayersList({
  onlinePlayers,
  sentInvitation,
  onInvitePlayer,
  onPlaySolo,
  isDualMode = false,
}: OnlinePlayersListProps) {
  return (
    <div className='game-mode-card p-6'>
      <h2 className='text-xl font-bold text-white mb-4'>
        {isDualMode ? 'Select a Player to Challenge' : 'Online Players'}
      </h2>

      {onlinePlayers.length === 0 && (
        <p className='text-gray-400 mb-4'>No players online at the moment.</p>
      )}

      {onlinePlayers.length > 0 && (
        <div className='space-y-3 max-h-96 overflow-y-auto mb-6'>
          {onlinePlayers.map((player) => (
            <div
              key={player.id}
              className='flex justify-between items-center bg-[#292929] p-3 rounded-lg'
            >
              <div className='flex items-center'>
                <div className='ml-3'>
                  <p className='text-white font-medium'>{player.username}</p>
                </div>
              </div>
              <button
                onClick={() => onInvitePlayer(player.id)}
                disabled={!!sentInvitation}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sentInvitation
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-[#353B35] border border-[#90FE95] text-white hover:bg-[#444F44]'
                }`}
              >
                {sentInvitation && sentInvitation.toPlayer === player.username
                  ? 'Invitation Sent'
                  : 'Challenge'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!isDualMode && (
        <div className='flex justify-center'>
          <button
            onClick={onPlaySolo}
            className='bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-6 py-3 rounded-lg transition-all duration-300'
          >
            Play Solo Instead
          </button>
        </div>
      )}

      {isDualMode && (
        <div className='flex justify-center'>
          <button
            onClick={() => window.history.back()}
            className='bg-[#292929] border border-[#90FE95] hover:bg-[#353B35] text-white px-6 py-3 rounded-lg transition-all duration-300'
          >
            Back to Game Modes
          </button>
        </div>
      )}
    </div>
  );
}
