import React, { useState, useEffect } from 'react';
import { encode, decode } from '@toon-format/toon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { JsonIcon } from '../components/icons/JsonIcon';

export const JsonToToonPage: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [toonOutput, setToonOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    
    // Formatting Options
    const [delimiter, setDelimiter] = useState<',' | '\t' | '|'>(',');
    const [indent, setIndent] = useState(2);
    const [keyFolding, setKeyFolding] = useState<'off' | 'safe'>('off');
    const [flattenDepth, setFlattenDepth] = useState<number>(Infinity);
    
    useEffect(() => {
        if (!jsonInput.trim()) {
            setToonOutput('');
            setError(null);
            return;
        }
        try {
            const parsed = JSON.parse(jsonInput);
            
            const result = encode(parsed, {
                indent,
                delimiter,
                keyFolding,
                flattenDepth
            });
            
            setToonOutput(result);
            setError(null);
        } catch (e) {
            setError((e as Error).message);
        }
    }, [jsonInput, delimiter, indent, keyFolding, flattenDepth]);
    
    const handleCopy = () => {
        if (!toonOutput) return;
        navigator.clipboard.writeText(toonOutput).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(console.error);
    };

    const loadExample = () => {
        setJsonInput(JSON.stringify({
            "users": [
                {
                    "id": 1,
                    "name": "Alice Johnson",
                    "email": "alice@example.com",
                    "role": "admin"
                },
                {
                    "id": 2,
                    "name": "Bob Smith",
                    "email": "bob@example.com",
                    "role": "user"
                },
                {
                    "id": 3,
                    "name": "Carol Davis",
                    "email": "carol@example.com",
                    "role": "user"
                }
            ]
        }, null, 2));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-dark-surface p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                <div>
                    <h1 className="text-2xl font-bold text-dark dark:text-dark-text mt-1">JSON to TOON Converter</h1>
                    <p className="text-gray-500 dark:text-dark-text-secondary mt-2 max-w-2xl">
                        Convert JSON to TOON serialization format and reduce LLM tokens by 30-60%.
                        Lower GPT token costs and Claude API costs with our local converter.
                    </p>
                </div>
                <button 
                    onClick={loadExample}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    Load Example
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border space-y-4 flex flex-col h-full">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-gray-200 dark:border-dark-border">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Indent Spaces</label>
                            <select 
                                value={indent} 
                                onChange={e => setIndent(Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value={2}>2 spaces</option>
                                <option value={4}>4 spaces</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Key Folding</label>
                            <select 
                                value={keyFolding} 
                                onChange={e => setKeyFolding(e.target.value as 'off' | 'safe')}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="off">Disabled</option>
                                <option value="safe">Safe</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Delimiter</label>
                            <select 
                                value={delimiter} 
                                onChange={e => setDelimiter(e.target.value as ',' | '\t' | '|')}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value=",">Comma (,)</option>
                                <option value="&#9;">Tab (\t)</option>
                                <option value="|">Pipe (|)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Flatten Depth</label>
                            <select 
                                value={flattenDepth === Infinity ? 'Infinity' : flattenDepth} 
                                onChange={e => setFlattenDepth(e.target.value === 'Infinity' ? Infinity : Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="Infinity">Infinity</option>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                            JSON Input
                        </label>
                        <div className="text-xs text-gray-400">
                            {jsonInput.length > 0 && `${Math.ceil(jsonInput.length / 4)} approx tokens`}
                        </div>
                    </div>
                    
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder={'Paste your JSON here...\n\nExample:\n{\n  "name": "Alice",\n  "age": 30\n}'}
                        className="flex-1 w-full min-h-[400px] px-4 py-3 font-mono text-sm bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition resize-none custom-scrollbar"
                    />
                </div>
                
                <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-4">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">TOON Output</h3>
                            {toonOutput && (
                                <div className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                    {Math.ceil(toonOutput.length / 4)} approx tokens
                                </div>
                            )}
                        </div>
                        {toonOutput && (
                            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                                {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        )}
                    </div>
                    
                    <div className="relative flex-1 bg-gray-50 dark:bg-slate-900/70 p-4 rounded-lg font-mono text-sm text-dark dark:text-dark-text overflow-auto custom-scrollbar border border-transparent dark:border-dark-border">
                        {error && (
                            <div className="absolute inset-x-4 top-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex items-start space-x-3 text-red-600 dark:text-red-400">
                                <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm break-all">{error}</span>
                            </div>
                        )}
                        
                        {!toonOutput && !error && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                Output will appear here after conversion...
                            </div>
                        )}
                        
                        {toonOutput && (
                            <pre className="whitespace-pre-wrap">{toonOutput}</pre>
                        )}
                    </div>
                </div>
            </div>
            
        </div>
    );
};
