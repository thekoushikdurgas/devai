import React, { useState, useCallback } from 'react';
import { ICON_SIZES } from '../constants';
import { GeneratedIcon, FileStatus } from '../types';
import { FileUpload } from './FileUpload';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { TrashIcon } from './icons/TrashIcon';

// This is to avoid TypeScript errors for JSZip which is loaded from a CDN.
declare const JSZip: any;

const IconPreview: React.FC<{ icon: GeneratedIcon }> = ({ icon }) => (
  <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border flex flex-col items-center text-center">
    <img 
        src={icon.dataUrl} 
        alt={`Icon ${icon.size}x${icon.size}`} 
        className="w-24 h-24 object-contain mb-2 border border-gray-200 dark:border-dark-border rounded bg-gray-50 dark:bg-slate-700/50"
    />
    <p className="font-mono text-sm font-medium text-dark dark:text-dark-text">{`${icon.size}x${icon.size}`}</p>
    <p className="text-xs text-gray-500 dark:text-dark-text-secondary">PNG</p>
  </div>
);

export const IconGenerator: React.FC = () => {
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([]);
  const [status, setStatus] = useState<FileStatus>(FileStatus.Idle);

  const resizeImage = (file: File, size: number): Promise<GeneratedIcon> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not get canvas context'));
          }
          ctx.drawImage(img, 0, 0, size, size);
          canvas.toBlob((blob) => {
            if (!blob) {
              return reject(new Error('Could not create blob from canvas'));
            }
            resolve({
              size,
              blob,
              dataUrl: URL.createObjectURL(blob),
            });
          }, 'image/png');
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelected = useCallback(async (selectedFiles: File[]) => {
    const file = selectedFiles[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    setSourceImageFile(file);
    setStatus(FileStatus.Processing);
    setGeneratedIcons([]);

    try {
      const resizePromises = ICON_SIZES.map(size => resizeImage(file, size));
      const icons = await Promise.all(resizePromises);
      setGeneratedIcons(icons);
      setStatus(FileStatus.Success);
    } catch (error) {
      console.error("Error generating icons:", error);
      setStatus(FileStatus.Error);
    }
  }, []);

  const handleDownloadAll = async () => {
      if (generatedIcons.length === 0) return;
      const zip = new JSZip();
      generatedIcons.forEach(icon => {
          zip.file(`icon-${icon.size}x${icon.size}.png`, icon.blob);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'icons.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
  };
  
  const handleClear = () => {
    setSourceImageFile(null);
    setGeneratedIcons([]);
    setStatus(FileStatus.Idle);
  };

  if (!sourceImageFile) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        acceptedFileTypes="image/*"
        multiple={false}
        title="Upload an image to generate icons"
        description="We'll generate all standard icon sizes from a single source image."
      />
    );
  }

  return (
    <div className="space-y-6">
      {status === FileStatus.Processing && (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-dark-surface rounded-lg shadow">
          <SpinnerIcon className="w-12 h-12 text-primary" />
          <p className="mt-4 text-lg font-medium">Generating icons...</p>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Please wait, this may take a moment.</p>
        </div>
      )}
      {status === FileStatus.Error && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500/30">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">Failed to generate icons.</p>
            <p className="text-sm text-red-500 dark:text-red-400/80">Please try a different image or check the console.</p>
             <button onClick={handleClear} className="mt-6 w-full sm:w-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors flex items-center justify-center">
                <TrashIcon className="w-5 h-5 mr-2 -ml-1" />
                Try Again
             </button>
        </div>
      )}
      {status === FileStatus.Success && generatedIcons.length > 0 && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
            {generatedIcons.map(icon => <IconPreview key={icon.size} icon={icon} />)}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownloadAll}
              className="w-full sm:w-auto px-6 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
            >
              Download All (.zip)
            </button>
            <button
              onClick={handleClear}
              className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-border transition-colors flex items-center justify-center"
            >
                <TrashIcon className="w-5 h-5 mr-2 -ml-1" />
                Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};