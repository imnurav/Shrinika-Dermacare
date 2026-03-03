'use client';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { bookingsService } from '@/lib/services/bookings';
import { useEffect, useMemo, useState } from 'react';
import { Booking } from '@/lib/types';

export function useBookingDetailPage(bookingId: string, initialBooking?: Booking | null) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) return;
      if (initialBooking && initialBooking.id === bookingId) return;
      try {
        setError(null);
        const data = await bookingsService.getBooking(bookingId);
        setBooking(data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    loadBooking();
  }, [bookingId, initialBooking]);

  const totalAmount = useMemo(() => {
    if (!booking?.bookingServices?.length) return 0;
    return booking.bookingServices.reduce((sum, item) => sum + (item.service?.price || 0), 0);
  }, [booking]);

  return { booking, error, setError, totalAmount };
}
