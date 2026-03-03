import { getProfileServer } from '@/lib/server/adminData';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/types';

export default async function Page() {
  const profile = await getProfileServer();
  if (profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.SUPERADMIN)) {
    redirect('/dashboard');
  }
  redirect('/login');
}
