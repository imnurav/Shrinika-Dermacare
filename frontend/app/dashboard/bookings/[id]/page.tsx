'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TopLoader from '@/components/common/TopLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import PageHeader from '@/components/common/PageHeader';
import ActionButton from '@/components/common/ActionButton';
import { bookingsService } from '@/lib/services/bookings';
import { Booking } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) return;
      try {
        setIsLoading(true);
        const data = await bookingsService.getBooking(bookingId);
        setBooking(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadBooking();
  }, [bookingId]);

  const totalAmount = useMemo(() => {
    if (!booking?.bookingServices?.length) return 0;
    return booking.bookingServices.reduce((sum, item) => sum + (item.service?.price || 0), 0);
  }, [booking]);

  return (
    <DashboardLayout>
      <TopLoader loading={isLoading} />
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Booking Detail"
          description="View full booking information and generate invoice."
          actionButton={
            <>
              <ActionButton variant="secondary" onClick={() => router.push('/dashboard/bookings')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </ActionButton>
              <ActionButton variant="primary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Generate Invoice
              </ActionButton>
            </>
          }
        />

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

        <div className="min-h-0 flex-1 overflow-auto">
          {!booking ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Booking not found.
            </div>
          ) : (
            <div id="invoice-sheet" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Booking Info</h3>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                    <p><span className="font-medium">Booking ID:</span> {booking.id}</p>
                    <p><span className="font-medium">Status:</span> {booking.status}</p>
                    <p>
                      <span className="font-medium">Preferred Slot:</span>{' '}
                      {format(new Date(booking.preferredDate), 'dd MMM yyyy')} {booking.preferredTime}
                    </p>
                    <p>
                      <span className="font-medium">Created At:</span>{' '}
                      {booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a') : '-'}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Customer Info</h3>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                    <p><span className="font-medium">Name:</span> {booking.personName}</p>
                    <p><span className="font-medium">Phone:</span> {booking.personPhone}</p>
                    <p>
                      <span className="font-medium">Address:</span>{' '}
                      {booking.address
                        ? `${booking.address.addressLine1}, ${booking.address.city}, ${booking.address.state} ${booking.address.pincode}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Services & Invoice</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Service</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Duration</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-slate-500">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {booking.bookingServices?.length ? (
                        booking.bookingServices.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-slate-800">{item.service?.title || item.serviceId}</td>
                            <td className="px-4 py-2 text-sm text-slate-700">{item.service?.duration || 0} min</td>
                            <td className="px-4 py-2 text-right text-sm font-medium text-slate-900">Rs. {item.service?.price || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-5 text-center text-sm text-slate-500">
                            No services available
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total</td>
                        <td className="px-4 py-3 text-right text-base font-bold text-slate-900">Rs. {totalAmount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">Notes</p>
                <p className="mt-1">{booking.notes || 'No additional notes.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

