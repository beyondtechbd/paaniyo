'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react';

interface ImageUploadProps {
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  folder?: 'products' | 'brands' | 'users' | 'uploads';
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  aspectRatio?: string; // e.g., "1/1", "16/9"
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
  url?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  multiple = false,
  maxFiles = 5,
  maxSize = 5,
  aspectRatio = '1/1',
  label,
  hint,
  disabled = false,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize value to array
  const images = Array.isArray(value) ? value : value ? [value] : [];

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - images.length;
      const filesToUpload = multiple ? fileArray.slice(0, remainingSlots) : [fileArray[0]];

      if (filesToUpload.length === 0) return;

      // Validate files
      const validFiles: File[] = [];
      for (const file of filesToUpload) {
        // Check type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }
        // Check size
        if (file.size > maxSize * 1024 * 1024) {
          alert(`${file.name} is too large. Max size: ${maxSize}MB`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Create uploading state
      const newUploading: UploadingFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        progress: 0,
      }));

      setUploading((prev) => [...prev, ...newUploading]);

      // Upload files
      const uploadPromises = validFiles.map(async (file, index) => {
        const uploadingFile = newUploading[index];

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', folder);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Upload failed');
          }

          const data = await response.json();

          // Update uploading state with success
          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadingFile.id
                ? { ...u, progress: 100, url: data.url }
                : u
            )
          );

          return data.url;
        } catch (error) {
          // Update uploading state with error
          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadingFile.id
                ? { ...u, error: error instanceof Error ? error.message : 'Upload failed' }
                : u
            )
          );
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUrls = results.filter((url): url is string => url !== null);

      // Update value
      if (successfulUrls.length > 0) {
        if (multiple) {
          onChange([...images, ...successfulUrls]);
        } else {
          onChange(successfulUrls[0]);
        }
      }

      // Clear uploading state after delay
      setTimeout(() => {
        setUploading((prev) =>
          prev.filter((u) => !newUploading.find((n) => n.id === u.id))
        );
      }, 2000);
    },
    [disabled, folder, images, maxFiles, maxSize, multiple, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = ''; // Reset input
      }
    },
    [handleFiles]
  );

  const removeImage = useCallback(
    (indexToRemove: number) => {
      if (disabled) return;
      const newImages = images.filter((_, index) => index !== indexToRemove);
      onChange(multiple ? newImages : newImages[0] || '');
    },
    [disabled, images, multiple, onChange]
  );

  const canAddMore = multiple ? images.length < maxFiles : images.length === 0;
  const isUploading = uploading.length > 0;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* Existing Images */}
        {images.length > 0 && (
          <div className={`grid gap-3 ${multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : ''}`}>
            {images.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
                style={{ aspectRatio }}
              >
                <div className="absolute inset-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}

            {/* Add More Button (for multiple) */}
            {multiple && canAddMore && !disabled && (
              <motion.button
                type="button"
                onClick={handleClick}
                className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/5 transition-colors"
                style={{ aspectRatio }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-8 h-8 text-slate-500" />
              </motion.button>
            )}
          </div>
        )}

        {/* Uploading Files */}
        <AnimatePresence>
          {uploading.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              {file.error ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : file.url ? (
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{file.name}</p>
                {file.error ? (
                  <p className="text-xs text-red-400">{file.error}</p>
                ) : !file.url ? (
                  <div className="h-1 mt-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Drop Zone (when no images or single mode) */}
        {canAddMore && images.length === 0 && (
          <motion.div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed
              transition-all cursor-pointer
              ${dragOver
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{ aspectRatio: multiple ? undefined : aspectRatio, minHeight: 160 }}
            whileHover={disabled ? {} : { scale: 1.01 }}
            whileTap={disabled ? {} : { scale: 0.99 }}
          >
            <div className={`p-4 rounded-full mb-4 ${dragOver ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              ) : (
                <ImageIcon className={`w-8 h-8 ${dragOver ? 'text-cyan-400' : 'text-slate-500'}`} />
              )}
            </div>
            <p className="text-sm text-slate-400 text-center">
              {dragOver ? (
                'Drop image here'
              ) : (
                <>
                  <span className="text-cyan-400 font-medium">Click to upload</span>
                  {' or drag and drop'}
                </>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PNG, JPG, WebP up to {maxSize}MB
              {multiple && ` (max ${maxFiles} files)`}
            </p>
          </motion.div>
        )}

        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {hint && (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
