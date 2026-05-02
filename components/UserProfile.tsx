import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogoutIcon } from './icons/LogoutIcon';

export const UserProfile: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;
  
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full">
        <img
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || '')}&background=6366F1&color=fff`}
          alt="User avatar"
          className="w-9 h-9 rounded-full"
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-dark-surface rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-20">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-dark-border">
            <p className="text-sm font-semibold text-dark dark:text-dark-text truncate">{displayName}</p>
            {user.user_metadata?.full_name && <p className="text-xs text-gray-500 dark:text-dark-text-secondary truncate">{user.email}</p>}
          </div>
          <button
            onClick={signOutUser}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border flex items-center"
          >
            <LogoutIcon className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};