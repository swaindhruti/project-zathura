import React from 'react';

interface UserAvatarProps {
  imageSrc: string;
  name: string;
  xp: number;
  highlight?: boolean;
  badge?: number;
}

const UserAvatar = ({ imageSrc, name, xp, highlight = false, badge }: UserAvatarProps) => {
  return (
    <div className='flex flex-col items-center'>
      <div className='relative'>
        <div
          className={`w-14 h-14 rounded-full overflow-hidden border-2 ${highlight ? 'border-yellow-400' : 'border-white'}`}
        >
          <img src={imageSrc} alt={name} className='w-full h-full object-cover' />
        </div>
        {badge && (
          <div className='absolute -bottom-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'>
            {badge}
          </div>
        )}
      </div>
      <p className='text-white font-medium mt-1'>{name}</p>
      <p className='text-white text-xs'>{xp.toLocaleString()} XP</p>
    </div>
  );
};

export default UserAvatar;
