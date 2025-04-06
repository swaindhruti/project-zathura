'use client';
import React, { useState } from 'react';

type Tab = 'global' | 'institutions';

const CategoryTabs = () => {
  const [activeTab, setActiveTab] = useState<Tab>('global');

  return (
    <div className='flex gap-2 mx-4 mb-8'>
      <button
        onClick={() => setActiveTab('global')}
        className={`flex-1 py-3 rounded-lg text-white font-medium transition-all duration-300 ${
          activeTab === 'global'
            ? 'bg-[#292929] border border-[#90FE95] shadow-[0_3px_0_0_#3affe1] hover:scale-[1.02]'
            : 'bg-[#1A1A1A] border border-gray-700 hover:border-gray-500 hover:bg-[#222222]'
        }`}
      >
        Global
      </button>
      <button
        onClick={() => setActiveTab('institutions')}
        className={`flex-1 py-3 rounded-lg text-white font-medium transition-all duration-300 ${
          activeTab === 'institutions'
            ? 'bg-[#292929] border border-[#90FE95] shadow-[0_3px_0_0_#3affe1] hover:scale-[1.02]'
            : 'bg-[#1A1A1A] border border-gray-700 hover:border-gray-500 hover:bg-[#222222]'
        }`}
      >
        Institutions
      </button>
    </div>
  );
};

export default CategoryTabs;
