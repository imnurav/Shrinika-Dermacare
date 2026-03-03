'use client';
import { usePathname } from 'next/navigation';
import TopLoader from '@/components/common/TopLoader';
import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { CurrentUserProvider } from '@/lib/context/CurrentUserContext';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';

export type DashboardLayoutProps = {
  children: React.ReactNode;
  initialUser?: User | null;
};

export default function DashboardLayout({ children, initialUser }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dashboard.sidebar.collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('dashboard.sidebar.collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!routeLoading) return;
    const timer = setTimeout(() => setRouteLoading(false), 250);
    return () => clearTimeout(timer);
  }, [pathname, routeLoading]);

  return (
    <CurrentUserProvider initialUser={initialUser ?? null}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <TopLoader loading={routeLoading} />
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapsed={handleToggleCollapsed}
          onMobileClose={() => setMobileOpen(false)}
          onNavigate={() => setRouteLoading(true)}
        />
        <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <DashboardHeader onMenuClick={() => setMobileOpen(true)} routeLoading={routeLoading} />
          <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 lg:px-6">
            {children}
          </main>
          <footer className="h-0" />
        </div>
      </div>
    </CurrentUserProvider>
  );
}
