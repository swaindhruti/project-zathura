'use client';

import React from 'react';
import Image from 'next/image';
import { UserPlus, Check, X } from 'lucide-react';
import type { FriendRequest } from '@/types/friend';

const RequestsList = ({
  isLoading,
  friendRequests,
  handleAddFriendClick,
  handleAcceptRequest,
  handleRejectRequest,
  handleCancelRequest,
}: {
  isLoading: boolean;
  friendRequests: { sent: FriendRequest[]; received: FriendRequest[] };
  handleAddFriendClick: () => void;
  handleAcceptRequest: (requestId: string) => void;
  handleRejectRequest: (requestId: string) => void;
  handleCancelRequest: (requestId: string) => void;
}) => {
  if (isLoading) {
    return <div className='text-center py-8 font-satoshi'>Loading requests...</div>;
  }

  const hasRequests = friendRequests.sent.length > 0 || friendRequests.received.length > 0;

  if (!hasRequests) {
    return (
      <div className='text-center py-8 flex flex-col items-center'>
        <Image
          src='https://res.cloudinary.com/dqqyuvg1v/image/upload/v1743897023/Frame_2609334_aftwjc.png'
          height={150}
          width={150}
          alt='No requests'
          className='mb-4'
        />
        <p className='text-[#86858d] mb-4 font-satoshi'>No pending friend requests</p>
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
    <div className='space-y-6'>
      {/* Received requests */}
      {friendRequests.received.length > 0 && (
        <div>
          <h3 className='font-medium mb-2 text-[#90FE95] font-satoshi'>Received Requests</h3>
          <div className='space-y-2'>
            {friendRequests.received.map((request) => (
              <div
                key={request.id}
                className='p-3 rounded-lg'
                style={{
                  borderRadius: '8px',
                  border: '1px solid #6D6D6D',
                  background: '#292929',
                }}
              >
                <div className='flex justify-between items-center mb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center'>
                      {request.sender?.firstName?.[0] || request.sender?.username?.[0] || '?'}
                    </div>
                    <div>
                      <p className='font-medium font-satoshi'>
                        {request.sender?.firstName && request.sender?.lastName
                          ? `${request.sender.firstName} ${request.sender.lastName}`
                          : request.sender?.username || 'Unknown User'}
                      </p>
                      {request.sender?.firstName && (
                        <p className='text-xs text-[#86858d] font-satoshi'>
                          @{request.sender?.username}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className='flex gap-2 justify-end'>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className='p-2 rounded-lg text-[#ff6b6b] border border-[#6D6D6D]'
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className='p-2 rounded-lg text-[#90FE95] border border-[#6D6D6D]'
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent requests */}
      {friendRequests.sent.length > 0 && (
        <div>
          <h3 className='font-medium mb-2 text-[#86858d] font-satoshi'>Sent Requests</h3>
          <div className='space-y-2'>
            {friendRequests.sent.map((request) => (
              <div
                key={request.id}
                className='p-3 rounded-lg'
                style={{
                  borderRadius: '8px',
                  border: '1px solid #6D6D6D',
                  background: '#292929',
                }}
              >
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center'>
                      {request.receiver?.firstName?.[0] || request.receiver?.username?.[0] || '?'}
                    </div>
                    <div>
                      <p className='font-medium font-satoshi'>
                        {request.receiver?.firstName && request.receiver?.lastName
                          ? `${request.receiver.firstName} ${request.receiver.lastName}`
                          : request.receiver?.username || 'Unknown User'}
                      </p>
                      {request.receiver?.firstName && (
                        <p className='text-xs text-[#86858d] font-satoshi'>
                          @{request.receiver?.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    className='p-2 text-[#ff6b6b] rounded-full hover:bg-[#3A3A3A]'
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsList;
