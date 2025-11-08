'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, AlertCircle } from 'lucide-react';

interface SelfieUploaderProps {
  onImageReady: (file: File) => void;
  fitzpatrick?: string;
}

export default function SelfieUploader({ onImageReady, fitzpatrick }: SelfieUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Calculate average luminance of an image
   * Returns a value between 0 (dark) and 1 (bright)
   */
  const calculateLuminance = (imageData: ImageData): number => {
    let sum = 0;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // RGB to luminance formula
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      sum += luminance;
    }
    return sum / (data.length / 4);
  };

  /**
   * Downscale image to max 1280px on longest edge
   * Returns a File object
   */
  const downscaleImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const maxDimension = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Check lighting
        const imageData = ctx.getImageData(0, 0, width, height);
        const luminance = calculateLuminance(imageData);

        // Lighting thresholds
        if (luminance < 0.2) {
          setError('Photo is too dark. Please move to better lighting and try again.');
          reject(new Error('Photo too dark'));
          return;
        }

        if (luminance > 0.9) {
          setError('Photo is overexposed. Please reduce lighting and try again.');
          reject(new Error('Photo overexposed'));
          return;
        }

        // Convert canvas to blob then File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            const downscaledFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(downscaledFile);
          },
          file.type,
          0.9 // Quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        setIsProcessing(false);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum size is 10MB.');
        setIsProcessing(false);
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Downscale and check lighting
      const downscaledFile = await downscaleImage(file);
      
      // Clear error if downscaling succeeded
      setError(null);
      
      // Call callback with processed file
      onImageReady(downscaledFile);
    } catch (err: any) {
      if (err.message !== 'Photo too dark' && err.message !== 'Photo overexposed') {
        setError(err.message || 'Failed to process image');
      }
      // Don't clear preview on lighting errors - let user see what they uploaded
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleInputChange}
        className="hidden"
      />

      {!preview ? (
        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <button
                onClick={handleCapture}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2 px-6 py-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Take Photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2 px-6 py-4 border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Upload</span>
              </button>
            </div>
            {isProcessing && (
              <p className="text-sm text-zinc-500">Processing image...</p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border border-zinc-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4 text-zinc-700" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        <strong>Disclaimer:</strong> This is educational only, not medical advice. Your photo is not stored.
      </p>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

