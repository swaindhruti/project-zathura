'use client';
import React from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
export default function Page() {
  return (
    <div>
      <Button
        onClick={() => {
          signOut({ callbackUrl: '/login' });
        }}
      >
        Logout
      </Button>
      Dashboard
    </div>
  );
}
