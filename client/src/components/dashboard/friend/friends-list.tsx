'use client';

import React from 'react';
import Image from 'next/image';
import { UserPlus, UserMinus } from 'lucide-react';
import type { User } from '@/types/friend';

const FriendsList = ({
  isLoading,
  friends,
  handleAddFriendClick,
  handleRemoveFriend,
}: {
  isLoading: boolean;
  friends: User[];
  handleAddFriendClick: () => void;
  handleRemoveFriend: (friendId: string) => void;
}) => {
  if (isLoading) {
    return <div className='text-center py-8 font-satoshi'>Loading friends...</div>;
  }

  if (friends && friends.length === 0) {
    return (
      <div className='text-center py-8 flex flex-col items-center'>
        <Image
          src='https://res.cloudinary.com/dqqyuvg1v/image/upload/v1743897023/Frame_2609334_aftwjc.png'
          height={150}
          width={150}
          alt='No friends'
          className='mb-4'
        />
        <p className='text-[#86858d] mb-4 font-satoshi'>You don't have any friends yet</p>
        <button
          className='py-2 px-4 rounded-lg font-medium text-white flex items-center gap-2 font-satoshi'
          style={{
            borderRadius: '8px',
            border: '1px solid #6D6D6D',
            background: '#292929',
            boxShadow: '0px 3px 0px 0px #4E4E4E',
          }}
          onClick={handleAddFriendClick}
        >
          <UserPlus size={16} />
          Add Friend
        </button>
      </div>
    );
  }

  return (
    <div className='mt-4 space-y-2'>
      {friends.length > 0 &&
        friends.map((friend) => (
          <div
            key={friend.id}
            className='p-3 rounded-lg flex justify-between items-center'
            style={{
              borderRadius: '8px',
              border: '1px solid #6D6D6D',
              background: '#292929',
            }}
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center'>
                {friend.firstName?.[0] || friend.username[0]}
              </div>
              <div>
                <p className='font-medium font-satoshi'>
                  {friend.firstName && friend.lastName
                    ? `${friend.firstName} ${friend.lastName}`
                    : friend.username}
                </p>
                {friend.firstName && (
                  <p className='text-xs text-[#86858d] font-satoshi'>@{friend.username}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRemoveFriend(friend.id)}
              className='p-2 text-[#ff6b6b] rounded-full hover:bg-[#3A3A3A]'
            >
              <UserMinus size={16} />
            </button>
          </div>
        ))}
    </div>
  );
};

export default FriendsList;
