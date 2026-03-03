'use client';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import ImageUploadField from '@/components/form/ImageUploadField';
import FormModal from '@/components/common/FormModal';
import { CategoryFormData } from './types';

type Props = {
  isOpen: boolean;
  loading: boolean;
  editing: boolean;
  formData: CategoryFormData;
  imagePreview: string | null;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (next: CategoryFormData) => void;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
};

export default function CategoryFormModal({
  isOpen,
  loading,
  editing,
  formData,
  imagePreview,
  onClose,
  onSubmit,
  onChange,
  onFileChange,
  onRemoveImage,
}: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editing ? 'Edit Category' : 'Add Category'}
      submitText={editing ? 'Update' : 'Create'}
      loading={loading}
    >
      <div className="space-y-4">
        <FormInput
          label="Name"
          required
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="Category name"
        />
        <FormTextArea
          label="Description"
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="Category description"
          rows={3}
        />
        <ImageUploadField
          label="Image"
          preview={imagePreview}
          onFileChange={(e) => onFileChange(e.target.files?.[0] || null)}
          onRemove={onRemoveImage}
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => onChange({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Active
          </label>
        </div>
      </div>
    </FormModal>
  );
}

