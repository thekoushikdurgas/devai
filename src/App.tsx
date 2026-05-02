import React, { useState, useEffect } from 'react';
import { CodeMinifierPage } from './pages/CodeMinifierPage';
import { IconGeneratorPage } from './pages/IconGeneratorPage';
import { CheatsheetPage } from './pages/CheatsheetPage';
import { RegexGeneratorPage } from './pages/RegexGeneratorPage';
import { JsonToTypePage } from './pages/JsonToTypePage';
import { CodeRefactorPage } from './pages/CodeRefactorPage';
import { WebsiteAnalyzerPage } from './pages/WebsiteAnalyzerPage';
import { PromptEnhancerPage } from './pages/PromptEnhancerPage';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
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
                {activeTool === Tool.Minifier && <CodeMinifierPage />}
                {activeTool === Tool.IconGenerator && <IconGeneratorPage />}
                {activeTool === Tool.Cheatsheet && <CheatsheetPage />}
                {activeTool === Tool.RegexGenerator && <RegexGeneratorPage />}
                {activeTool === Tool.JsonToType && <JsonToTypePage />}
                {activeTool === Tool.CodeRefactor && <CodeRefactorPage />}
                {activeTool === Tool.WebsiteAnalyzer && <WebsiteAnalyzerPage />}
                {activeTool === Tool.PromptEnhancer && <PromptEnhancerPage />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;