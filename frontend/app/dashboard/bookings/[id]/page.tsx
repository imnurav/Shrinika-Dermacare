import BookingDetailPage from '@/components/features/dashboard/booking-detail/BookingDetailPage';
import { getBookingByIdServer } from '@/lib/server/adminData';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const initialBooking = await getBookingByIdServer(id);
  return <BookingDetailPage bookingId={id} initialBooking={initialBooking} />;
}
