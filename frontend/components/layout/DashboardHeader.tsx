'use client';
import { Menu, UserCircle } from 'lucide-react';
import { authService } from '@/lib/services/auth';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import { User } from '@/lib/types';

type DashboardHeaderProps = {
  onMenuClick: () => void;
};

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    setIsHydrated(true);

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
                {isHydrated ? (currentUser?.role ?? 'ADMIN') : 'ADMIN'}
              </p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
            >
              <UserCircle className="h-5 w-5 text-indigo-700" />
              <span className="max-w-40 truncate text-sm font-medium text-slate-800">
                {isHydrated ? (currentUser?.name || 'Profile') : 'Profile'}
              </span>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
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
