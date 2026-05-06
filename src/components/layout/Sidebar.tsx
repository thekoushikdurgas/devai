import React from 'react';
import { UserProfile } from '../shared/UserProfile';
import { MoonIcon } from '../icons/MoonIcon';
import { SunIcon } from '../icons/SunIcon';
import { FileCodeIcon } from '../icons/FileCodeIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { Tool } from '../../types';
import { XIcon } from '../icons/XIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { RegexIcon } from '../icons/RegexIcon';
import { JsonIcon } from '../icons/JsonIcon';
import { RefactorIcon } from '../icons/RefactorIcon';
import { GlobeIcon } from '../icons/GlobeIcon';
import { PromptIcon } from '../icons/PromptIcon';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  theme: string;
  toggleTheme: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, theme, toggleTheme, isOpen, setIsOpen }) => {
  const getButtonClasses = (tool: Tool) => {
    return `w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-surface focus:ring-primary ${
      activeTool === tool
        ? 'bg-primary/10 text-primary dark:bg-primary/20'
        : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border'
    }`;
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex flex-col transition-transform duration-300 ease-in-out z-40 md:sticky md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h1 className="text-xl font-bold ml-2">Dev Toolbox AI</h1>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border"
            aria-label="Close menu"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTool(Tool.Minifier)} className={getButtonClasses(Tool.Minifier)}>
            <FileCodeIcon className="w-5 h-5" />
            <span>Code Minifier</span>
          </button>
          <button onClick={() => setActiveTool(Tool.IconGenerator)} className={getButtonClasses(Tool.IconGenerator)}>
            <ImageIcon className="w-5 h-5" />
            <span>Icon Generator</span>
          </button>
          <button onClick={() => setActiveTool(Tool.Cheatsheet)} className={getButtonClasses(Tool.Cheatsheet)}>
            <BookOpenIcon className="w-5 h-5" />
            <span>AI Cheatsheets</span>
          </button>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-border">
            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Code Tools</h3>
            <div className="mt-2 space-y-2">
                <button onClick={() => setActiveTool(Tool.RegexGenerator)} className={getButtonClasses(Tool.RegexGenerator)}>
                    <RegexIcon className="w-5 h-5" />
                    <span>Regex Gen & Explainer</span>
                </button>
                <button onClick={() => setActiveTool(Tool.JsonToType)} className={getButtonClasses(Tool.JsonToType)}>
                    <JsonIcon className="w-5 h-5" />
                    <span>JSON to Type</span>
                </button>
                <button onClick={() => setActiveTool(Tool.JsonToToon)} className={getButtonClasses(Tool.JsonToToon)}>
                    <JsonIcon className="w-5 h-5" />
                    <span>JSON to TOON</span>
                </button>
                <button onClick={() => setActiveTool(Tool.CodeRefactor)} className={getButtonClasses(Tool.CodeRefactor)}>
                    <RefactorIcon className="w-5 h-5" />
                    <span>AI Refactor</span>
                </button>
                 <button onClick={() => setActiveTool(Tool.WebsiteAnalyzer)} className={getButtonClasses(Tool.WebsiteAnalyzer)}>
                    <GlobeIcon className="w-5 h-5" />
                    <span>Website Analyzer</span>
                </button>
                <button onClick={() => setActiveTool(Tool.PromptEnhancer)} className={getButtonClasses(Tool.PromptEnhancer)}>
                    <PromptIcon className="w-5 h-5" />
                    <span>Prompt Enhancer</span>
                </button>
            </div>
          </div>

        </nav>

        <div className="px-4 py-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between flex-shrink-0">
          <UserProfile />
          <button 
              onClick={toggleTheme} 
              aria-label="Toggle theme"
              className="p-2 rounded-full text-gray-500 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
};