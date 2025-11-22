'use client';
import { authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();

    if (!token || !user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

