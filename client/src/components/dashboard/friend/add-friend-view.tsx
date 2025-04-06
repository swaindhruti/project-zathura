'use client';

import React, { useEffect, useState } from 'react';
import { Search, Send } from 'lucide-react';
import type { User } from '@/types/friend';
import { useSession } from 'next-auth/react';

const AddFriendView = ({
  searchQuery,
  setSearchQuery,
  handleSearchUsers,
  searching,
  searchResults,
  handleSendFriendRequest,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleSearchUsers: () => void;
  searching: boolean;
  searchResults: User[];
  handleSendFriendRequest: (userId: string) => void;
}) => {
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const { data, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') return;
    const filtered = searchResults.filter((user) => user.id !== data?.user.id);
    setFilteredUsers(filtered);
  }, [status]);
  return (
    <div className='mt-4'>
      <div className='mb-4'>
        <div className='flex gap-2 mb-6'>
          <div className='relative flex-1'>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by username'
              className='w-full p-3 rounded-lg text-white font-satoshi'
              style={{
                borderRadius: '8px',
                border: '1px solid #6D6D6D',
                background: '#292929',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchUsers();
                }
              }}
            />
          </div>
          <button
            onClick={handleSearchUsers}
            className='p-3 rounded-lg'
            style={{
              borderRadius: '8px',
              border: '1px solid #6D6D6D',
              background: '#292929',
              boxShadow: '0px 3px 0px 0px #4E4E4E',
            }}
            disabled={searching}
          >
            {searching ? '...' : <Search size={20} />}
          </button>
        </div>

        {searching && <p className='text-center py-2 font-satoshi'>Searching...</p>}

        {!searching && searchResults.length === 0 && searchQuery && (
          <p className='text-center py-2 text-[#86858d] font-satoshi'>No users found</p>
        )}

        {!searching && filteredUsers.length > 0 && (
          <div className='space-y-2'>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className='p-3 rounded-lg flex justify-between items-center'
                style={{
                  borderRadius: '8px',
                  border: '1px solid #6D6D6D',
                  background: '#292929',
                }}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center'>
                    {user.firstName?.[0] || user.username[0]}
                  </div>
                  <div>
                    <p className='font-medium font-satoshi'>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                    </p>
                    {user.firstName && (
                      <p className='text-xs text-[#86858d] font-satoshi'>@{user.username}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSendFriendRequest(user.id)}
                  className='p-2 rounded-lg text-white flex items-center gap-1'
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #6D6D6D',
                    background: '#292929',
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriendView;
