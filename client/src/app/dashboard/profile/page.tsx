'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, User, Zap, Activity, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  role: string;
  rating?: number;
  gamesPlayed?: number;
  gamesWon?: number;
}

interface ApiResponse {
  status: string;
  data: {
    user: UserData;
  };
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { makeRequest, isLoading } = useApi();
  const { data, status } = useSession();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        const token = data?.accessToken;
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await makeRequest(
          'GET',
          '/auth/me',
          token as string,
          null,
          'Failed to fetch profile'
        );
        // console.log('Profile response:', response);
        if (!response) toast.error('Some error occured');
        setProfile(response.data.user);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [status, data?.accessToken]);

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className='min-h-[100dvh] bg-[#1E1E1E] px-4 py-6 sm:px-5 text-white'>
      <div className='flex items-center mb-8'>
        <Link
          href='/dashboard'
          className='flex items-center justify-center mr-4 rounded-full w-10 h-10 bg-[#353535] hover:bg-[#444F44] transition-all duration-300'
        >
          <ArrowLeft size={20} className='text-[#90fe95]' />
        </Link>
        <h1 className='text-2xl md:text-3xl font-santoshi'>Your Profile</h1>
      </div>

      {loading && (
        <div className='flex justify-center items-center h-[50vh]'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#90FE95]'></div>
        </div>
      )}

      {error && (
        <div className='tournament-card p-6 rounded-lg text-center'>
          <p className='text-red-400 font-medium'>{error}</p>
        </div>
      )}

      {profile && !loading && (
        <div className='flex flex-col gap-6 pb-20'>
          {/* User Info Card */}
          <div className='solo-card rounded-[0.625rem] p-6 border border-[#757575]/80 transition-all duration-300'>
            <div className='flex flex-col sm:flex-row items-center gap-6 mb-6'>
              <div className='bg-[#292929] rounded-full p-4 size-24 flex items-center justify-center border-2 border-[#90FE95]'>
                <User size={48} className='text-[#90FE95]' />
              </div>
              <div className='text-center sm:text-left'>
                <h2 className='text-2xl md:text-3xl font-santoshi mb-1'>{profile.username}</h2>
                <div className='bg-[#353B35] text-[#90FE95] px-3 py-1 rounded-full text-sm font-medium inline-block'>
                  {profile.role}
                </div>
              </div>
            </div>

            <div className='mt-6 space-y-4 bg-[#292929] p-4 rounded-lg'>
              {(profile.firstName || profile.lastName) && (
                <div className='flex items-center gap-3'>
                  <User size={18} className='text-[#90FE95]' />
                  <span className='text-white font-santoshi'>
                    {profile.firstName} {profile.lastName}
                  </span>
                </div>
              )}

              <div className='flex items-center gap-3'>
                <Mail size={18} className='text-[#90FE95]' />
                <span className='text-white font-santoshi'>{profile.email}</span>
              </div>

              <div className='flex items-center gap-3'>
                <Calendar size={18} className='text-[#90FE95]' />
                <span className='text-white font-santoshi'>
                  Member since {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Game Stats Section */}
          {profile.rating !== undefined ||
          profile.gamesPlayed !== undefined ||
          profile.gamesWon !== undefined ? (
            <div className='tournament-card rounded-[0.625rem] p-6 border border-[#757575]/80'>
              <h3 className='text-xl font-bold mb-6 flex items-center gap-3'>
                <Trophy size={22} className='text-[#90FE95]' />
                Game Statistics
              </h3>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                {profile.rating !== undefined && (
                  <div className='flex flex-col items-center p-4 bg-[#292929] rounded-lg border border-[#757575]'>
                    <Zap size={28} className='text-[#90FE95] mb-3' />
                    <p className='text-sm text-gray-300'>Rating</p>
                    <p className='text-2xl font-bold'>{profile.rating}</p>
                  </div>
                )}

                {profile.gamesPlayed !== undefined && (
                  <div className='flex flex-col items-center p-4 bg-[#292929] rounded-lg border border-[#757575]'>
                    <Activity size={28} className='text-[#90d7fe] mb-3' />
                    <p className='text-sm text-gray-300'>Games</p>
                    <p className='text-2xl font-bold'>{profile.gamesPlayed}</p>
                  </div>
                )}

                {profile.gamesWon !== undefined && (
                  <div className='flex flex-col items-center p-4 bg-[#292929] rounded-lg border border-[#757575]'>
                    <Trophy size={28} className='text-[#90FE95] mb-3' />
                    <p className='text-sm text-gray-300'>Wins</p>
                    <p className='text-2xl font-bold'>{profile.gamesWon}</p>
                  </div>
                )}
              </div>

              {profile.gamesPlayed && profile.gamesWon && profile.gamesPlayed > 0 && (
                <div className='mt-6 p-4 bg-[#292929] rounded-lg'>
                  <div className='flex justify-between items-center'>
                    <p className='text-gray-300'>Win Rate</p>
                    <p className='text-xl font-bold text-[#90FE95]'>
                      {((profile.gamesWon / profile.gamesPlayed) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className='mt-2 w-full bg-[#353B35] rounded-full h-2.5'>
                    <div
                      className='bg-[#90FE95] h-2.5 rounded-full'
                      style={{ width: `${(profile.gamesWon / profile.gamesPlayed) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='friends-card rounded-[0.625rem] p-6 text-center border border-[#757575]/80'>
              <Trophy size={36} className='text-[#90FE95] mx-auto mb-4' />
              <h3 className='text-xl font-bold mb-3'>No Game Statistics Yet</h3>
              <p className='text-gray-400'>Start playing to build your stats!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
