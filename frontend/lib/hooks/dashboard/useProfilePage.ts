'use client';
import { useCurrentUser } from '@/lib/context/CurrentUserContext';
import { useToast } from '@/components/common/ToastProvider';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { uploadService } from '@/lib/services/upload';
import { usersService } from '@/lib/services/users';
import { getUserAvatar } from '@/lib/utils/avatar';
import { authService } from '@/lib/services/auth';
import { useEffect, useState } from 'react';
import { User, UserGender } from '@/lib/types';

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  imageUrl: string;
  gender: UserGender;
};

type PasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMPTY_PROFILE: ProfileData = {
  name: '',
  email: '',
  phone: '',
  imageUrl: '',
  gender: UserGender.OTHER,
};

const EMPTY_PASSWORD: PasswordData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

type ProfileHookOptions = {
  initialProfile?: User | null;
};

export function useProfilePage(options?: ProfileHookOptions) {
  const { user: currentUser, setUser } = useCurrentUser();
  const { showToast } = useToast();
  const initialProfile = options?.initialProfile;

  const [canEditContact, setCanEditContact] = useState(false);
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>(
    initialProfile
      ? {
          name: initialProfile.name || '',
          email: initialProfile.email || '',
          phone: initialProfile.phone || '',
          imageUrl: initialProfile.imageUrl || '',
          gender: initialProfile.gender || UserGender.OTHER,
        }
      : EMPTY_PROFILE,
  );
  const [passwordData, setPasswordData] = useState<PasswordData>(EMPTY_PASSWORD);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    initialProfile?.imageUrl || getUserAvatar(undefined, initialProfile?.gender || UserGender.OTHER),
  );

  useEffect(() => {
    setCanEditContact(currentUser?.role === 'SUPERADMIN');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'password') setTab('password');
    }
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      if (initialProfile) {
        setUser(initialProfile);
        return;
      }
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
  }, [initialProfile, setUser]);

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      let imageUrl = profileData.imageUrl;
      if (selectedFile) imageUrl = await uploadService.uploadImage(selectedFile, 'users');
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
      setPasswordData(EMPTY_PASSWORD);
      showToast('Password updated successfully', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    tab,
    error,
    setTab,
    setError,
    isSaving,
    setUser,
    saveProfile,
    canEditContact,
    profileData,
    imagePreview,
    currentUser,
    selectedFile,
    passwordData,
    setProfileData,
    setImagePreview,
    changePassword,
    setSelectedFile,
    setPasswordData,
  };
}
