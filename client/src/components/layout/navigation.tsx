import React from 'react';
import { UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const GameNavigation: React.FC = ({}) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    return pathname.startsWith(path);
  };

  return (
    <div className='fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[475px] bg-[#1A1A1A] border-t border-gray-800 flex justify-around py-4'>
      <Link
        href='/dashboard'
        className={`nav-item font-satoshi ${isActive('/dashboard') ? 'nav-active' : 'text-gray-400'}`}
      >
        <Image src={'/icons/arena.svg'} alt='arena' width={24} height={24} className='mt-1' />
        Arena
      </Link>

      <Link
        href='/leaderboard'
        className={`nav-item ${isActive('/leaderboard') ? 'nav-active' : 'text-gray-400'}`}
      >
        <Image src={'/icons/leaderboard.svg'} alt='arena' width={24} height={24} className='mt-1' />
        Leaderboard
      </Link>

      <Link
        href='/dashboard/profile'
        className={`nav-item ${isActive('/profile') ? 'nav-active' : 'text-gray-400'}`}
      >
        <UserCircle className='size-6' />
        Profile
      </Link>
    </div>
  );
};

export default GameNavigation;
