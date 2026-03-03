'use client';
import { FormInput, FormSelect } from '@/components/form/FormFields';
import ImageUploadField from '@/components/form/ImageUploadField';
import { useProfilePage } from '@/lib/hooks/dashboard/useProfilePage';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import PageHeader from '@/components/common/PageHeader';
import { getUserAvatar } from '@/lib/utils/avatar';
import { User, UserGender } from '@/lib/types';
import Image from 'next/image';

type Props = {
  initialProfile?: User | null;
};

export default function ProfilePage({ initialProfile }: Props) {
  const state = useProfilePage({ initialProfile });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Profile"
        description="Manage your account details and security settings."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
      />

      <div className="min-h-0 flex-1 overflow-auto pb-4">
        <div className="space-y-4">
          {state.error && <ErrorMessage message={state.error} onDismiss={() => state.setError(null)} type="error" />}

          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => state.setTab('profile')}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${state.tab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => state.setTab('password')}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${state.tab === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                Change Password
              </button>
            </div>
          </div>

          {state.tab === 'profile' ? (
            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 p-[3px] shadow-lg">
                    <Image
                      src={state.imagePreview}
                      alt={state.profileData.name || 'Profile avatar'}
                      width={112}
                      height={112}
                      className="h-28 w-28 rounded-full bg-white object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{state.profileData.name || 'Your Profile'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{state.currentUser?.role || 'ADMIN'}</p>
                </div>
              </aside>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <ImageUploadField
                  label="Profile Image"
                  preview={state.imagePreview}
                  onFileChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    state.setSelectedFile(file);
                    if (file) state.setImagePreview(URL.createObjectURL(file));
                  }}
                  onRemove={() => {
                    state.setSelectedFile(null);
                    state.setImagePreview(getUserAvatar(undefined, state.profileData.gender));
                    state.setProfileData((prev) => ({ ...prev, imageUrl: '' }));
                  }}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="Name"
                    value={state.profileData.name}
                    onChange={(e) => state.setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <FormSelect
                    label="Gender"
                    value={state.profileData.gender}
                    onChange={(e) => {
                      const nextGender = e.target.value as UserGender;
                      state.setProfileData((prev) => ({ ...prev, gender: nextGender }));
                      if (!state.selectedFile && !state.profileData.imageUrl) {
                        state.setImagePreview(getUserAvatar(undefined, nextGender));
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
                    value={state.profileData.email}
                    disabled={!state.canEditContact}
                    onChange={(e) => state.setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <FormInput
                    label="Phone"
                    value={state.profileData.phone}
                    disabled={!state.canEditContact}
                    onChange={(e) => state.setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {!state.canEditContact && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Email and phone can only be changed by Superadmin.
                  </p>
                )}

                <div className="pt-1">
                  <ActionButton onClick={state.saveProfile} loading={state.isSaving}>Save Profile</ActionButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FormInput
                label="Current Password"
                type="password"
                value={state.passwordData.currentPassword}
                onChange={(e) => state.setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
              <FormInput
                label="New Password"
                type="password"
                value={state.passwordData.newPassword}
                onChange={(e) => state.setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
              <FormInput
                label="Confirm New Password"
                type="password"
                value={state.passwordData.confirmPassword}
                onChange={(e) => state.setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <ActionButton onClick={state.changePassword} loading={state.isSaving}>Update Password</ActionButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
