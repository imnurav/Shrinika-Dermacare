import DashboardLayout from '@/components/layout/DashboardLayout';
import { getProfileServer } from '@/lib/server/adminData';
import { UserRole } from '@/lib/types';
import { redirect } from 'next/navigation';

export default async function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfileServer();
  if (!profile || (profile.role !== UserRole.ADMIN && profile.role !== UserRole.SUPERADMIN)) {
    redirect('/login');
  }
  return <DashboardLayout initialUser={profile}>{children}</DashboardLayout>;
}
