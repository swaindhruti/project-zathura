import { Home } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function Page() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 md:p-8'>
      <div
        className='w-full max-w-2xl p-8 md:p-10 rounded-[0.625rem] border border-[#757575]/80 text-center'
        style={{
          background:
            'linear-gradient(104deg, #90d7fe -28.13%, #4e757d -21.61%, #496672 -16.89%, #426466 -11.7%, #1e1e1e 13.51%, #262a2e 70.71%, rgba(144, 236, 254, 0.55) 212.64%)',
        }}
      >
        <h1 className='text-4xl md:text-5xl font-bold text-center font-air mb-6 text-[#90fe95]'>
          Coming Soon
        </h1>

        <div className='w-16 h-1 bg-[#3AFFE1] mx-auto my-6 rounded-full' />

        <p className='text-center text-lg md:text-xl mt-4 font-satoshi mb-8 text-[#f5f5f5]'>
          We're working on something exciting! Stay tuned for upcoming features.
        </p>

        <div className='mt-8'>
          <Link href={'/dashboard'} className='flex items-center justify-between w-full'>
            <span>Go Home</span>
            <span>
              <Home />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
