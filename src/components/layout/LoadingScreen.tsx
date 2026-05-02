import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light dark:bg-dark-bg text-dark dark:text-dark-text transition-colors duration-300">
      <div className="animate-pulse">
        <svg className="w-16 h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mt-4">Dev Toolbox AI</h1>
      <p className="text-lg text-gray-600 dark:text-dark-text-secondary mt-1">Initializing...</p>
    </div>
  );
};