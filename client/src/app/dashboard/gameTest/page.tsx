import HectocGame from '@/components/HectocGame';
import React from 'react';

export const metadata = {
  title: 'Hectoc Game',
  description: 'Make 100 with mathematical operations',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
};

const HectocGamePage = () => {
  return (
    <div className='game-container'>
      <HectocGame />
    </div>
  );
};

export default HectocGamePage;
