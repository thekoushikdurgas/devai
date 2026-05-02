import React, { useState, useEffect } from 'react';
import { CodeMinifier } from './components/CodeMinifier';
import { IconGenerator } from './components/IconGenerator';
import { Cheatsheet } from './components/Cheatsheet';
import { RegexGenerator } from './components/RegexGenerator';
import { JsonToType } from './components/JsonToType';
import { CodeRefactor } from './components/CodeRefactor';
import { WebsiteAnalyzer } from './components/WebsiteAnalyzer';
import { PromptEnhancer } from './components/PromptEnhancer';
import { LoadingScreen } from './components/LoadingScreen';
import { WelcomePage } from './components/WelcomePage';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Tool } from './types';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTool, setActiveTool] = useState<Tool>(Tool.Minifier);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    if (!loading && user) {
      const welcomeShown = localStorage.getItem(`welcomeShown_${user.uid}`);
      if (!welcomeShown) {
        setShowWelcome(true);
      }
    }
  }, [user, loading]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleEnterWelcome = () => {
    if (user) {
      localStorage.setItem(`welcomeShown_${user.uid}`, 'true');
    }
    setShowWelcome(false);
  };
  
  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };


  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <LoginPage />;
  }

  if (showWelcome) {
    return <WelcomePage onEnter={handleEnterWelcome} />;
  }

  return (
    <div className="md:flex min-h-screen bg-light dark:bg-dark-bg text-dark dark:text-dark-text transition-colors duration-300">
      <Sidebar 
        activeTool={activeTool}
        setActiveTool={handleToolSelect}
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto w-full h-full">
                {activeTool === Tool.Minifier && <CodeMinifier />}
                {activeTool === Tool.IconGenerator && <IconGenerator />}
                {activeTool === Tool.Cheatsheet && <Cheatsheet />}
                {activeTool === Tool.RegexGenerator && <RegexGenerator />}
                {activeTool === Tool.JsonToType && <JsonToType />}
                {activeTool === Tool.CodeRefactor && <CodeRefactor />}
                {activeTool === Tool.WebsiteAnalyzer && <WebsiteAnalyzer />}
                {activeTool === Tool.PromptEnhancer && <PromptEnhancer />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;