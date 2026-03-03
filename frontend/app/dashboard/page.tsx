import DashboardOverviewPage from '@/components/features/dashboard/overview/DashboardOverviewPage';
import { getDashboardAnalyticsServer } from '@/lib/server/adminData';

export default async function Page() {
  const initialStats = await getDashboardAnalyticsServer();
  return <DashboardOverviewPage initialStats={initialStats} />;
}
