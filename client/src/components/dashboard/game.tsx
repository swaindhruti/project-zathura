import React, { useEffect } from 'react';
import Loader from './loader';
import { useApi } from '@/hooks/use-api';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
interface GameProps {
  difficulty: string;
  mode: string;
}

export default function Game({ difficulty, mode }: GameProps) {
  const { isLoading, makeRequest } = useApi();
  const { data: session, status } = useSession();
  async function getPuzzles(token: string) {
    try {
      const response = await makeRequest('POST', '/hectoc/puzzle', token, {
        difficulty: difficulty,
      });
      console.log(response);
      if (!response) toast.error('Error Creating Puzzle');
    } catch (error) {
      console.error('Failed to load puzzles:', error);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      const token = session.accessToken;
      getPuzzles(token!);
    }
  }, [session, status]);

  if (isLoading) {
    return <Loader difficulty={difficulty} mode={mode} />;
  }
  return (
    <div>
      <div className='px-5 py-2'>
        <h1 className='text-4xl font-[900] tracking-wide text-white mb-1'>Game Page</h1>
        <p className='text-white mb-8 font-satoshi font-[500] text-sm'>
          {mode.charAt(0).toUpperCase() + mode.slice(1)} -{' '}
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
        </p>
        <div className='game-mode-card multiplayer-card'>
          <p className='text-white'>Game content will load here...</p>
        </div>
      </div>
    </div>
  );
}
