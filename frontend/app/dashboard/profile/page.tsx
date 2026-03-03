'use client';
import { FormInput, FormSelect } from '@/components/form/FormFields';
import ImageUploadField from '@/components/form/ImageUploadField';
import { useCurrentUser } from '@/lib/context/CurrentUserContext';
import { useToast } from '@/components/common/ToastProvider';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import PageHeader from '@/components/common/PageHeader';
import { uploadService } from '@/lib/services/upload';
import { usersService } from '@/lib/services/users';
import { getUserAvatar } from '@/lib/utils/avatar';
import { authService } from '@/lib/services/auth';
import { useEffect, useState } from 'react';
import { UserGender } from '@/lib/types';
import Image from 'next/image';

export default function ProfilePage() {
  const { user: currentUser, setUser } = useCurrentUser();
  const { showToast } = useToast();
  const [canEditContact, setCanEditContact] = useState(false);
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    imageUrl: '',
    gender: UserGender.OTHER,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(getUserAvatar(undefined, UserGender.OTHER));

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setCanEditContact(currentUser?.role === 'SUPERADMIN');

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'password') {
        setTab('password');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await usersService.getProfile();
        setProfileData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          imageUrl: profile.imageUrl || '',
          gender: profile.gender || UserGender.OTHER,
        });
        setUser(profile);
        setImagePreview(profile.imageUrl || getUserAvatar(undefined, profile.gender || UserGender.OTHER));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    load();
  }, [setUser]);

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      let imageUrl = profileData.imageUrl;
      if (selectedFile) {
        imageUrl = await uploadService.uploadImage(selectedFile, 'users');
      }

      const updated = await usersService.updateProfile({ ...profileData, imageUrl });
      const mergedUser = { ...authService.getCurrentUser(), ...updated };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      setUser(mergedUser);

      setProfileData((prev) => ({ ...prev, imageUrl: updated.imageUrl || '' }));
      setSelectedFile(null);
      setImagePreview(updated.imageUrl || getUserAvatar(undefined, updated.gender || profileData.gender));
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
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Profile"
        description="Manage your account details and security settings."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' },
        ]}
      />

      <div className="min-h-0 flex-1 overflow-auto pb-4">
        <div className="space-y-4">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
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
            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 p-[3px] shadow-lg">
                    <Image
                      src={imagePreview}
                      alt={profileData.name || 'Profile avatar'}
                      width={112}
                      height={112}
                      className="h-28 w-28 rounded-full bg-white object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{profileData.name || 'Your Profile'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{currentUser?.role || 'ADMIN'}</p>
                </div>
              </aside>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <ImageUploadField
                  label="Profile Image"
                  preview={imagePreview}
                  onFileChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  onRemove={() => {
                    setSelectedFile(null);
                    setImagePreview(getUserAvatar(undefined, profileData.gender));
                    setProfileData((prev) => ({ ...prev, imageUrl: '' }));
                  }}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="Name"
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <FormSelect
                    label="Gender"
                    value={profileData.gender}
                    onChange={(e) => {
                      const nextGender = e.target.value as UserGender;
                      setProfileData((prev) => ({ ...prev, gender: nextGender }));
                      if (!selectedFile && !profileData.imageUrl) {
                        setImagePreview(getUserAvatar(undefined, nextGender));
                      }
                    }}
                    options={[
                      { value: UserGender.MALE, label: 'Male' },
                      { value: UserGender.FEMALE, label: 'Female' },
                      { value: UserGender.OTHER, label: 'Other' },
                    ]}
                  />
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
                </div>

                {!canEditContact && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Email and phone can only be changed by Superadmin.
                  </p>
                )}

                <div className="pt-1">
                  <ActionButton onClick={saveProfile} loading={isSaving}>Save Profile</ActionButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FormInput
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
              <FormInput
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
              <FormInput
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <ActionButton onClick={changePassword} loading={isSaving}>Update Password</ActionButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
