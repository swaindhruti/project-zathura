'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/leaderboard/Header';
import CategoryTabs from '@/components/leaderboard/CategoryTabs';
import PerformanceCard from '@/components/leaderboard/PerformanceCard';
import Podium from '@/components/leaderboard/Podium';
import FullListButton from '@/components/leaderboard/FullListButton';
import { toast } from 'sonner';
import axios from 'axios';

// Default players as fallback if API fails
const defaultPlayers = [
  {
    id: 1,
    name: 'Harsh',
    imageSrc: 'https://i.pravatar.cc/150?img=3',
    xp: 1449,
    badge: 1,
  },
  {
    id: 2,
    name: 'Dhruvi',
    imageSrc: 'https://i.pravatar.cc/150?img=5',
    xp: 1449,
  },
  {
    id: 3,
    name: 'Ayush',
    imageSrc: 'https://i.pravatar.cc/150?img=7',
    xp: 1449,
  },
];

// Type for leaderboard user
interface LeaderboardUser {
  id: string;
  username: string;
  name?: string;
  profilePicture?: string;
  rating: number;
}

const LeaderboardClient = () => {
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [showFullList, setShowFullList] = useState(false);
  const [topPlayers, setTopPlayers] = useState(defaultPlayers);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/api/leaderboard');

        if (response.data?.success) {
          // Store all users data
          setAllUsers(response.data.data);

          // Map the top 3 users to the format expected by Podium component
          const top3 = response.data.data
            .slice(0, 3)
            .map((user: LeaderboardUser, index: number) => ({
              id: user.id,
              name: user.name || user.username,
              imageSrc: user.profilePicture || `https://i.pravatar.cc/150?img=${index + 3}`,
              xp: user.rating,
              badge: index === 0 ? 1 : undefined, // Only top player gets badge
            }));

          setTopPlayers(top3);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard data:', error);
        toast.error('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const handleToggleFullList = () => {
    setShowFullList(!showFullList);
  };

  return (
    <div className='flex flex-col min-h-screen bg-[#1A1A1A]'>
      <Header />

      <div className='flex-1 pb-20 mx-2'>
        <div className='max-w-md mx-auto'>
          <CategoryTabs />

          {loading ? (
            <div className='flex justify-center py-8'>
              <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3AFFE1]'></div>
            </div>
          ) : (
            <>
              <PerformanceCard rank={4} percentile={60} />

              {!showFullList ? (
                <>
                  <Podium players={topPlayers} />
                  <div className='px-4 mt-4'>
                    <FullListButton onClick={handleToggleFullList} />
                  </div>
                </>
              ) : (
                <div className='mt-6 px-4'>
                  <h2 className='text-white text-xl font-semibold mb-4'>Full Leaderboard</h2>
                  <div
                    className='bg-[#292929] rounded-xl border border-[#90FE95] overflow-hidden'
                    style={{ boxShadow: '0px 3px 0px 0px #3affe1' }}
                  >
                    <div className='px-4 py-3 bg-[#222222] text-white flex'>
                      <div className='w-10 font-medium text-[#3AFFE1]'>#</div>
                      <div className='flex-1 font-medium text-[#3AFFE1]'>Player</div>
                      <div className='w-20 text-right font-medium text-[#3AFFE1]'>Rating</div>
                    </div>

                    <div className='divide-y divide-[#333333]'>
                      {allUsers.map((user, index) => (
                        <div
                          key={user.id}
                          className={`px-4 py-3 flex items-center text-white ${
                            index < 3 ? 'bg-[#292929]/40' : ''
                          }`}
                        >
                          <div
                            className={`w-10 font-bold ${
                              index === 0
                                ? 'text-[#FFD700]'
                                : index === 1
                                  ? 'text-[#C0C0C0]'
                                  : index === 2
                                    ? 'text-[#CD7F32]'
                                    : 'text-white'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className='flex-1 flex items-center'>
                            <div className='h-10 w-10 rounded-full overflow-hidden mr-3 border-2 border-[#3AFFE1]'>
                              <img
                                src={
                                  user.profilePicture ||
                                  `https://i.pravatar.cc/150?img=${index % 10}`
                                }
                                alt={user.name || user.username}
                                className='h-full w-full object-cover'
                              />
                            </div>
                            <div>{user.name || user.username}</div>
                          </div>
                          <div className='w-20 text-right font-medium text-[#90FE95]'>
                            {user.rating}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleToggleFullList}
                    className='w-full mt-6 py-4 rounded-xl border border-[#90FE95] bg-[#292929] text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 active:translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#3AFFE1]'
                    style={{ boxShadow: '0px 3px 0px 0px #3affe1' }}
                  >
                    Show Top 3
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardClient;
