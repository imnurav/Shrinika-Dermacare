'use client';
import { FormInput, FormSelect } from '@/components/form/FormFields';
import ImageUploadField from '@/components/form/ImageUploadField';
import { User, UserGender, UserRole } from '@/lib/types';
import FormModal from '@/components/common/FormModal';
import { Dispatch, SetStateAction } from 'react';
import { UserFormData } from './types';

type Props = {
  isOpen: boolean;
  loading: boolean;
  currentUserId?: string;
  currentUserRole?: UserRole;
  editingUser: User | null;
  formData: UserFormData;
  imagePreview: string | null;
  onClose: () => void;
  onSubmit: () => void;
  setFormData: Dispatch<SetStateAction<UserFormData>>;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
};

export default function UserFormModal({
  isOpen,
  loading,
  currentUserId,
  currentUserRole,
  editingUser,
  formData,
  imagePreview,
  onClose,
  onSubmit,
  setFormData,
  onFileChange,
  onRemoveImage,
}: Props) {
  const isCreateMode = !editingUser;

  const roleOptions = [
    { value: UserRole.USER, label: 'User' },
    ...(currentUserRole === UserRole.SUPERADMIN ? [{ value: UserRole.ADMIN, label: 'Admin' }] : []),
  ];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isCreateMode ? 'Create User' : 'Edit User'}
      submitText={isCreateMode ? 'Create' : 'Save'}
      loading={loading}
    >
      <div className="space-y-4">
        <FormInput
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="User name"
        />
        <FormInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email address"
          disabled={!isCreateMode}
        />
        <FormInput
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="Phone number"
        />
        {isCreateMode && (
          <FormInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Minimum 6 characters"
          />
        )}
        <ImageUploadField
          label="Profile Image"
          preview={imagePreview}
          onFileChange={(e) => onFileChange(e.target.files?.[0] || null)}
          onRemove={onRemoveImage}
        />
        <FormSelect
          label="Gender"
          value={formData.gender}
          onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as UserGender }))}
          options={[
            { value: UserGender.MALE, label: 'Male' },
            { value: UserGender.FEMALE, label: 'Female' },
            { value: UserGender.OTHER, label: 'Other' },
          ]}
        />
        <FormSelect
          label="Role"
          value={formData.role}
          onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as UserRole }))}
          options={roleOptions}
          disabled={currentUserId === editingUser?.id}
        />
      </div>
    </FormModal>
  );
}
