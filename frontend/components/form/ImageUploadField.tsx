'use client';
import { Upload, X } from 'lucide-react';
import React, { useId } from 'react';
import Image from 'next/image';

export interface ImageUploadFieldProps {
  label: string;
  preview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
  required?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  preview,
  onFileChange,
  onRemove,
  required = false,
}) => {
  const inputId = useId();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {preview ? (
        <div className="space-y-2">
          <div className="relative w-32 h-32">
            <Image
              src={preview}
              alt="Preview"
              width={128}
              height={128}
              unoptimized
              className="w-full h-full object-cover rounded-lg border-2 border-indigo-600"
            />
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Change Image
          </label>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-700">Upload Image</span>
          <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploadField;
