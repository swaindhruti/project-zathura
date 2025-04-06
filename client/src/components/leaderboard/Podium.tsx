import React from 'react';
import UserAvatar from './UserAvatar';
import Image from 'next/image';

interface Player {
  id: number;
  name: string;
  imageSrc: string;
  xp: number;
  badge?: number;
}

interface PodiumProps {
  players: Player[];
}

const Podium = ({ players }: PodiumProps) => {
  // Make sure we have exactly 3 players
  const topThree = players.slice(0, 3);

  // Reorder for display: second place (index 1), first place (index 0), third place (index 2)
  const orderedForDisplay = [topThree[1], topThree[0], topThree[2]];

  // SVG URLs for position numbers
  const positionSvgs = {
    1: 'https://res.cloudinary.com/dhv234qct/image/upload/v1743908039/oou99plv6kctvof7klpg.svg',
    2: 'https://res.cloudinary.com/dhv234qct/image/upload/v1743908039/pcnr9xpo8s6z1h9qx4hy.svg',
    3: 'https://res.cloudinary.com/dhv234qct/image/upload/v1743908039/ddbssamtmfbbskzqmtcl.svg',
  };

  return (
    <div className='flex justify-between items-end mx-0 mb-6 relative pt-8'>
      {/* Second Place - Left */}
      <div className='flex flex-col items-center w-1/3'>
        <UserAvatar
          imageSrc={orderedForDisplay[0].imageSrc}
          name={orderedForDisplay[0].name}
          xp={orderedForDisplay[0].xp}
        />
        <div className='mt-2 flex items-center justify-center w-full'>
          <Image
            width={12}
            height={24}
            src={positionSvgs[2]}
            alt='2'
            className='w-full h-60 object-contain'
          />
        </div>
      </div>

      {/* First Place - Middle (Tallest) */}
      <div className='flex flex-col items-center z-10 -mt-4 w-1/3'>
        <UserAvatar
          imageSrc={orderedForDisplay[1].imageSrc}
          name={orderedForDisplay[1].name}
          xp={orderedForDisplay[1].xp}
          highlight={true}
          badge={orderedForDisplay[1].badge}
        />
        <div className='mt-2 flex items-center justify-center w-full'>
          <Image
            width={12}
            height={24}
            src={positionSvgs[1]}
            alt='1'
            className='w-full h-72 object-contain'
          />
        </div>
      </div>

      {/* Third Place - Right */}
      <div className='flex flex-col items-center w-1/3'>
        <UserAvatar
          imageSrc={orderedForDisplay[2].imageSrc}
          name={orderedForDisplay[2].name}
          xp={orderedForDisplay[2].xp}
        />
        <div className='mt-2 flex items-center justify-center w-full'>
          <Image
            width={12}
            height={24}
            src={positionSvgs[3]}
            alt='3'
            className='w-full h-56 object-contain'
          />
        </div>
      </div>
    </div>
  );
};

export default Podium;
