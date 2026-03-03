import ProfilePage from '@/components/features/dashboard/profile/ProfilePage';
import { getProfileServer } from '@/lib/server/adminData';

export default async function Page() {
  const initialProfile = await getProfileServer();
  return <ProfilePage initialProfile={initialProfile} />;
}
