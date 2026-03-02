'use client';
import { authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();

    if (!token || !user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem('dashboard.sidebar.collapsed');
    setCollapsed(stored === 'true');
  }, []);

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('dashboard.sidebar.collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={handleToggleCollapsed}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <DashboardHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 lg:px-6">
          {children}
        </main>
        <footer className="h-0" />
      </div>
    </div>
  );
}
