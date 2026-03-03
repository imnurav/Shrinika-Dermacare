'use client';
import ErrorMessage from '@/components/common/ErrorMessage';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import { useDashboardOverview } from '@/lib/hooks/dashboard/useDashboardOverview';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { DashboardAnalytics } from '@/lib/types';

type Props = {
  initialStats?: DashboardAnalytics | null;
};

export default function DashboardPage({ initialStats }: Props) {
  const router = useRouter();
  const { stats, error, setError, statCards } = useDashboardOverview(initialStats);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-1">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-500 p-6 text-white">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-indigo-100">Operational snapshot from a single analytics API</p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          type="error" />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5"
              onClick={() => router.push(stat.href)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:text-xs">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 md:mt-2 md:text-3xl">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} rounded-lg p-2 md:p-3`}>
                  <Icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        <AdminTable minWidth={900} outerClassName="">
            <thead className="bg-gray-50">
              <tr>
                <AdminTh>Booking</AdminTh>
                <AdminTh>Person</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Preferred Date</AdminTh>
                <AdminTh>Created</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {stats.recentBookings.length === 0 ? (
                <AdminEmptyRow colSpan={5} message="No recent bookings available" />
              ) : (
                stats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <AdminTd className="break-all font-mono text-xs">{booking.id}</AdminTd>
                    <AdminTd className="font-medium text-gray-900">{booking.personName || '-'}</AdminTd>
                    <AdminTd>{booking.status}</AdminTd>
                    <AdminTd>{format(new Date(booking.preferredDate), 'MMM dd, yyyy')}</AdminTd>
                    <AdminTd className="text-gray-500">{format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}</AdminTd>
                  </tr>
                ))
              )}
            </tbody>
          </AdminTable>
      </div>
        </div>
      </div>
    </>
  );
}
