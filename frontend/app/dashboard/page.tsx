'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { bookingsService } from '@/lib/services/bookings';
import { catalogService } from '@/lib/services/catalog';
import { usersService } from '@/lib/services/users';
import { useEffect, useState } from 'react';
import { BookingStatus } from '@/lib/types';
import {
  ShoppingBag,
  CheckCircle,
  TrendingUp,
  Calendar,
  Package,
  Users,
  Clock,
} from 'lucide-react';

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalCategories: number;
  totalServices: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    totalCategories: 0,
    totalServices: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookings, categories, services, users] = await Promise.all([
          bookingsService.getAllBookings(),
          catalogService.getCategories(),
          catalogService.getServices(),
          usersService.getAllUsers(),
        ]);

        const bookingsArray = Array.isArray(bookings) ? bookings : bookings.data;
        const servicesArray = Array.isArray(services) ? services : services.data;
        const usersArray = Array.isArray(users) ? users : users.data;

        setStats({
          totalBookings: bookingsArray.length,
          pendingBookings: bookingsArray.filter((b) => b.status === BookingStatus.PENDING).length,
          confirmedBookings: bookingsArray.filter((b) => b.status === BookingStatus.CONFIRMED).length,
          completedBookings: bookingsArray.filter((b) => b.status === BookingStatus.COMPLETED).length,
          totalCategories: categories.length,
          totalServices: servicesArray.length,
          totalUsers: usersArray.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Confirmed Bookings',
      value: stats.confirmedBookings,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completed Bookings',
      value: stats.completedBookings,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: Package,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Services',
      value: stats.totalServices,
      icon: ShoppingBag,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to the admin dashboard</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            type="error"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

