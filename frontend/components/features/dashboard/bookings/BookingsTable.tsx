'use client';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import IconActionButton from '@/components/common/IconActionButton';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import SortableHeader from '@/components/common/SortableHeader';
import { Booking, BookingStatus } from '@/lib/types';
import { Eye, SquarePen } from 'lucide-react';
import { format } from 'date-fns';

type Props = {
  sortBy: string;
  isLoading: boolean;
  bookings: Booking[];
  sortOrder: 'ASC' | 'DESC';
  onView: (id: string) => void;
  onSort: (field: string) => void;
  onEdit: (booking: Booking) => void;
  onStatusUpdate: (id: string, status: BookingStatus) => void;
};

export default function BookingsTable({
  sortBy,
  onSort,
  onView,
  onEdit,
  bookings,
  isLoading,
  sortOrder,
  onStatusUpdate,
}: Props) {
  if (isLoading) {
    return <TableSkeleton rows={8} columns={7} />;
  }

  return (
    <AdminTable minWidth={1100} outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" scrollClassName="h-full overflow-auto">
      <thead className="bg-gray-50">
        <tr>
          <AdminTh>Booking ID</AdminTh>
          <AdminTh><SortableHeader field="personName" label="Person" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} /></AdminTh>
          <AdminTh><SortableHeader field="preferredDate" label="Date" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} /></AdminTh>
          <AdminTh>Services</AdminTh>
          <AdminTh>Address</AdminTh>
          <AdminTh><SortableHeader field="status" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} /></AdminTh>
          <AdminTh>Actions</AdminTh>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {bookings.length === 0 ? (
          <AdminEmptyRow colSpan={7} />
        ) : (
          bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <AdminTd className="break-all font-mono text-xs text-gray-900">{booking.id}</AdminTd>
              <AdminTd>
                <div className="text-sm font-medium text-gray-900">{booking.personName}</div>
                <div className="text-sm text-gray-500">{booking.personPhone}</div>
              </AdminTd>
              <AdminTd>
                <div className="text-sm text-gray-900">{format(new Date(booking.preferredDate), 'MMM dd, yyyy')}</div>
                <div className="text-sm text-gray-500">{booking.preferredTime}</div>
              </AdminTd>
              <AdminTd className="text-gray-900">{booking.bookingServices?.map((item) => item.service?.title).filter(Boolean).join(', ') || '-'}</AdminTd>
              <AdminTd className="text-gray-900">{booking.address ? `${booking.address.addressLine1}, ${booking.address.city}` : '-'}</AdminTd>
              <AdminTd className="whitespace-nowrap">
                <select
                  className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                  value={booking.status}
                  onChange={(e) => onStatusUpdate(booking.id, e.target.value as BookingStatus)}
                >
                  <option value={BookingStatus.PENDING}>PENDING</option>
                  <option value={BookingStatus.CONFIRMED}>CONFIRMED</option>
                  <option value={BookingStatus.COMPLETED}>COMPLETED</option>
                  <option value={BookingStatus.CANCELLED}>CANCELLED</option>
                </select>
              </AdminTd>
              <AdminTd className="whitespace-nowrap font-medium">
                <div className="flex items-center gap-2">
                  <IconActionButton title="View booking" ariaLabel="View booking" onClick={() => onView(booking.id)} icon={<Eye className="h-4 w-4" />} variant="view" />
                  <IconActionButton title="Edit booking" ariaLabel="Edit booking" onClick={() => onEdit(booking)} icon={<SquarePen className="h-4 w-4" />} variant="edit" />
                </div>
              </AdminTd>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}

