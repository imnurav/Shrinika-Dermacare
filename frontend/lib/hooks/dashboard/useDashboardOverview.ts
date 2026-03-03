'use client';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/lib/services/admin';
import { DashboardAnalytics } from '@/lib/types';
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

const EMPTY_STATS: DashboardAnalytics = {
  totalBookings: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  totalCategories: 0,
  totalServices: 0,
  totalUsers: 0,
  recentBookings: [],
};

export function useDashboardOverview(initialStats?: DashboardAnalytics | null) {
  const [stats, setStats] = useState<DashboardAnalytics>(initialStats || EMPTY_STATS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStats) return;
    const fetchStats = async () => {
      try {
        setError(null);
        const data = await adminService.getDashboardAnalytics();
        setStats(data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    fetchStats();
  }, [initialStats]);

  const statCards = useMemo(
    () => [
      { title: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-sky-600', bgColor: 'bg-sky-50', href: '/dashboard/bookings' },
      { title: 'Pending Bookings', value: stats.pendingBookings, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', href: '/dashboard/bookings' },
      { title: 'Confirmed Bookings', value: stats.confirmedBookings, icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', href: '/dashboard/bookings' },
      { title: 'Completed Bookings', value: stats.completedBookings, icon: TrendingUp, color: 'text-violet-600', bgColor: 'bg-violet-50', href: '/dashboard/bookings' },
      { title: 'Cancelled Bookings', value: stats.cancelledBookings, icon: XCircle, color: 'text-rose-600', bgColor: 'bg-rose-50', href: '/dashboard/bookings' },
      { title: 'Categories', value: stats.totalCategories, icon: Package, color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: '/dashboard/categories' },
      { title: 'Services', value: stats.totalServices, icon: ShoppingBag, color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', href: '/dashboard/services' },
      { title: 'Users', value: stats.totalUsers, icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-50', href: '/dashboard/users' },
    ],
    [stats],
  );

  return { stats, error, setError, statCards };
}
