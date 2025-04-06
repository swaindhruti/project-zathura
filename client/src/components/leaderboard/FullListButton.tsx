import React from 'react';

interface FullListButtonProps {
  onClick: () => void;
}

const FullListButton: React.FC<FullListButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className='w-full py-6 rounded-xl border border-[#90FE95] bg-[#292929] text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 active:translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#3AFFE1]'
      style={{ boxShadow: '0px 3px 0px 0px #3affe1' }}
    >
      View Full Leaderboard
    </button>
  );
};

export default FullListButton;
