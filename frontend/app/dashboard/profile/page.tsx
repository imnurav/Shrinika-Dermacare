'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import TopLoader from '@/components/common/TopLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { FormInput } from '@/components/form/FormFields';
import ImageUploadField from '@/components/form/ImageUploadField';
import { useToast } from '@/components/common/ToastProvider';
import { usersService } from '@/lib/services/users';
import { authService } from '@/lib/services/auth';
import { uploadService } from '@/lib/services/upload';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const currentUser = authService.getCurrentUser();
  const canEditContact = currentUser?.role === 'SUPERADMIN';
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', imageUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'password') {
        setTab('password');
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const profile = await usersService.getProfile();
        setProfileData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          imageUrl: profile.imageUrl || '',
        });
        setImagePreview(profile.imageUrl || null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      let imageUrl = profileData.imageUrl;
      if (selectedFile) {
        imageUrl = await uploadService.uploadImage(selectedFile, 'users');
      }
      const updated = await usersService.updateProfile({ ...profileData, imageUrl });
      localStorage.setItem('user', JSON.stringify({ ...authService.getCurrentUser(), ...updated }));
      setSelectedFile(null);
      setImagePreview(updated.imageUrl || null);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await usersService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated successfully', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <TopLoader loading={isLoading || isSaving} />
      <div className="space-y-6">
        <PageHeader title="Profile" description="Manage your account details and security settings." />
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setTab('password')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              Change Password
            </button>
          </div>
        </div>

        {tab === 'profile' ? (
          <div className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <ImageUploadField
              label="Profile Image"
              value={profileData.imageUrl}
              preview={imagePreview}
              onFileChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                if (file) {
                  setImagePreview(URL.createObjectURL(file));
                } else {
                  setImagePreview(profileData.imageUrl || null);
                }
              }}
              onRemove={() => {
                setSelectedFile(null);
                setImagePreview(null);
                setProfileData((prev) => ({ ...prev, imageUrl: '' }));
              }}
            />
            <FormInput label="Name" value={profileData.name} onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))} />
            <FormInput
              label="Email"
              type="email"
              value={profileData.email}
              disabled={!canEditContact}
              onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
            />
            <FormInput
              label="Phone"
              value={profileData.phone}
              disabled={!canEditContact}
              onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
            />
            {!canEditContact && (
              <p className="text-xs text-amber-700">
                Email and phone can only be changed by Superadmin.
              </p>
            )}
            <ActionButton onClick={saveProfile} loading={isSaving}>Save Profile</ActionButton>
          </div>
        ) : (
          <div className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <FormInput label="Current Password" type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))} />
            <FormInput label="New Password" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))} />
            <FormInput label="Confirm New Password" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
            <ActionButton onClick={changePassword} loading={isSaving}>Update Password</ActionButton>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
