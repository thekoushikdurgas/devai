import React, { useState, useCallback } from 'react';
import { enhancePrompt, generateCetoPrompts } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PromptIcon } from './icons/PromptIcon';


type Mode = 'enhancer' | 'ceto';

const EnhancerView: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleEnhance = useCallback(async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError(null);
        setOutput('');
        try {
            const result = await enhancePrompt(input);
            setOutput(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [input]);

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-dark dark:text-dark-text">Original Prompt</h3>
                <textarea
                    rows={12}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., 'write a blog post about react'"
                    className="w-full px-3 py-2 font-mono text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
                <button
                    onClick={handleEnhance}
                    disabled={isLoading || !input.trim()}
                    className="w-full px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Enhancing...' : 'Enhance Prompt'}
                </button>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-dark dark:text-dark-text">Enhanced Prompt</h3>
                    {output && (
                         <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                            {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                            {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                    )}
                </div>
                <div className="relative bg-gray-50 dark:bg-slate-900/70 p-4 rounded-lg h-[calc(100%-4.5rem)] overflow-auto">
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
                            <PromptIcon className="w-12 h-12 text-primary/30" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">Your enhanced prompt will appear here.</p>
                        </div>
                    )}
                    {output && (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-dark dark:text-dark-text">
                            {output}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};

const CetoView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError(null);
        setOutput('');
        try {
            const result = await generateCetoPrompts(topic);
            setOutput(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [topic]);

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="ceto-topic" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Enter a topic or goal</label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        id="ceto-topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'Generate product descriptions' or 'Write a short story'"
                        className="flex-grow px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !topic.trim()}
                        className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Generating...' : 'Generate CETO Prompts'}
                    </button>
                </div>
            </div>

            <div className="relative bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border min-h-[400px]">
                {output && (
                    <div className="absolute top-4 right-4">
                        <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                            {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                            {isCopied ? 'Copied!' : 'Copy All'}
                        </button>
                    </div>
                )}
                {isLoading && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <SpinnerIcon className="w-12 h-12 text-primary" />
                        <p className="mt-4 text-lg font-medium">Generating CETO prompts...</p>
                    </div>
                )}
                {error && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <XCircleIcon className="w-12 h-12 text-red-500" />
                        <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">An Error Occurred</p>
                        <p className="text-sm text-red-500 dark:text-red-400/80 max-w-md">{error}</p>
                    </div>
                )}
                {!isLoading && !error && !output && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <PromptIcon className="w-12 h-12 text-primary/30" />
                        <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">Your CETO strategy prompts will appear here.</p>
                    </div>
                )}
                {output && (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-dark dark:text-dark-text">
                        {output}
                    </pre>
                )}
            </div>
        </div>
    );
};

export const PromptEnhancer: React.FC = () => {
    const [mode, setMode] = useState<Mode>('enhancer');

    const renderModeButton = (buttonMode: Mode, label: string) => (
        <button
            onClick={() => setMode(buttonMode)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === buttonMode 
                ? 'bg-primary text-white' 
                : 'bg-transparent text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-dark-text">Prompt Enhancer</h2>
                 <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg">
                    {renderModeButton('enhancer', 'Enhancer')}
                    {renderModeButton('ceto', 'CETO Strategy')}
                 </div>
            </div>
            
            {mode === 'enhancer' ? <EnhancerView /> : <CetoView />}
        </div>
    );
};