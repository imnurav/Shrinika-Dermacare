'use client';
import { Menu, UserCircle } from 'lucide-react';
import { authService } from '@/lib/services/auth';
import { useCurrentUser } from '@/lib/context/CurrentUserContext';
import { getUserAvatar } from '@/lib/utils/avatar';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import Image from 'next/image';

type DashboardHeaderProps = {
  onMenuClick: () => void;
  routeLoading?: boolean;
};

export default function DashboardHeader({ onMenuClick, routeLoading = false }: DashboardHeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useCurrentUser();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const clickListener = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', clickListener);
    return () => document.removeEventListener('mousedown', clickListener);
  }, []);

  const logout = () => {
    authService.logout();
    router.push('/login');
  };

  return (
    <>
      <header className="z-30 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <p className="text-sm font-semibold leading-tight text-slate-900">Shrinika Derma Admin</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {isClient ? (currentUser?.role ?? 'ADMIN') : 'ADMIN'}
              </p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:bg-slate-50"
            >
              {isClient && currentUser ? (
                <span className="rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 p-[2px]">
                  <Image
                    src={getUserAvatar(currentUser.imageUrl, currentUser.gender)}
                    alt={currentUser.name || 'User'}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full bg-white object-cover"
                  />
                </span>
              ) : (
                <UserCircle className="h-5 w-5 text-indigo-700" />
              )}
              <span className="max-w-40 truncate text-sm font-medium text-slate-800">
                {isClient ? (currentUser?.name || 'User') : 'User'}
              </span>
            </button>
            {routeLoading && (
              <span className="pointer-events-none absolute -right-2 -top-2 h-3.5 w-3.5 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            )}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="mb-2 rounded-xl border border-slate-100 bg-gradient-to-r from-indigo-50 via-sky-50 to-teal-50 p-3">
                  <div className="flex items-center gap-3">
                    {isClient && currentUser ? (
                      <Image
                        src={getUserAvatar(currentUser.imageUrl, currentUser.gender)}
                        alt={currentUser.name || 'User'}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full border border-white object-cover shadow-sm"
                      />
                    ) : (
                      <UserCircle className="h-10 w-10 text-indigo-700" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{isClient ? (currentUser?.name || 'User') : 'User'}</p>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{isClient ? (currentUser?.role || 'ADMIN') : 'ADMIN'}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    router.push('/dashboard/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push('/dashboard/profile?tab=password');
                    setIsProfileOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsLogoutOpen(true);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Modal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        title="Confirm logout"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsLogoutOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              Logout
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">You will need to sign in again to continue.</p>
      </Modal>
    </>
  );
}
