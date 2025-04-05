'use client';
import { Button } from '@/components/ui/button';
import React from 'react';
import { signOut } from 'next-auth/react';

export default function Page() {
  return (
    <div>
      <Button
        onClick={() =>
          signOut({
            redirectTo: '/login',
          })
        }
      >
        Logout
      </Button>
    </div>
  );
}
