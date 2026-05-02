import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ICON_SIZES } from '../utils/constants';
import { GeneratedIcon, FileStatus, IconGenerationHistoryItem } from '../types';
import { FileUpload } from '../components/shared/FileUpload';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { HistoryIcon } from '../components/icons/HistoryIcon';
import { XIcon } from '../components/icons/XIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

// This is to avoid TypeScript errors for JSZip which is loaded from a CDN.
declare const JSZip: any;

const IconPreview: React.FC<{ 
  icon: GeneratedIcon;
  isSelected: boolean;
  onToggle: (size: number) => void;
}> = ({ icon, isSelected, onToggle }) => (
  <div 
    className={`bg-white dark:bg-dark-surface p-3 rounded-lg border flex flex-col items-center text-center cursor-pointer transition-all duration-200 ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-gray-200 dark:border-dark-border'}`}
    onClick={() => onToggle(icon.size)}
    role="checkbox"
    aria-checked={isSelected}
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(icon.size); }}}
  >
    <div className="relative w-full mb-2">
        <img 
            src={icon.dataUrl} 
            alt={`Icon ${icon.size}x${icon.size}`} 
            className={`w-24 h-24 object-contain border border-gray-200 dark:border-dark-border rounded bg-gray-50 dark:bg-slate-700/50 mx-auto transition-opacity ${isSelected ? 'opacity-100' : 'opacity-70'}`}
        />
        <div className="absolute top-1 right-1 bg-white/70 dark:bg-dark-surface/70 rounded-full flex items-center justify-center p-0.5 pointer-events-none">
             <input 
                type="checkbox"
                checked={isSelected}
                readOnly
                tabIndex={-1}
                className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300 dark:border-dark-border dark:bg-dark-border dark:checked:bg-primary"
            />
        </div>
    </div>
    <p className="font-mono text-sm font-medium text-dark dark:text-dark-text">{`${icon.size}x${icon.size}`}</p>
    <p className="text-xs text-gray-500 dark:text-dark-text-secondary">PNG</p>
  </div>
);

const HistoryPanel: React.FC<{
  items: IconGenerationHistoryItem[];
  isLoading: boolean;
  onSelectItem: (item: IconGenerationHistoryItem) => void;
  onDeleteItem: (item: IconGenerationHistoryItem) => void;
  onClose: () => void;
  deletingId: string | null;
  superBaseId: string | null;
  onSetSuperBase: (item: IconGenerationHistoryItem) => void;
}> = ({ items, isLoading, onSelectItem, onDeleteItem, onClose, deletingId, superBaseId, onSetSuperBase }) => {
    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
                <h3 className="font-semibold text-dark dark:text-dark-text">Generation History</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <SpinnerIcon className="w-8 h-8 text-primary" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <HistoryIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">Your previous generations will appear here.</p>
                </div>
            ) : (
                <ul className="flex-1 overflow-y-auto p-2 space-y-2">
                    {items.map(item => (
                        <li key={item.id} className="group relative">
                           <button 
                                onClick={() => onSelectItem(item)}
                                className={`w-full block p-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border text-left transition-all ${superBaseId === item.id ? 'ring-2 ring-primary' : ''}`}
                            >
                                <img src={item.source_image_url} alt="History item" className="w-full h-24 object-cover rounded" loading="lazy" />
                                <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-1 truncate">{new Date(item.created_at).toLocaleString()}</p>
                           </button>
                           <button 
                                onClick={() => onSetSuperBase(item)}
                                className={`absolute top-3 right-12 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all ${superBaseId === item.id ? 'opacity-100 text-yellow-400' : ''}`}
                                aria-label="Set as super base"
                           >
                               <StarIcon className="w-4 h-4" filled={superBaseId === item.id} />
                           </button>
                           <button 
                                onClick={() => onDeleteItem(item)}
                                disabled={deletingId === item.id}
                                className="absolute top-3 right-3 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-100"
                                aria-label="Delete history item"
                           >
                            {deletingId === item.id ? <SpinnerIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}
                           </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const IconGeneratorPage: React.FC = () => {
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<FileStatus>(FileStatus.Idle);
  
  const [historyItems, setHistoryItems] = useState<IconGenerationHistoryItem[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [superBase, setSuperBase] = useState<IconGenerationHistoryItem | null>(null);

  const { user } = useAuth();

  const fetchHistory = useCallback(async () => {
      if (!user) return;
      setHistoryLoading(true);
      try {
          const { data, error } = await supabase
              .from('icon_generations')
              .select('*')
              .order('created_at', { ascending: false });

          if (error) throw error;

          const items = data.map(item => {
              const { data: { publicUrl } } = supabase.storage
                  .from('icon-history')
                  .getPublicUrl(item.source_image_path);
              return { ...item, source_image_url: publicUrl };
          });
          setHistoryItems(items);
      } catch (error) {
          console.error("Error fetching history:", error);
      } finally {
          setHistoryLoading(false);
      }
  }, [user]);

  useEffect(() => {
      if (user) {
        fetchHistory();
      }
  }, [user, fetchHistory]);
  
  const saveToHistory = useCallback(async (file: File) => {
    if (!user) return;
    try {
        const fileExtension = file.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
            .from('icon-history')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
            .from('icon_generations')
            .insert({ user_id: user.id, source_image_path: filePath });

        if (insertError) throw insertError;

        await fetchHistory();
    } catch (error) {
        console.error("Error saving to history:", error);
    }
  }, [user, fetchHistory]);


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

  const handleFileSelected = useCallback(async (selectedFiles: File[], fromHistory = false) => {
    const file = selectedFiles[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    setSourceImageFile(file);
    setStatus(FileStatus.Processing);
    setGeneratedIcons([]);
    setSelectedSizes(new Set());
    setIsHistoryPanelOpen(false);

    try {
      const resizePromises = ICON_SIZES.map(size => resizeImage(file, size));
      const icons = await Promise.all(resizePromises);
      setGeneratedIcons(icons);
      setSelectedSizes(new Set(icons.map(i => i.size)));
      setStatus(FileStatus.Success);
      if (!fromHistory) {
        await saveToHistory(file);
      }
    } catch (error) {
      console.error("Error generating icons:", error);
      setStatus(FileStatus.Error);
    }
  }, [saveToHistory]);

  const handleDeleteHistory = async (item: IconGenerationHistoryItem) => {
      if (!user) return;
      setDeletingHistoryId(item.id);
      try {
          if (superBase?.id === item.id) {
              setSuperBase(null);
          }
          const { error: storageError } = await supabase.storage
              .from('icon-history')
              .remove([item.source_image_path]);

          if (storageError) throw storageError;

          const { error: dbError } = await supabase
              .from('icon_generations')
              .delete()
              .match({ id: item.id });

          if (dbError) throw dbError;
          
          setHistoryItems(prev => prev.filter(h => h.id !== item.id));

      } catch (error) {
          console.error("Error deleting history item:", error);
      } finally {
          setDeletingHistoryId(null);
      }
  };

  const handleSelectHistory = async (item: IconGenerationHistoryItem) => {
      try {
          const response = await fetch(item.source_image_url);
          const blob = await response.blob();
          const fileName = item.source_image_path.split('/').pop() || 'history-image.png';
          const file = new File([blob], fileName, { type: blob.type });
          await handleFileSelected([file], true);
      } catch (error) {
          console.error("Error loading history image:", error);
      }
  };
  
  const handleSetSuperBase = (item: IconGenerationHistoryItem) => {
    setSuperBase(prev => (prev?.id === item.id ? null : item));
  };

  const handleToggleSelection = (size: number) => {
    setSelectedSizes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(size)) {
            newSet.delete(size);
        } else {
            newSet.add(size);
        }
        return newSet;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
        setSelectedSizes(new Set(generatedIcons.map(i => i.size)));
    } else {
        setSelectedSizes(new Set());
    }
  };

  const handleDownloadSelected = async () => {
      const selectedIcons = generatedIcons.filter(icon => selectedSizes.has(icon.size));
      if (selectedIcons.length === 0) return;

      const zip = new JSZip();
      selectedIcons.forEach(icon => {
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
    setSelectedSizes(new Set());
    setStatus(FileStatus.Idle);
  };

  const allSelected = generatedIcons.length > 0 && selectedSizes.size === generatedIcons.length;
  const noneSelected = selectedSizes.size === 0;

  const mainContent = (
    <div className="space-y-6">
      {!sourceImageFile && status === FileStatus.Idle ? (
        <>
            {superBase && (
                <div className="mb-6 bg-white dark:bg-dark-surface p-4 rounded-lg border-2 border-dashed border-primary/50">
                    <h3 className="text-lg font-semibold text-dark dark:text-dark-text mb-2 flex items-center">
                        <StarIcon className="w-5 h-5 mr-2 text-yellow-500" filled />
                        Super Base Selected
                    </h3>
                    <div className="flex items-center gap-4">
                        <img src={superBase.source_image_url} alt="Super base preview" className="w-24 h-24 object-cover rounded-md" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                Use this image as a starting point for your new icons.
                            </p>
                            <div className="mt-3 flex gap-3">
                                <button
                                    onClick={() => handleSelectHistory(superBase)}
                                    className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700"
                                >
                                    Generate with this Image
                                </button>
                                <button
                                    onClick={() => setSuperBase(null)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border"
                                    aria-label="Clear super base"
                                >
                                    <XIcon className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <FileUpload
              onFilesSelected={handleFileSelected}
              acceptedFileTypes="image/*"
              multiple={false}
              title="Upload an image to generate icons"
              description="We'll generate all standard icon sizes from a single source image."
            />
        </>
      ) : status === FileStatus.Processing ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-dark-surface rounded-lg shadow">
          <SpinnerIcon className="w-12 h-12 text-primary" />
          <p className="mt-4 text-lg font-medium">Generating icons...</p>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Please wait, this may take a moment.</p>
        </div>
      ) : status === FileStatus.Error ? (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500/30">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">Failed to generate icons.</p>
            <p className="text-sm text-red-500 dark:text-red-400/80">Please try a different image or check the console.</p>
             <button onClick={handleClear} className="mt-6 w-full sm:w-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors flex items-center justify-center">
                <TrashIcon className="w-5 h-5 mr-2 -ml-1" />
                Try Again
             </button>
        </div>
      ) : status === FileStatus.Success && generatedIcons.length > 0 && (
        <div>
           <div className="mb-4 flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
             <div className="flex items-center gap-3">
                <button
                    onClick={() => handleSelectAll(!allSelected)}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-dark-border border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-slate-600"
                >
                    {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
                    {selectedSizes.size} of {generatedIcons.length} selected
                </span>
             </div>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={handleDownloadSelected}
                    disabled={noneSelected}
                    className="w-full sm:w-auto px-6 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Download Selected ({selectedSizes.size})
                </button>
                <button
                    onClick={handleClear}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-border transition-colors flex items-center justify-center"
                >
                    <TrashIcon className="w-5 h-5 mr-2 -ml-1" />
                    Start Over
                </button>
                <button 
                    onClick={() => setIsHistoryPanelOpen(prev => !prev)}
                    className="p-3 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-border"
                    aria-label="Toggle history panel"
                >
                    <HistoryIcon className="w-5 h-5" />
                </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {generatedIcons.map(icon => (
                <IconPreview 
                    key={icon.size} 
                    icon={icon}
                    isSelected={selectedSizes.has(icon.size)}
                    onToggle={handleToggleSelection}
                />
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        <div className={isHistoryPanelOpen ? 'lg:col-span-9' : 'lg:col-span-12'}>
            {mainContent}
        </div>
        {isHistoryPanelOpen && (
            <div className="lg:col-span-3">
                <HistoryPanel
                    items={historyItems}
                    isLoading={historyLoading}
                    onSelectItem={handleSelectHistory}
                    onDeleteItem={handleDeleteHistory}
                    onClose={() => setIsHistoryPanelOpen(false)}
                    deletingId={deletingHistoryId}
                    superBaseId={superBase?.id || null}
                    onSetSuperBase={handleSetSuperBase}
                />
            </div>
        )}
    </div>
  );
};
