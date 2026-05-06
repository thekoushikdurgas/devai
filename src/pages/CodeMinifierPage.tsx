import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileStatus, ProcessedCodeFile } from '../types';
import { minifyCode } from '../services/geminiService';
import { storage } from '../services/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { FileUpload } from '../components/shared/FileUpload';
import { CheckIcon } from '../components/icons/CheckIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { FileCodeIcon } from '../components/icons/FileCodeIcon';
import { FileCssIcon } from '../components/icons/FileCssIcon';
import { FileHtmlIcon } from '../components/icons/FileHtmlIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { JsonIcon } from '../components/icons/JsonIcon';
import { formatBytes } from '../utils/helpers';
import { CircularProgress } from '../components/shared/CircularProgress';


const getLanguageFromFile = (file: File): string | null => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) return null;

  switch (extension) {
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'JavaScript';
    case 'ts':
    case 'tsx':
      return 'TypeScript';
    case 'css':
      return 'CSS';
    case 'html':
    case 'htm':
      return 'HTML';
    case 'json':
      return 'JSON';
    case 'xml':
      return 'XML';
    case 'sql':
      return 'SQL';
    case 'md':
      return 'Markdown';
    case 'py':
      return 'Python';
    case 'java':
      return 'Java';
    case 'c':
    case 'h':
      return 'C';
    case 'cpp':
    case 'hpp':
      return 'C++';
    case 'cs':
      return 'C#';
    case 'go':
      return 'Go';
    case 'php':
      return 'PHP';
    case 'rb':
      return 'Ruby';
    case 'rs':
      return 'Rust';
    case 'swift':
      return 'Swift';
    default:
      return extension.toUpperCase();
  }
};

const FileIcon: React.FC<{ language: ProcessedCodeFile['language'] }> = ({ language }) => {
  switch (language) {
    case 'JavaScript': return <FileCodeIcon className="w-8 h-8 text-yellow-400 flex-shrink-0" />;
    case 'TypeScript': return <FileCodeIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />;
    case 'CSS': return <FileCssIcon className="w-8 h-8 text-blue-400 flex-shrink-0" />;
    case 'HTML': return <FileHtmlIcon className="w-8 h-8 text-orange-400 flex-shrink-0" />;
    case 'JSON': return <JsonIcon className="w-8 h-8 text-green-500 flex-shrink-0" />;
    default: return <FileCodeIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />;
  }
};

const FileCard: React.FC<{ fileData: ProcessedCodeFile }> = ({ fileData }) => {
  const { file, status, minifiedContent, error, language } = fileData;
  const { user } = useAuth();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);


  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const getStatusIndicator = () => {
    switch (status) {
      case FileStatus.Processing:
        return <div className="flex items-center text-sm text-processing"><SpinnerIcon className="w-4 h-4 mr-2" /> Minifying...</div>;
      case FileStatus.Success:
        return <div className="flex items-center text-sm text-success"><CheckIcon className="w-4 h-4 mr-2" /> Complete</div>;
      case FileStatus.Error:
        return <div className="flex items-center text-sm text-red-500"><XCircleIcon className="w-4 h-4 mr-2" /> Error</div>;
      default:
        return <div className="text-sm text-gray-500 dark:text-dark-text-secondary">Ready</div>;
    }
  };
  
  const handleDownload = () => {
    if (!minifiedContent) return;
    const blob = new Blob([minifiedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nameParts = file.name.split('.');
    const extension = nameParts.pop();
    a.download = `${nameParts.join('.')}.min.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCopy = () => {
    if (!minifiedContent) return;
    navigator.clipboard.writeText(minifiedContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error("Failed to copy content: ", err);
    });
  };

  const handleSaveToCloud = async () => {
    if (!minifiedContent || !user) return;
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = window.setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 95;
        }
        return prev + 20;
      });
    }, 200);
    
    const nameParts = file.name.split('.');
    const extension = nameParts.pop();
    const fileName = `${nameParts.join('.')}.min.${extension}`;
    const filePath = `code-files/${user.uid}/${fileName}`;
    
    try {
      const storageRef = ref(storage, filePath);
      const blob = new Blob([minifiedContent], { type: 'text/plain' });
      await uploadBytes(storageRef, blob);

      if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
      }

      setUploadProgress(100);
      setUploadStatus('success');
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
      }
      setUploadStatus('error');
      setUploadProgress(0);
      setUploadError((error as Error).message);
      console.error('Error uploading to Firebase:', error);
    }
  };
  
  const getCloudButton = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="w-5 h-5 flex items-center justify-center"><CircularProgress progress={uploadProgress} /></div>;
      case 'success':
        return <CheckIcon className="w-5 h-5 text-success" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return (
          <button onClick={handleSaveToCloud} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-dark-text-secondary transition-colors" aria-label="Save to cloud">
            <CloudUploadIcon className="w-5 h-5" />
          </button>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border transition-all duration-200 hover:shadow-md dark:hover:border-primary">
        <div className="flex items-start space-x-3">
            <FileIcon language={language} />
            <div className="flex-1 overflow-hidden">
                <p className="font-mono text-sm font-medium truncate text-dark dark:text-dark-text" title={file.name}>{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-2">{formatBytes(file.size)}</p>
                {status === FileStatus.Success && minifiedContent && (
                    <div className="text-xs text-gray-500 dark:text-dark-text-secondary">
                        Savings: <span className="font-medium text-success">{(((file.size - minifiedContent.length) / file.size) * 100).toFixed(1)}%</span>
                    </div>
                )}
            </div>
        </div>
        {(error || uploadError) && <p className="text-xs text-red-500 mt-2 truncate" title={error || uploadError!}>{error || uploadError}</p>}
        <div className="flex items-center justify-between mt-4 h-6">
            {getStatusIndicator()}
            {status === FileStatus.Success && (
              <div className="flex items-center space-x-2">
                {getCloudButton()}
                <button onClick={handleCopy} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-dark-text-secondary transition-colors" aria-label="Copy to clipboard">
                    {isCopied ? <CheckIcon className="w-5 h-5 text-success" /> : <ClipboardIcon className="w-5 h-5" />}
                </button>
                <button onClick={handleDownload} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-dark-text-secondary transition-colors" aria-label="Download minified file">
                    <DownloadIcon className="w-5 h-5" />
                </button>
              </div>
            )}
        </div>
    </div>
  );
};


export const CodeMinifierPage: React.FC = () => {
  const [files, setFiles] = useState<ProcessedCodeFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const newFiles: ProcessedCodeFile[] = selectedFiles
      .map(file => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        language: getLanguageFromFile(file),
        status: FileStatus.Idle,
      }))
      .filter(file => file.language);
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleMinifyAll = async () => {
    setIsProcessing(true);
    setFiles(prev => prev.map(f => ({ ...f, status: FileStatus.Processing, error: undefined })));

    const processingPromises = files.map(async (fileData) => {
      if (!fileData.language) {
        return { ...fileData, status: FileStatus.Error, error: 'Unsupported file type' };
      }

      try {
        const content = await fileData.file.text();
        const minified = await minifyCode(content, fileData.language);
        return { ...fileData, status: FileStatus.Success, minifiedContent: minified };
      } catch (e) {
        return { ...fileData, status: FileStatus.Error, error: (e as Error).message };
      }
    });

    const results = await Promise.all(processingPromises);
    setFiles(results);
    setIsProcessing(false);
  };
  
  const handleClear = () => {
    setFiles([]);
  };

  return (
    <div className="space-y-6">
      {!files.length ? (
        <FileUpload
          onFilesSelected={handleFilesSelected}
          acceptedFileTypes=".js,.jsx,.ts,.tsx,.css,.html,.htm,.json,.xml,.sql,.md,.py,.java,.c,.h,.cpp,.hpp,.cs,.go,.php,.rb,.rs,.swift"
          multiple={true}
          title="Drag & drop your code files here"
          description="Supports JS, TS, CSS, HTML, JSON, and many more file types."
        />
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map(fileData => <FileCard key={fileData.id} fileData={fileData} />)}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleMinifyAll}
              disabled={isProcessing || files.every(f => f.status === FileStatus.Success)}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing && <SpinnerIcon className="w-5 h-5 mr-2 -ml-1" />}
              {isProcessing ? 'Minifying...' : 'Minify All'}
            </button>
            <button
              onClick={handleClear}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-border transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <TrashIcon className="w-5 h-5 mr-2 -ml-1" />
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
