import React from 'react';
import { FileCodeIcon } from '../components/icons/FileCodeIcon';
import { ImageIcon } from '../components/icons/ImageIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';

interface WelcomePageProps {
  onEnter: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light dark:bg-dark-bg text-dark dark:text-dark-text transition-colors duration-300 p-4">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
            <SparklesIcon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">Welcome to Dev Toolbox <span className="text-primary">AI</span></h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
          Your smart assistant for common development tasks. Streamline your workflow with powerful, AI-driven tools.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg border border-gray-200 dark:border-dark-border shadow-sm">
            <div className="flex items-center">
              <FileCodeIcon className="w-8 h-8 text-primary" />
              <h2 className="ml-4 text-xl sm:text-2xl font-semibold">AI Code Minifier</h2>
            </div>
            <p className="mt-3 text-gray-600 dark:text-dark-text-secondary">
              Shrink your JS, CSS, and HTML files with advanced AI. It intelligently removes unnecessary characters to boost performance while preserving all functionality.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg border border-gray-200 dark:border-dark-border shadow-sm">
            <div className="flex items-center">
              <ImageIcon className="w-8 h-8 text-primary" />
              <h2 className="ml-4 text-xl sm:text-2xl font-semibold">Icon Generator</h2>
            </div>
            <p className="mt-3 text-gray-600 dark:text-dark-text-secondary">
              Upload a single high-resolution image and instantly generate a complete, perfectly resized set of standard icon sizes for your web and mobile projects.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <button
            onClick={onEnter}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-primary text-white font-bold text-base sm:text-lg rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};