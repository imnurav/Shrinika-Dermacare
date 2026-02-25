import { Booking, BookingStatus, PaginatedResponse } from '../types';
import api from '../api';

export const bookingsService = {
  getAllBookings: async (
    status?: BookingStatus,
    startDate?: string,
    endDate?: string,
    search?: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Booking> | Booking[]> => {
    const response = await api.get('/admin/bookings', {
      params: { status, startDate, endDate, search, page, limit },
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

  updateBooking: async (id: string, payload: Partial<Booking>): Promise<Booking> => {
    const response = await api.put<Booking>(`/admin/bookings/${id}`, payload);
    return response.data;
  },
};

