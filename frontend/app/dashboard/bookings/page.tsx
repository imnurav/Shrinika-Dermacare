import { parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { BOOKING_SORT_FIELDS } from '@/components/features/dashboard/bookings/constants';
import BookingsPage from '@/components/features/dashboard/bookings/BookingsPage';
import { getBookingsPageServer } from '@/lib/server/adminData';
import { BookingStatus } from '@/lib/types';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string, fallback = ''): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusRaw = readParam(params, 'status', 'ALL');
  const status =
    statusRaw === 'ALL' || Object.values(BookingStatus).includes(statusRaw as BookingStatus)
      ? (statusRaw as BookingStatus | 'ALL')
      : 'ALL';
  const query = {
    search: readParam(params, 'search', ''),
    status,
    startDate: readParam(params, 'startDate', ''),
    endDate: readParam(params, 'endDate', ''),
    page: Number(readParam(params, 'page', '1')),
    limit: parsePageSize(readParam(params, 'limit', '10')),
    sortBy: parseSortField(readParam(params, 'sortBy', 'createdAt'), BOOKING_SORT_FIELDS, 'createdAt'),
    sortOrder: parseSortOrder(readParam(params, 'sortOrder', 'DESC')),
  };

  const initialData = await getBookingsPageServer({
    search: query.search || undefined,
    status: query.status !== 'ALL' ? query.status : undefined,
    startDate: query.startDate && query.endDate ? query.startDate : undefined,
    endDate: query.startDate && query.endDate ? query.endDate : undefined,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return <BookingsPage initialData={initialData} initialQuery={query} />;
}
