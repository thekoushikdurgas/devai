import React, { useState, useCallback } from 'react';
import { generateCheatsheet } from '../services/geminiService';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

const EXAMPLE_TOPICS = [
    'React Hooks',
    'CSS Flexbox',
    'JavaScript Array Methods',
    'How to start a new Vite project',
    'Git commands',
    'Tailwind CSS setup'
];

export const CheatsheetPage: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [cheatsheet, setCheatsheet] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = useCallback(async (currentTopic: string) => {
        if (!currentTopic.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setCheatsheet('');
        
        try {
            const result = await generateCheatsheet(currentTopic);
            setCheatsheet(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGenerate(topic);
    }
    
    const handleExampleClick = (exampleTopic: string) => {
        setTopic(exampleTopic);
        handleGenerate(exampleTopic);
    };

    const handleCopy = () => {
        if (!cheatsheet) return;
        navigator.clipboard.writeText(cheatsheet).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy cheatsheet: ", err);
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                <form onSubmit={handleFormSubmit}>
                    <label htmlFor="cheatsheet-topic" className="block text-lg font-medium text-dark dark:text-dark-text mb-2">
                        AI Cheatsheet Generator
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            id="cheatsheet-topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., 'CSS Grid' or 'Setup a Node.js server'"
                            className="flex-grow px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !topic.trim()}
                            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </form>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary mr-2">
                        Or try an example:
                    </span>
                    {EXAMPLE_TOPICS.map(ex => (
                        <button
                            key={ex}
                            onClick={() => handleExampleClick(ex)}
                            className="px-3 py-1 bg-gray-100 dark:bg-dark-border text-sm text-gray-700 dark:text-dark-text-secondary rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-colors"
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border min-h-[400px]">
                {isLoading && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <SpinnerIcon className="w-12 h-12 text-primary" />
                        <p className="mt-4 text-lg font-medium">Generating your cheatsheet...</p>
                        <p className="text-sm text-gray-500 dark:text-dark-text-secondary">AI is thinking, this might take a moment.</p>
                    </div>
                )}
                
                {error && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <XCircleIcon className="w-12 h-12 text-red-500" />
                        <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">An Error Occurred</p>
                        <p className="text-sm text-red-500 dark:text-red-400/80 max-w-md">{error}</p>
                    </div>
                )}

                {!isLoading && !error && !cheatsheet && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <SparklesIcon className="w-12 h-12 text-primary/50" />
                        <h3 className="mt-4 text-xl font-semibold text-dark dark:text-dark-text">Ready to learn something new?</h3>
                        <p className="mt-1 text-gray-500 dark:text-dark-text-secondary">Enter a topic above or click an example to get started.</p>
                    </div>
                )}
                
                {cheatsheet && (
                    <div>
                        <div className="flex justify-end mb-2">
                             <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                                {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <pre className="bg-gray-50 dark:bg-slate-900/70 p-4 rounded-lg overflow-x-auto">
                            <code className="font-mono text-sm text-dark dark:text-dark-text whitespace-pre-wrap">
                                {cheatsheet}
                            </code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};