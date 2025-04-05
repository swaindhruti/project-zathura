import React from 'react';

interface GameModeTagProps {
  icon: React.ReactNode;
  text: string;
}

const GameModeTag: React.FC<GameModeTagProps> = ({ icon, text }) => {
  return (
    <div className='game-tag'>
      {icon}
      <span className='font-satoshi'>{text}</span>
    </div>
  );
};

interface GameModeCardProps {
  title: string;
  subtitle: string;
  className?: string;
  tags: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  icon?: React.ReactNode;
}

const GameModeCard: React.FC<GameModeCardProps> = ({ title, subtitle, className, tags, icon }) => {
  return (
    <div className={`game-mode-card ${className} relative overflow-hidden`}>
      <div className='flex justify-between items-start'>
        <div>
          <h3 className='text-xl font-bold mb-1 font-air'>{title}</h3>
          <p className='text-sm text-white mb-3 font-satoshi'>{subtitle}</p>

          <div className='flex gap-2'>
            {tags.map((tag, index) => (
              <GameModeTag key={index} icon={tag.icon} text={tag.text} />
            ))}
          </div>
        </div>
      </div>
      {icon && (
        <div className='absolute top-4 right-4 opacity-30 pointer-events-none z-0'>{icon}</div>
      )}
    </div>
  );
};

export default GameModeCard;
