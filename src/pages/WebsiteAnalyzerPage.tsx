import React, { useState, useCallback } from 'react';
import { generateCodeFromHtml } from '../services/geminiService';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { GlobeIcon } from '../components/icons/GlobeIcon';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { CircularProgress } from '../components/shared/CircularProgress';

// This is to avoid TypeScript errors for JSZip which is loaded from a CDN.
declare const JSZip: any;

interface AssetList {
  images: string[];
  videos: string[];
  scripts: string[];
  styles: string[];
}
interface PageInfo {
  title: string;
  description: string;
  internalLinks: number;
  externalLinks: number;
  internalLinkUrls: string[];
}
interface AnalysisResult {
  generatedCode: string;
  assets: AssetList;
  pageInfo: PageInfo;
}

type ResultTab = 'code' | 'assets' | 'info';

export const WebsiteAnalyzerPage: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<ResultTab>('code');
    const [isCopied, setIsCopied] = useState(false);
    const [isZipping, setIsZipping] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [scrapingProgress, setScrapingProgress] = useState({ current: 0, total: 0 });
    const [assetDownloadProgress, setAssetDownloadProgress] = useState<Record<string, number | 'error'>>({});
    const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

    const downloadAsset = async (assetUrl: string) => {
        setAssetDownloadProgress(prev => ({ ...prev, [assetUrl]: 0 }));
        try {
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(assetUrl)}`);
            if (!response.ok || !response.body) {
                throw new Error(`Failed to fetch ${assetUrl}: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const contentLength = +(response.headers.get('Content-Length') || 0);
            let receivedLength = 0;
            const chunks: Uint8Array[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                chunks.push(value);
                receivedLength += value.length;
                if (contentLength > 0) {
                    const progress = (receivedLength / contentLength) * 100;
                    setAssetDownloadProgress(prev => ({ ...prev, [assetUrl]: progress }));
                }
            }
            
            setAssetDownloadProgress(prev => ({ ...prev, [assetUrl]: 100 }));
            const blob = new Blob(chunks);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const filename = assetUrl.substring(assetUrl.lastIndexOf('/') + 1).split('?')[0] || 'download';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            setTimeout(() => {
                setAssetDownloadProgress(prev => {
                    const newState = { ...prev };
                    delete newState[assetUrl];
                    return newState;
                });
            }, 2000);

        } catch (err) {
            console.error('Download failed:', err);
            setError(`Failed to download asset: ${(err as Error).message}`);
            setAssetDownloadProgress(prev => ({ ...prev, [assetUrl]: 'error' }));
            setTimeout(() => {
                setAssetDownloadProgress(prev => {
                    const newState = { ...prev };
                    delete newState[assetUrl];
                    return newState;
                });
            }, 3000);
        }
    };

    const handleDownloadAllAssets = async () => {
        if (!result) return;
        setIsZipping(true);
        setError(null);
        
        try {
            const zip = new JSZip();
            const allAssets = [
                ...result.assets.images.map(url => ({ url, folder: 'images' })),
                ...result.assets.videos.map(url => ({ url, folder: 'videos' })),
                ...result.assets.styles.map(url => ({ url, folder: 'styles' })),
                ...result.assets.scripts.map(url => ({ url, folder: 'scripts' })),
            ];

            setZipProgress({ current: 0, total: allAssets.length });
            let completed = 0;

            const assetPromises = allAssets.map(async (asset) => {
                try {
                    const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(asset.url)}`);
                    if (response.ok) {
                        const blob = await response.blob();
                        const fileName = asset.url.substring(asset.url.lastIndexOf('/') + 1).split('?')[0] || 'asset';
                        zip.folder(asset.folder)!.file(fileName, blob);
                    }
                } catch (e) {
                    console.warn(`Could not fetch asset: ${asset.url}`, e);
                } finally {
                    completed++;
                    setZipProgress({ current: completed, total: allAssets.length });
                }
            });

            await Promise.all(assetPromises);

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `${new URL(url).hostname}-assets.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (e) {
            setError('Failed to create ZIP file.');
            console.error(e);
        } finally {
            setIsZipping(false);
        }
    };

    const handleAnalyze = useCallback(async () => {
        if (!url.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Use a CORS proxy to fetch the website content
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            }
            const html = await response.text();

            // Analyze the DOM client-side
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const base = new URL(url);

            const getAbsoluteUrl = (path: string | null): string | null => {
                try {
                    if (!path) return null;
                    return new URL(path, base.href).href;
                } catch (e) {
                    return path; // Fallback for invalid paths like data URIs
                }
            };
            
            const assets: AssetList = {
                images: [...new Set(Array.from(doc.querySelectorAll('img[src]')).map(el => getAbsoluteUrl(el.getAttribute('src'))).filter(Boolean) as string[])],
                videos: [...new Set(Array.from(doc.querySelectorAll('video source[src], video[src]')).map(el => getAbsoluteUrl(el.getAttribute('src'))).filter(Boolean) as string[])],
                scripts: [...new Set(Array.from(doc.querySelectorAll('script[src]')).map(el => getAbsoluteUrl(el.getAttribute('src'))).filter(Boolean) as string[])],
                styles: [...new Set(Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]')).map(el => getAbsoluteUrl(el.getAttribute('href'))).filter(Boolean) as string[])],
            };
            
            const internalLinkUrls: string[] = [];
            let externalLinks = 0;
            const seenInternalUrls = new Set<string>();
            
            const normalizedBase = `${base.origin}${base.pathname}${base.search}`;
            seenInternalUrls.add(normalizedBase);

            doc.querySelectorAll('a[href]').forEach(a => {
                try {
                    const href = a.getAttribute('href');
                    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
                    
                    const linkUrl = new URL(href, base.href);
                    const normalizedUrl = `${linkUrl.origin}${linkUrl.pathname}${linkUrl.search}`;

                    if (linkUrl.hostname === base.hostname) {
                        if (!seenInternalUrls.has(normalizedUrl)) {
                            internalLinkUrls.push(normalizedUrl);
                            seenInternalUrls.add(normalizedUrl);
                        }
                    } else {
                        externalLinks++;
                    }
                } catch (e) { /* Ignore invalid URLs */ }
            });

            const pageInfo: PageInfo = {
                title: doc.title || 'No title found',
                description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 'No description found',
                internalLinks: internalLinkUrls.length,
                externalLinks,
                internalLinkUrls,
            };

            // Generate code using AI
            const generatedCode = await generateCodeFromHtml(html);
            
            setResult({ generatedCode, assets, pageInfo });
            setActiveTab('code');
        } catch (e) {
            setError((e as Error).message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    const handleScrapeAllAssets = useCallback(async () => {
        if (!result) return;
        
        setIsScraping(true);
        setError(null);

        const internalLinks = result.pageInfo.internalLinkUrls;
        setScrapingProgress({ current: 0, total: internalLinks.length });

        const imageSet = new Set(result.assets.images);
        const videoSet = new Set(result.assets.videos);
        const scriptSet = new Set(result.assets.scripts);
        const styleSet = new Set(result.assets.styles);

        for (let i = 0; i < internalLinks.length; i++) {
            const linkUrl = internalLinks[i];
            setScrapingProgress({ current: i + 1, total: internalLinks.length });
            try {
                const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(linkUrl)}`);
                if (!response.ok) continue;
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const base = new URL(linkUrl);

                const getAbsoluteUrl = (path: string | null): string | null => {
                     try {
                        if (!path) return null;
                        return new URL(path, base.href).href;
                    } catch (e) {
                        return path;
                    }
                };

                doc.querySelectorAll('img[src]').forEach(el => {
                    const src = getAbsoluteUrl(el.getAttribute('src'));
                    if(src) imageSet.add(src);
                });
                doc.querySelectorAll('video source[src], video[src]').forEach(el => {
                    const src = getAbsoluteUrl(el.getAttribute('src'));
                    if(src) videoSet.add(src);
                });
                doc.querySelectorAll('script[src]').forEach(el => {
                    const src = getAbsoluteUrl(el.getAttribute('src'));
                    if(src) scriptSet.add(src);
                });
                doc.querySelectorAll('link[rel="stylesheet"][href]').forEach(el => {
                    const src = getAbsoluteUrl(el.getAttribute('href'));
                    if(src) styleSet.add(src);
                });

            } catch (e) {
                console.warn(`Failed to scrape ${linkUrl}:`, e);
            }
        }

        setResult(prev => prev ? {
            ...prev,
            assets: {
                images: Array.from(imageSet),
                videos: Array.from(videoSet),
                scripts: Array.from(scriptSet),
                styles: Array.from(styleSet),
            }
        } : null);

        setIsScraping(false);
    }, [result]);


    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAnalyze();
    };
    
    const handleCopy = () => {
        if (!result?.generatedCode) return;
        navigator.clipboard.writeText(result.generatedCode).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const TabButton: React.FC<{tab: ResultTab, children: React.ReactNode}> = ({tab, children}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-dark-border'}`}
        >
            {children}
        </button>
    );
    
    const AssetSection: React.FC<{title: string, items: string[]}> = ({title, items}) => (
        <div>
            <h4 className="text-md font-semibold mb-2">{title} ({items.length})</h4>
            {items.length > 0 ? (
                <ul className="space-y-1 text-sm font-mono bg-gray-50 dark:bg-slate-900/70 p-3 rounded-md max-h-48 overflow-y-auto">
                    {items.map((item, i) => {
                        const progress = assetDownloadProgress[item];
                        const isDownloading = typeof progress === 'number';
                        const hasError = progress === 'error';

                        return (
                            <li key={i} className="flex items-center justify-between gap-2">
                                <a href={item} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={item}>{item}</a>
                                <button 
                                    onClick={() => downloadAsset(item)}
                                    disabled={isDownloading}
                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-dark-text-secondary transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center disabled:cursor-not-allowed"
                                    aria-label="Download asset"
                                >
                                    { hasError ? <XCircleIcon className="w-5 h-5 text-red-500" /> :
                                      isDownloading ? <CircularProgress progress={progress} size={18} strokeWidth={2.5} showPercentage={false} /> :
                                      <DownloadIcon className="w-4 h-4" />
                                    }
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : <p className="text-sm text-gray-500 dark:text-dark-text-secondary">None found.</p>}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                <form onSubmit={handleFormSubmit}>
                    <label htmlFor="website-url" className="block text-lg font-medium text-dark dark:text-dark-text mb-2">
                        Website Scraper & Analyzer
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            id="website-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="flex-grow px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !url.trim()}
                            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <GlobeIcon className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                </form>
            </div>
            
            {isLoading && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
                    <SpinnerIcon className="w-12 h-12 text-primary" />
                    <p className="mt-4 text-lg font-medium">Fetching page and analyzing...</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">This might take a moment.</p>
                </div>
            )}
            
            {error && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500/30">
                    <XCircleIcon className="w-12 h-12 text-red-500" />
                    <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">An Error Occurred</p>
                    <p className="text-sm text-red-500 dark:text-red-400/80 max-w-md">{error}</p>
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-border pb-3 mb-4">
                        <div className="flex space-x-2">
                           <TabButton tab="code">AI Generated Code</TabButton>
                           <TabButton tab="assets">Assets Found</TabButton>
                           <TabButton tab="info">Page Info</TabButton>
                        </div>
                         {activeTab === 'code' && (
                             <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                                {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                         )}
                    </div>
                    
                    {activeTab === 'code' && (
                        <pre className="bg-gray-50 dark:bg-slate-900/70 p-4 rounded-lg overflow-auto h-[500px]">
                            <code className="font-mono text-sm text-dark dark:text-dark-text whitespace-pre-wrap">
                                {result.generatedCode}
                            </code>
                        </pre>
                    )}
                    
                    {activeTab === 'assets' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={handleDownloadAllAssets}
                                    disabled={isZipping}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-white hover:bg-emerald-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                                >
                                    {isZipping ? <SpinnerIcon className="w-4 h-4" /> : <DownloadIcon className="w-4 h-4" />}
                                    {isZipping ? `Zipping... (${zipProgress.current}/${zipProgress.total})` : 'Download All Assets'}
                                </button>
                            </div>
                            <AssetSection title="Images" items={result.assets.images} />
                            <AssetSection title="Videos" items={result.assets.videos} />
                            <AssetSection title="Stylesheets" items={result.assets.styles} />
                            <AssetSection title="Scripts" items={result.assets.scripts} />
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-3 text-sm">
                            <div>
                                <h4 className="font-semibold">Page Title</h4>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.title}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Meta Description</h4>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.description}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Links Found on Page</h4>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.internalLinks} unique internal links</p>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.externalLinks} external links</p>
                            </div>
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-border">
                                <h4 className="text-md font-semibold mb-2">Collect All Site Assets</h4>
                                <p className="text-gray-600 dark:text-dark-text-secondary mb-3">
                                    Scan all {result.pageInfo.internalLinks} unique internal pages to find and collect every asset on the site. This may take a moment.
                                </p>
                                {isScraping ? (
                                    <div className="flex items-center gap-3">
                                        <SpinnerIcon className="w-5 h-5 text-primary" />
                                        <span className="text-sm font-medium">
                                            Scraping page {scrapingProgress.current} of {scrapingProgress.total}...
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleScrapeAllAssets}
                                        disabled={isScraping || result.pageInfo.internalLinks === 0}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-white hover:bg-emerald-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                        Scrape All Internal Links
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};