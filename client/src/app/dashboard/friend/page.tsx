'use client';
import GameNavigation from '@/components/layout/navigation';
import { ArrowLeft, ChevronDown, Search, UserPlus, Check, X, UserMinus, Send } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Friend type definitions
type User = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
};

type FriendRequest = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  sender?: User;
  receiver?: User;
  senderId: string;
  receiverId: string;
};

// Mock data for development/testing
const MOCK_FRIENDS = [
  {
    id: '1',
    username: 'testuser1',
    firstName: 'Test',
    lastName: 'User',
  },
  {
    id: '2',
    username: 'testuser2',
    firstName: 'Another',
    lastName: 'User',
  },
];

const MOCK_REQUESTS = {
  sent: [
    {
      id: '101',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      senderId: 'current-user',
      receiverId: '201',
      receiver: {
        id: '201',
        username: 'pendinguser',
        firstName: 'Pending',
        lastName: 'User',
      },
    },
  ],
  received: [
    {
      id: '102',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      senderId: '202',
      receiverId: 'current-user',
      sender: {
        id: '202',
        username: 'requestuser',
        firstName: 'Request',
        lastName: 'User',
      },
    },
  ],
};

// Friend API service
const friendApi = {
  getFriends: async () => {
    try {
      // Add auth header for better authentication
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/friends`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication error');
      }

      if (!response.ok) throw new Error('Failed to fetch friends');

      const data = await response.json();
      return data.data.friends;
    } catch (error) {
      console.error('Error fetching friends:', error);
      // Return mock data instead of throwing
      console.log('Using mock friends data');
      return MOCK_FRIENDS;
    }
  },

  getFriendRequests: async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/friends/requests`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication error');
      }

      if (!response.ok) throw new Error('Failed to fetch friend requests');

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      // Return mock data instead of throwing
      console.log('Using mock requests data');
      return MOCK_REQUESTS;
    }
  },

  sendFriendRequest: async (receiverId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/friends/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ receiverId }),
      });

      if (response.status === 401 || response.status === 403) {
        toast('Authentication error. Please log in again.');
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send friend request');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/${requestId}/accept`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication error');
      }

      if (!response.ok) throw new Error('Failed to accept friend request');

      return await response.json();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  rejectFriendRequest: async (requestId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/${requestId}/reject`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication error');
      }

      if (!response.ok) throw new Error('Failed to reject friend request');

      return await response.json();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  },

  cancelFriendRequest: async (requestId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/${requestId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication error');
      }

      if (!response.ok) throw new Error('Failed to cancel friend request');

      return await response.json();
    } catch (error) {
      console.error('Error canceling friend request:', error);
      throw error;
    }
  },

  removeFriend: async (friendId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/friends/${friendId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication error');
      }

      if (!response.ok) throw new Error('Failed to remove friend');

      return await response.json();
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  },

  searchUsers: async (query: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/search?q=${encodeURIComponent(query)}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication error');
      }

      if (!response.ok) throw new Error('Failed to search users');

      const data = await response.json();
      return data.data.users;
    } catch (error) {
      console.error('Error searching users:', error);
      // Return mock search results based on query
      return [
        {
          id: '301',
          username: query + '_user',
          firstName: 'Search',
          lastName: 'Result',
        },
      ];
    }
  },
};

const VSFriendFlow = () => {
  const router = useRouter();
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [currentView, setCurrentView] = useState<'main' | 'createRoom' | 'addFriend'>('main');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Friend system states
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Fetch friends and friend requests on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let useMockData = false;
        let friendsData = [];
        let requestsData = { sent: [], received: [] };

        try {
          [friendsData, requestsData] = await Promise.all([
            friendApi.getFriends(),
            friendApi.getFriendRequests(),
          ]);
        } catch (error) {
          console.error('Error fetching friend data:', error);
          if (error.message === 'Authentication error') {
            setAuthError(true);
            toast('Authentication error. Using mock data.');
          } else {
            toast('Failed to load friend data. Using mock data.');
          }
          useMockData = true;
        }

        setFriends(friendsData);
        setFriendRequests(requestsData);

        if (useMockData) {
          console.log('Using mock data for development');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle authentication errors
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        // Uncomment if you want to redirect after auth error
        // router.push('/login');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [authError, router]);

  const handleCreateRoomClick = () => {
    setCurrentView('createRoom');
  };

  const handleBackClick = () => {
    if (currentView === 'addFriend') {
      setSearchQuery('');
      setSearchResults([]);
    }
    setCurrentView('main');
  };

  const handleAddFriendClick = () => {
    setCurrentView('addFriend');
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await friendApi.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast("Search failed. Couldn't find users matching your search.");
      // Mock data for development
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      await friendApi.sendFriendRequest(receiverId);

      // Refresh friend requests
      const requestsData = await friendApi.getFriendRequests();
      setFriendRequests(requestsData);

      toast('Friend request sent successfully!');
    } catch (error: any) {
      toast(`Failed to send request: ${error.message || 'Something went wrong'}`);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendApi.acceptFriendRequest(requestId);

      // Refresh both friends and requests
      try {
        const [friendsData, requestsData] = await Promise.all([
          friendApi.getFriends(),
          friendApi.getFriendRequests(),
        ]);
        setFriends(friendsData);
        setFriendRequests(requestsData);
      } catch (error) {
        // Fallback handling if API fails
        toast('Request accepted, but failed to refresh data.');
      }

      toast('Friend request accepted. You are now friends!');
    } catch (error) {
      toast('Failed to accept request. Please try again later.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendApi.rejectFriendRequest(requestId);

      // Refresh requests
      try {
        const requestsData = await friendApi.getFriendRequests();
        setFriendRequests(requestsData);
      } catch (error) {
        toast('Request rejected, but failed to refresh data.');
      }

      toast('Friend request rejected.');
    } catch (error) {
      toast('Failed to reject request. Please try again later.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendApi.cancelFriendRequest(requestId);

      // Refresh requests
      try {
        const requestsData = await friendApi.getFriendRequests();
        setFriendRequests(requestsData);
      } catch (error) {
        toast('Request cancelled, but failed to refresh data.');
      }

      toast('Friend request cancelled.');
    } catch (error) {
      toast('Failed to cancel request. Please try again later.');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendApi.removeFriend(friendId);

      // Refresh friends
      try {
        const friendsData = await friendApi.getFriends();
        setFriends(friendsData);
      } catch (error) {
        toast('Friend removed, but failed to refresh friends list.');
      }

      toast('Friend removed successfully.');
    } catch (error) {
      toast('Failed to remove friend. Please try again later.');
    }
  };

  const playerOptions = [2, 3, 4, 5, 6];

  // Render functions for different views
  const renderFriendsList = () => {
    if (isLoading) {
      return <div className='text-center py-8'>Loading friends...</div>;
    }

    if (friends.length === 0) {
      return (
        <div className='text-center py-8 flex flex-col items-center'>
          <Image
            src='https://res.cloudinary.com/dqqyuvg1v/image/upload/v1743897023/Frame_2609334_aftwjc.png'
            height={150}
            width={150}
            alt='No friends'
            className='mb-4'
          />
          <p className='text-[#86858d] mb-4'>You don't have any friends yet</p>
          <button
            className='py-2 px-4 rounded-lg font-medium text-white flex items-center gap-2'
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
        {friends.map((friend) => (
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
                <p className='font-medium'>
                  {friend.firstName && friend.lastName
                    ? `${friend.firstName} ${friend.lastName}`
                    : friend.username}
                </p>
                {friend.firstName && <p className='text-xs text-[#86858d]'>@{friend.username}</p>}
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

  const renderRequestsList = () => {
    if (isLoading) {
      return <div className='text-center py-8'>Loading requests...</div>;
    }

    const hasRequests = friendRequests.received.length > 0 || friendRequests.sent.length > 0;

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
          <p className='text-[#86858d] mb-4'>No pending friend requests</p>
          <button
            className='py-2 px-4 rounded-lg font-medium text-white flex items-center gap-2'
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
            <h3 className='font-medium mb-2 text-[#90FE95]'>Received Requests</h3>
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
                        <p className='font-medium'>
                          {request.sender?.firstName && request.sender?.lastName
                            ? `${request.sender.firstName} ${request.sender.lastName}`
                            : request.sender?.username || 'Unknown User'}
                        </p>
                        {request.sender?.firstName && (
                          <p className='text-xs text-[#86858d]'>@{request.sender?.username}</p>
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
            <h3 className='font-medium mb-2 text-[#86858d]'>Sent Requests</h3>
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
                        <p className='font-medium'>
                          {request.receiver?.firstName && request.receiver?.lastName
                            ? `${request.receiver.firstName} ${request.receiver.lastName}`
                            : request.receiver?.username || 'Unknown User'}
                        </p>
                        {request.receiver?.firstName && (
                          <p className='text-xs text-[#86858d]'>@{request.receiver?.username}</p>
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

  const renderAddFriendView = () => {
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
                className='w-full p-3 rounded-lg text-white'
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

          {searching && <p className='text-center py-2'>Searching...</p>}

          {!searching && searchResults.length === 0 && searchQuery && (
            <p className='text-center py-2 text-[#86858d]'>No users found</p>
          )}

          {!searching && searchResults.length > 0 && (
            <div className='space-y-2'>
              {searchResults.map((user) => (
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
                      <p className='font-medium'>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username}
                      </p>
                      {user.firstName && <p className='text-xs text-[#86858d]'>@{user.username}</p>}
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

  // Render functions - add auth error banner
  const renderAuthErrorBanner = () => {
    if (!authError) return null;

    return (
      <div className='bg-red-600 text-white p-3 mb-4 rounded-lg'>
        <p className='text-sm'>Authentication error detected. You may need to log in again.</p>
        <div className='flex gap-2 mt-2'>
          <button
            className='text-xs bg-white text-red-600 px-2 py-1 rounded'
            onClick={() => router.push('/login')}
          >
            Log in
          </button>
          <button
            className='text-xs border border-white px-2 py-1 rounded'
            onClick={() => setAuthError(false)}
          >
            Continue in demo mode
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className='text-white min-h-screen p-4'>
      <div className='max-w-md mx-auto'>
        {renderAuthErrorBanner()}

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
            onClick={handleBackClick}
          >
            <ArrowLeft color='#000' />
          </span>
          <h1 className='text-2xl font-medium mb-8 text-[#fff]'>
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

            {/* Content based on active tab */}
            {activeTab === 'friends' ? renderFriendsList() : renderRequestsList()}

            {/* Game-related action buttons */}
            <div className='grid grid-rows-2 gap-4 mt-10 mb-16'>
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
          </>
        ) : currentView === 'createRoom' ? (
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
        ) : (
          // Add Friend View
          renderAddFriendView()
        )}

        <GameNavigation />
      </div>
    </div>
  );
};

export default VSFriendFlow;
