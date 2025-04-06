'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function LogoutPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({
      redirectTo: '/login',
    });
  };

  return (
    <div className='flex items-center justify-center min-h-screen px-4 bg-[#1E1E1E]'>
      <Card className='w-full max-w-md bg-[#292929] border border-[#49454F] shadow-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-white font-satoshi'>Log out</CardTitle>
          <CardDescription className='text-[#86858d]'>
            Are you sure you want to log out of your account?
          </CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center pt-4'>
          <Button
            onClick={handleLogout}
            className='px-8 py-6 rounded-xl border border-[#90FE95] bg-[#292929] text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 active:translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#3AFFE1]'
            disabled={isLoading}
            style={{ boxShadow: '0px 3px 0px 0px #3affe1' }}
          >
            {isLoading ? 'Logging out...' : 'Log out'}
          </Button>
        </CardContent>
        <CardFooter className='flex justify-center pb-6'>
          <div className='text-[#86858d]'>
            Changed your mind?{' '}
            <Link href='/dashboard' className='text-[#90FE95] hover:underline font-medium'>
              Return to dashboard
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
