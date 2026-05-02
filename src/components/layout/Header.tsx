import React from 'react';
import { MenuIcon } from '../icons/MenuIcon';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border sticky top-0 z-20">
      <div className="flex items-center">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
         </svg>
         <h1 className="text-xl font-bold ml-2">Dev Toolbox AI</h1>
      </div>
      <button 
        onClick={onMenuClick} 
        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Open menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>
    </header>
  );
};