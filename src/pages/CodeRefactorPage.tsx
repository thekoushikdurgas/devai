import React, { useState, useCallback } from 'react';
import { refactorCode } from '../services/geminiService';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { RefactorIcon } from '../components/icons/RefactorIcon';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'Java', 'Go', 'Rust'];

export const CodeRefactorPage: React.FC = () => {
    const [codeInput, setCodeInput] = useState('');
    const [instructions, setInstructions] = useState('');
    const [language, setLanguage] = useState('JavaScript');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleRefactor = useCallback(async () => {
        if (!codeInput.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setOutput('');
        
        try {
            const result = await refactorCode(codeInput, language, instructions);
            setOutput(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [codeInput, language, instructions]);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleRefactor();
    }
    
    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy: ", err);
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border space-y-4">
                <h2 className="text-lg font-medium text-dark dark:text-dark-text">AI Code Refactor</h2>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Language</label>
                        <select
                            id="language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-dark-surface border-gray-300 dark:border-dark-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        >
                            {LANGUAGES.map(lang => <option key={lang}>{lang}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="code-input" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Code to Refactor</label>
                         <textarea
                            id="code-input"
                            rows={10}
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            placeholder={'// Paste your code here'}
                            className="mt-1 w-full px-3 py-2 font-mono text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Instructions (Optional)</label>
                         <textarea
                            id="instructions"
                            rows={3}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={'e.g., "Convert to async/await" or "Improve performance"'}
                            className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                    </div>
                     <button
                        type="submit"
                        disabled={isLoading || !codeInput.trim()}
                        className="w-full px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <RefactorIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Refactoring...' : 'Refactor Code'}
                    </button>
                </form>
            </div>
            
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-semibold text-dark dark:text-dark-text">Refactored Code</h3>
                    {output && (
                         <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                            {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                            {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                    )}
                </div>
                 <div className="relative bg-gray-50 dark:bg-slate-900/70 p-4 rounded-lg h-[calc(100%-2.5rem)] overflow-auto">
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center h-full text-center">
                            <SpinnerIcon className="w-12 h-12 text-primary" />
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <XCircleIcon className="w-12 h-12 text-red-500" />
                            <p className="mt-4 font-medium text-red-600 dark:text-red-400">An Error Occurred</p>
                            <p className="text-sm text-red-500 dark:text-red-400/80 max-w-md">{error}</p>
                        </div>
                    )}
                    
                    {!isLoading && !error && !output && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <RefactorIcon className="w-12 h-12 text-primary/30" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">Your refactored code will appear here.</p>
                        </div>
                    )}

                    {output && (
                        <pre>
                            <code className="font-mono text-sm text-dark dark:text-dark-text whitespace-pre-wrap">
                                {output}
                            </code>
                        </pre>
                    )}
                 </div>
            </div>
        </div>
    );
};