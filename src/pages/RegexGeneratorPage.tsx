import React, { useState, useCallback, useEffect } from 'react';
import { generateAndExplainRegex, explainRegex } from '../services/geminiService';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { HistoryIcon } from '../components/icons/HistoryIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { RegexHistoryItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  limit 
} from 'firebase/firestore';

type Mode = 'generate' | 'explain';

const STORAGE_KEY = 'regex_history';

export const RegexGeneratorPage: React.FC = () => {
    const [mode, setMode] = useState<Mode>('generate');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<{ regex?: string, explanation: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [history, setHistory] = useState<RegexHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const { user } = useAuth();

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'regex_history'),
                where('user_id', '==', user.uid),
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            const querySnapshot = await getDocs(q);
            const items = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as RegexHistoryItem));
            setHistory(items);
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    }, [user]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const saveToHistory = useCallback(async (item: Omit<RegexHistoryItem, 'id' | 'timestamp'>) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'regex_history'), {
                ...item,
                user_id: user.uid,
                timestamp: Date.now(),
            });
            fetchHistory();
        } catch (e) {
            console.error("Failed to save to history", e);
        }
    }, [user, fetchHistory]);

    const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'regex_history', id));
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (e) {
            console.error("Failed to delete from history", e);
        }
    };

    const loadFromHistory = (item: RegexHistoryItem) => {
        setMode(item.mode);
        setInput(item.input);
        setOutput({ regex: item.regex, explanation: item.explanation });
        setShowHistory(false);
    };

    const handleProcess = useCallback(async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setOutput(null);
        
        try {
            if (mode === 'generate') {
                const result = await generateAndExplainRegex(input);
                setOutput(result);
                saveToHistory({
                    mode: 'generate',
                    input,
                    regex: result.regex,
                    explanation: result.explanation
                });
            } else {
                const explanation = await explainRegex(input);
                setOutput({ explanation });
                saveToHistory({
                    mode: 'explain',
                    input,
                    explanation
                });
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [input, mode, saveToHistory]);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleProcess();
    }
    
    const handleCopy = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy: ", err);
        });
    };
    
    const renderModeButton = (buttonMode: Mode, label: string) => (
        <button
            onClick={() => {
                setMode(buttonMode);
                setInput('');
                setOutput(null);
                setError(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === buttonMode 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-lg font-medium text-dark dark:text-dark-text">Regex Generator & Explainer</h2>
                     <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-2 rounded-md transition-colors ${showHistory ? 'text-primary bg-primary/10' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border'}`}
                            title="View History"
                        >
                            <HistoryIcon className="w-5 h-5" />
                        </button>
                        <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-dark-border rounded-lg">
                            {renderModeButton('generate', 'Generate')}
                            {renderModeButton('explain', 'Explain')}
                        </div>
                     </div>
                </div>

                {showHistory && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-dark-border">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary uppercase tracking-wider">Recent History</h3>
                            <button 
                                onClick={() => setShowHistory(false)}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors"
                            >
                                Close
                            </button>
                        </div>
                        {history.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">No history yet. Generate some regex!</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {history.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => loadFromHistory(item)}
                                        className="group flex items-center justify-between p-3 bg-white dark:bg-dark-surface rounded-md border border-gray-100 dark:border-dark-border cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center mb-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold mr-2 ${
                                                    item.mode === 'generate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                }`}>
                                                    {item.mode}
                                                </span>
                                                <span className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-dark dark:text-dark-text truncate font-medium">
                                                {item.input}
                                            </p>
                                            {item.regex && (
                                                <code className="text-xs text-primary mt-1 block truncate">/{item.regex}/</code>
                                            )}
                                        </div>
                                        <button 
                                            onClick={(e) => deleteFromHistory(item.id, e)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <form onSubmit={handleFormSubmit}>
                    <label htmlFor="regex-input" className="block text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-1">
                      {mode === 'generate' ? 'Describe what you want to match:' : 'Enter the regex to explain:'}
                    </label>
                    <textarea
                        id="regex-input"
                        rows={3}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            mode === 'generate' 
                            ? "e.g., 'a valid email address' or 'a hex color code'"
                            : "e.g., '^\\d{3}-\\d{2}-\\d{4}$'"
                        }
                        className="w-full px-4 py-2 font-mono text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="mt-3 w-full sm:w-auto px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Processing...' : (mode === 'generate' ? 'Generate Regex' : 'Explain Regex')}
                    </button>
                </form>
            </div>
            
            {(isLoading || error || output) && (
                <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border min-h-[200px]">
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center h-full text-center">
                            <SpinnerIcon className="w-12 h-12 text-primary" />
                            <p className="mt-4 text-lg font-medium">AI is working its magic...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <XCircleIcon className="w-12 h-12 text-red-500" />
                            <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">An Error Occurred</p>
                            <p className="text-sm text-red-500 dark:text-red-400/80 max-w-md">{error}</p>
                        </div>
                    )}
                    
                    {output && (
                        <div className="space-y-4">
                           {output.regex && (
                               <div>
                                    <h3 className="text-md font-semibold text-dark dark:text-dark-text mb-2">Generated Regex</h3>
                                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-900/70 p-3 rounded-lg">
                                        <code className="font-mono text-sm text-dark dark:text-dark-text flex-grow">
                                            /{output.regex}/
                                        </code>
                                        <button onClick={() => handleCopy(output.regex!)} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                                            {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                                            {isCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                               </div>
                           )}
                           <div>
                                <h3 className="text-md font-semibold text-dark dark:text-dark-text mb-2">Explanation</h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-slate-900/70 rounded-lg">
                                    <pre className="whitespace-pre-wrap bg-transparent p-0"><code className="font-sans">{output.explanation}</code></pre>
                                </div>
                           </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};