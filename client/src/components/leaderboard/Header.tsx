'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const Header = () => {
  return (
    <div className='flex items-center justify-center relative py-4 px-4 mt-4'>
      <Link href='/dashboard' className='absolute left-4'>
        <ArrowLeft className='text-white ' size={24} />
      </Link>
      <h1 className='text-white font-satoshi text-3xl tracking-wider mb-4 font-semibold'>
        Leaderboard
      </h1>
    </div>
  );
};

export default Header;
