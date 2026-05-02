import React, { useState, useCallback } from 'react';
import { generateTypes } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { JsonIcon } from './icons/JsonIcon';

type TypeSystem = 'TypeScript' | 'Zod Schema';

export const JsonToType: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [typeSystem, setTypeSystem] = useState<TypeSystem>('TypeScript');
    const [rootTypeName, setRootTypeName] = useState('RootType');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = useCallback(async () => {
        let parsedJson;
        try {
            parsedJson = JSON.parse(jsonInput);
        } catch (e) {
            setError('Invalid JSON provided. Please check the syntax.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setOutput('');
        
        try {
            const result = await generateTypes(JSON.stringify(parsedJson, null, 2), typeSystem, rootTypeName);
            setOutput(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [jsonInput, typeSystem, rootTypeName]);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGenerate();
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
                <h2 className="text-lg font-medium text-dark dark:text-dark-text">JSON to Type Generator</h2>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="root-type-name" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Root Type Name</label>
                        <input
                            id="root-type-name"
                            type="text"
                            value={rootTypeName}
                            onChange={(e) => setRootTypeName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="type-system" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Output Format</label>
                        <select
                            id="type-system"
                            value={typeSystem}
                            onChange={(e) => setTypeSystem(e.target.value as TypeSystem)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-dark-surface border-gray-300 dark:border-dark-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        >
                            <option>TypeScript</option>
                            <option>Zod Schema</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">JSON Input</label>
                         <textarea
                            id="json-input"
                            rows={12}
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder={'{\n  "id": 1,\n  "name": "Leanne Graham"\n}'}
                            className="mt-1 w-full px-3 py-2 font-mono text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                    </div>
                     <button
                        type="submit"
                        disabled={isLoading || !jsonInput.trim()}
                        className="w-full px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Generating...' : 'Generate Types'}
                    </button>
                </form>
            </div>
            
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-semibold text-dark dark:text-dark-text">Generated Output</h3>
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
                            <JsonIcon className="w-12 h-12 text-primary/30" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">Your generated types will appear here.</p>
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
