import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileImage,
  Eye,
} from 'lucide-react';
import { uploadProductImageToSupabase } from '../lib/supabase';

interface ProductImageManagerProps {
  currentImageUrl: string;
  onImageChange: (newUrl: string) => void;
  productName?: string;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  currentImageUrl,
  onImageChange,
  productName = 'Menu Item',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    // Validate type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setUploadError('Unsupported format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 10MB allowed.`);
      return;
    }

    setSelectedFile(file);

    // Immediate local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const result = await uploadProductImageToSupabase(file);
      if (result.error || !result.url) {
        // Fallback: If Supabase Storage bucket is not ready in user's project,
        // convert file to clean base64 data URL so changes still persist in database and preview
        console.warn('Storage upload notice:', result.error);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onImageChange(base64data);
          setPreviewUrl(base64data);
          setUploadSuccess(true);
          setUploadError(`Saved directly! (Note: ${result.error})`);
          setTimeout(() => setUploadSuccess(false), 3500);
        };
        reader.readAsDataURL(file);
      } else {
        // Storage upload succeeded!
        onImageChange(result.url);
        setPreviewUrl(result.url);
        setUrlInputValue(result.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3500);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInputValue.trim()) return;
    setPreviewUrl(urlInputValue.trim());
    onImageChange(urlInputValue.trim());
    setSelectedFile(null);
    setUploadSuccess(true);
    setUploadError(null);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleRemoveImage = () => {
    const placeholder = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80';
    setSelectedFile(null);
    setPreviewUrl(placeholder);
    setUrlInputValue(placeholder);
    onImageChange(placeholder);
    setUploadError(null);
  };

  const handleResetToOriginal = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImageUrl);
    setUrlInputValue(currentImageUrl);
    onImageChange(currentImageUrl);
    setUploadError(null);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-stone-50/60 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-serif font-bold text-sm text-emerald-950 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <span>Product Image</span>
          </h4>
          <p className="text-[11px] text-stone-500">
            Upload from your device, drag & drop, or provide an image link.
          </p>
        </div>

        {previewUrl !== currentImageUrl && (
          <button
            type="button"
            onClick={handleResetToOriginal}
            className="text-[11px] text-stone-500 hover:text-emerald-800 flex items-center gap-1 font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Revert to original</span>
          </button>
        )}
      </div>

      {/* Main Image Preview & Drop Area */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Visual Preview Box */}
        <div className="sm:col-span-4 flex flex-col items-center">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-emerald-200 bg-white shadow-inner group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={productName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80'
                  );
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                <FileImage className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-[11px]">No image selected</span>
              </div>
            )}

            {/* Uploading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-300 mb-2" />
                <span className="text-xs font-bold">Uploading to Storage...</span>
                <span className="text-[10px] text-emerald-200">Please wait</span>
              </div>
            )}

            {/* Storefront Aspect Ratio Badge */}
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
              <Eye className="w-2.5 h-2.5" />
              <span>1:1 Storefront Preview</span>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-2 text-center text-[10px] text-stone-500 truncate max-w-full">
              <span className="font-semibold text-stone-700">{selectedFile.name}</span>
              <span className="ml-1">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            </div>
          )}
        </div>

        {/* Action Controls & Drop Zone */}
        <div className="sm:col-span-8 space-y-3">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-600 bg-emerald-100/50 scale-[1.01]'
                : 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <Upload className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Click to select from device or drag & drop
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Supports JPG, PNG, WEBP up to 10MB • Works on mobile & desktop
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Select from Gallery / Device</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50/50 transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{showUrlInput ? 'Hide URL input' : 'Paste Image Web URL'}</span>
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs text-stone-500 hover:text-rose-600 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                title="Remove image and use default placeholder"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Image</span>
              </button>
            )}
          </div>

          {/* Optional Direct URL Input */}
          {showUrlInput && (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2 animate-in fade-in">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                Direct Image Web Address (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  placeholder="https://example.com/cake.jpg"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-600 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Apply URL
                </button>
              </div>
            </div>
          )}

          {/* Upload Status Feedback */}
          {uploadSuccess && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Image uploaded & preview updated successfully!</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{uploadError}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
