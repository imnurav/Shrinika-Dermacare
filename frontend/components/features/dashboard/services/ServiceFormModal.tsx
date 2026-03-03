'use client';
import FormModal from '@/components/common/FormModal';
import { CategoryOption } from '@/lib/types';
import { ServiceFormData } from './types';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

type Props = {
  isOpen: boolean;
  loading: boolean;
  editing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: ServiceFormData;
  onRemoveImage: () => void;
  imagePreview: string | null;
  categories: CategoryOption[];
  onChange: (next: ServiceFormData) => void;
  onFileChange: (file: File | null) => void;
};

export default function ServiceFormModal({
  isOpen,
  loading,
  editing,
  onClose,
  formData,
  onSubmit,
  onChange,
  categories,
  imagePreview,
  onFileChange,
  onRemoveImage,
}: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editing ? 'Edit Service' : 'Add Service'}
      submitText={loading ? 'Uploading...' : editing ? 'Update' : 'Create'}
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Category *</label>
          <select
            required
            value={formData.categoryId}
            onChange={(e) => onChange({ ...formData, categoryId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => onChange({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Image</label>
          {imagePreview ? (
            <div className="relative mb-2">
              <Image src={imagePreview} alt="Preview" width={800} height={320} unoptimized className="h-48 w-full rounded-lg border border-gray-300 object-cover" />
              <button type="button" onClick={onRemoveImage} className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="mb-2 text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}

          <input id="image-upload-service" type="file" accept="image/*" onChange={(e) => onFileChange(e.target.files?.[0] || null)} className="hidden" />
          <label htmlFor="image-upload-service" className="mt-2 block w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-center transition-colors hover:bg-gray-50">
            {imagePreview ? 'Change Image' : 'Choose Image'}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Duration (min) *</label>
            <input
              type="number"
              required
              min="1"
              value={formData.duration}
              onChange={(e) => onChange({ ...formData, duration: parseInt(e.target.value || '0', 10) })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => onChange({ ...formData, price: parseFloat(e.target.value || '0') })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => onChange({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active</label>
        </div>
      </div>
    </FormModal>
  );
}