'use client';
import ErrorMessage from '@/components/common/ErrorMessage';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { adminService } from '@/lib/services/admin';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardAnalytics } from '@/lib/types';
import { format } from 'date-fns';
import {
  ShoppingBag,
  CheckCircle,
  TrendingUp,
  Calendar,
  Package,
  Users,
  Clock,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardAnalytics>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalCategories: 0,
    totalServices: 0,
    totalUsers: 0,
    recentBookings: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardAnalytics();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(getErrorMessage(error));
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      href: '/dashboard/bookings',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/dashboard/bookings',
    },
    {
      title: 'Confirmed Bookings',
      value: stats.confirmedBookings,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/dashboard/bookings',
    },
    {
      title: 'Completed Bookings',
      value: stats.completedBookings,
      icon: TrendingUp,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      href: '/dashboard/bookings',
    },
    {
      title: 'Cancelled Bookings',
      value: stats.cancelledBookings,
      icon: XCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      href: '/dashboard/bookings',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/dashboard/categories',
    },
    {
      title: 'Services',
      value: stats.totalServices,
      icon: ShoppingBag,
      color: 'text-fuchsia-600',
      bgColor: 'bg-fuchsia-50',
      href: '/dashboard/services',
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      href: '/dashboard/users',
    },
  ];

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
