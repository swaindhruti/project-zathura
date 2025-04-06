'use client';
import React from 'react';

const AuthErrorBanner = ({
  authError,
  router,
  setAuthError,
}: {
  authError: boolean;
  router: any;
  setAuthError: (value: boolean) => void;
}) => {
  if (!authError) return null;

  return (
    <div className='bg-red-600 text-white p-3 mb-4 rounded-lg'>
      <p className='text-sm font-satoshi'>
        Authentication error detected. You may need to log in again.
      </p>
      <div className='flex gap-2 mt-2'>
        <button
          className='text-xs bg-white text-red-600 px-2 py-1 rounded font-satoshi'
          onClick={() => router.push('/login')}
        >
          Log in
        </button>
        <button
          className='text-xs border border-white px-2 py-1 rounded font-satoshi'
          onClick={() => setAuthError(false)}
        >
          Continue in demo mode
        </button>
      </div>
    </div>
  );
};

export default AuthErrorBanner;
