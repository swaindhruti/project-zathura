// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft } from 'lucide-react';
import AddFriendView from '@/components/dashboard/friend/add-friend-view';
import AuthErrorBanner from '@/components/dashboard/friend/auth-error-banner';
import CreateRoomView from '@/components/dashboard/friend/create-room-view';
import FriendsList from '@/components/dashboard/friend/friends-list';
import RequestsList from '@/components/dashboard/friend/requests-list';
import GameNavigation from '@/components/layout/navigation';
import { friendApi } from '@/lib/friend-api';
import { FriendRequest } from '@/types/friend';
import { User } from 'next-auth';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { get } from 'http';

const VSFriendFlow = () => {
  const router = useRouter();
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [currentView, setCurrentView] = useState<'main' | 'createRoom' | 'addFriend'>('main');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [dataLoaded, setLoadedData] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const { makeRequest, isLoading } = useApi();
  const { data: userInfo, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && !dataLoaded) {
      getFriendsAndRequests();
      setLoadedData(true);
    }
  }, [status]);

  async function getFriendsAndRequests() {
    if (status === 'unauthenticated') return;

    try {
      const [friendsData, requestsData, usersData] = await Promise.all([
        makeRequest(
          'GET',
          '/friends',
          userInfo?.accessToken,
          null,
          'Failed to fetch friends',
          false
        ),
        makeRequest(
          'GET',
          '/friends/requests',
          userInfo?.accessToken,
          null,
          'Failed to fetch friend requests',
          false
        ),
        makeRequest('GET', '/users', userInfo?.accessToken, null, 'Failed to fetch users', false),
      ]);

      setFriends(friendsData || []);
      setFriendRequests(requestsData || { sent: [], received: [] });

      if (usersData?.data?.users) {
        const filteredUsers = usersData.data.users.filter((user) => {
          return !requestsData?.data?.sent?.some((request) => request.receiverId === user.id);
        });

        setAllUsers(filteredUsers);
        setSearchResults(filteredUsers);
      }

      console.log('All Users:', usersData);
      console.log('Friends:', friendsData);
      console.log('Requests:', requestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast('Failed to load data. Please try again.');
    }
  }

  const handleCreateRoomClick = () => {
    setCurrentView('createRoom');
  };

  const handleBackClick = () => {
    if (currentView === 'addFriend') {
      setSearchQuery('');
      // Reset search results to show all users
      setSearchResults(allUsers);
    }
    setCurrentView('main');
  };

  const handleAddFriendClick = () => {
    setCurrentView('addFriend');
    // Reset search and show all users
    setSearchQuery('');
    setSearchResults(allUsers);
  };

  const handleSearchUsers = async () => {
    setSearching(true);
    try {
      if (!searchQuery.trim()) {
        // If search query is empty, show all users
        setSearchResults(allUsers);
      } else {
        // Filter users locally instead of making API call
        const filteredResults = allUsers.filter(
          (user) =>
            user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      toast("Search failed. Couldn't find users matching your search.");
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      if (!userInfo?.accessToken) return;

      const friendRequest = await makeRequest(
        'POST',
        '/friends/requests',
        userInfo?.accessToken,
        { receiverId },
        'Failed to send friend request',
        false
      );

      if (friendRequest?.data?.friendRequest) {
        window.location.reload();
      }

      toast('Friend request sent successfully!');
    } catch (error: any) {
      toast(`Failed to send request: ${error.message || 'Something went wrong'}`);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      if (!userInfo?.accessToken) return;
      const resp = await makeRequest(
        'PATCH',
        `/friends/requests/${requestId}/accept`,
        userInfo?.accessToken,
        null,
        'Failed to accept request',
        false
      );
      if (resp?.status === 'success') {
        toast('Friend request accepted. You are now friends!');
        window.location.reload();
      }
    } catch (error) {
      toast('Failed to accept request. Please try again later.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      if (!userInfo?.accessToken) return;
      const response = await makeRequest(
        'PATCH',
        `/friends/requests/${requestId}/reject`,
        userInfo?.accessToken,
        null,
        'Failed to reject request',
        false
      );
      if (response?.status === 'success') {
        toast('Friend request rejected.');
        window.location.reload();
      }
    } catch (error) {
      toast('Failed to reject request. Please try again later.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await makeRequest(
        'DELETE',
        `/friends/requests/${requestId}`,
        userInfo?.accessToken,
        null,
        'Failed to cancel request',
        false
      );

      if (response?.status === 'success') {
        toast('Friend request cancelled.');
        window.location.reload();
      }
    } catch (error) {
      toast('Failed to cancel request. Please try again later.');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const response = await makeRequest(
        'DELETE',
        `/friends/${friendId}`,
        userInfo?.accessToken,
        null,
        'Failed to remove friend',
        false
      );

      if (response?.status === 'success') {
        toast('Friend removed successfully.');
        window.location.reload();
      }
    } catch (error) {
      toast('Failed to remove friend. Please try again later.');
    }
  };

  return (
    <div className='text-white min-h-screen p-4'>
      <div className='max-w-md mx-auto'>
        <AuthErrorBanner authError={authError} router={router} setAuthError={setAuthError} />

        <div className='flex justify-between'>
          <span
            className='flex w-8 h-8 p-1.5 justify-center align-center items-center cursor-pointer'
            style={{
              borderRadius: '7.111px',
              border: '0.889px solid #393939',
              background: '#FFF',
              boxShadow: '0px 4px 0px 0px #373737',
            }}
            onClick={handleBackClick}
          >
            <ArrowLeft color='#000' />
          </span>
          <h1 className='text-2xl font-medium mb-8 text-[#fff] font-air text-2xl'>
            {currentView === 'main'
              ? 'Friends'
              : currentView === 'createRoom'
                ? 'Create Your Room'
                : 'Add Friend'}
          </h1>
          {currentView === 'main' && activeTab === 'friends' && (
            <button
              className='flex w-8 h-8 p-1.5 justify-center align-center items-center cursor-pointer'
              style={{
                borderRadius: '7.111px',
                border: '0.889px solid #393939',
                background: '#FFF',
                boxShadow: '0px 4px 0px 0px #373737',
              }}
              onClick={handleAddFriendClick}
            >
              <UserPlus color='#000' size={16} />
            </button>
          )}
          {(currentView !== 'main' || activeTab !== 'friends') && <div></div>}
        </div>

        {currentView === 'main' ? (
          <>
            <div className='flex border-b border-[#49454F] mb-8 justify-evenly'>
              <button
                className={`font-air pb-2 px-4 font-medium font-satoshi ${activeTab === 'friends' ? 'text-[#90FE95] border-b-2 border-[#90FE95]' : 'text-[#86858d]'}`}
                onClick={() => setActiveTab('friends')}
              >
                Friends
              </button>
              <button
                className={`pb-2 px-4 font-medium font-satoshi ${activeTab === 'requests' ? 'text-[#90FE95] border-b-2 border-[#90FE95]' : 'text-[#86858d]'}`}
                onClick={() => setActiveTab('requests')}
              >
                Requests
              </button>
            </div>

            {isLoading ? (
              'Loading...'
            ) : activeTab === 'friends' ? (
              <FriendsList
                isLoading={isLoading}
                friends={friends?.data?.friends || []}
                handleAddFriendClick={handleAddFriendClick}
                handleRemoveFriend={handleRemoveFriend}
              />
            ) : (
              <RequestsList
                isLoading={isLoading}
                friendRequests={{
                  sent: friendRequests.data.sent,
                  received: friendRequests.data.received,
                }}
                handleAddFriendClick={handleAddFriendClick}
                handleAcceptRequest={handleAcceptRequest}
                handleRejectRequest={handleRejectRequest}
                handleCancelRequest={handleCancelRequest}
              />
            )}

            {/* <div className='grid grid-rows-2 gap-4 mt-10 mb-16'>
              <button
                className='py-3 px-4 rounded-lg font-medium text-white font-satoshi'
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
                className='py-3 px-4 rounded-lg font-medium text-white font-satoshi'
                style={{
                  borderRadius: '8px',
                  border: '1px solid #6D6D6D',
                  background: '#292929',
                  boxShadow: '0px 3px 0px 0px #4E4E4E',
                }}
              >
                Join Room
              </button>
            </div> */}
          </>
        ) : currentView === 'createRoom' ? (
          <CreateRoomView
            playerCount={playerCount}
            setPlayerCount={setPlayerCount}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
          />
        ) : (
          <AddFriendView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearchUsers={handleSearchUsers}
            searching={searching}
            searchResults={searchResults}
            handleSendFriendRequest={handleSendFriendRequest}
          />
        )}

        <GameNavigation />
      </div>
    </div>
  );
};

export default VSFriendFlow;
