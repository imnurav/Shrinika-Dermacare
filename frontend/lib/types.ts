export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface AdminUserDetail extends User {
  addresses?: Address[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface ServiceOption {
  id: string;
  title: string;
  categoryId: string;
}

export interface Booking {
  id: string;
  userId: string;
  addressId: string;
  personName: string;
  personPhone: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  address?: {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  bookingServices?: Array<{
    id: string;
    serviceId: string;
    service: Service;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardAnalytics {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalCategories: number;
  totalServices: number;
  totalUsers: number;
  recentBookings: Array<{
    id: string;
    personName: string;
    status: BookingStatus;
    preferredDate: string;
    createdAt: string;
  }>;
}
