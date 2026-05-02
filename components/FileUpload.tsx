import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes: string;
  multiple: boolean;
  title: string;
  description: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, acceptedFileTypes, multiple, title, description }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
     if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors duration-300 cursor-pointer
        ${isDragging ? 'border-primary bg-indigo-50 dark:bg-primary/10' : 'border-gray-300 dark:border-dark-border hover:border-primary dark:hover:border-primary'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleUploadAreaClick}
    >
      <UploadIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-text-secondary" />
      <h3 className="mt-2 text-lg font-medium text-dark dark:text-dark-text">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">{description}</p>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedFileTypes}
        multiple={multiple}
        onChange={handleFileChange}
      />
    </div>
  );
};