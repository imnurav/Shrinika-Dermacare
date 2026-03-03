import { Booking, BookingStatus, PaginatedResponse } from '../types';
import api from '../api';

export const bookingsService = {
  getAllBookings: async (
    status?: BookingStatus,
    startDate?: string,
    endDate?: string,
    search?: string,
    page = 1,
    limit = 10,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResponse<Booking>> => {
    const response = await api.get('/admin/bookings', {
      params: { status, startDate, endDate, search, page, limit, sortBy, sortOrder },
    });
    return response.data;
  },

  getBooking: async (id: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/admin/bookings/${id}`);
    return response.data;
  },

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const response = await api.put<Booking>(`/admin/bookings/${id}/status`, { status });
    return response.data;
  },

  updateBooking: async (
    id: string,
    payload: Partial<Booking> & { serviceIds?: string[] },
  ): Promise<Booking> => {
    const response = await api.put<Booking>(`/admin/bookings/${id}`, payload);
    return response.data;
  },

  createBookingForUser: async (
    payload: {
      userId: string;
      addressId: string;
      personName: string;
      personPhone: string;
      preferredDate: string;
      preferredTime: string;
      notes?: string;
      serviceIds: string[];
    },
  ): Promise<Booking> => {
    const response = await api.post<Booking>('/admin/bookings', payload);
    return response.data;
  },
};
