'use client';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import StatusBadge from '@/components/common/StatusBadge';
import { bookingsService } from '@/lib/services/bookings';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { Booking, BookingStatus } from '@/lib/types';
import Modal from '@/components/common/Modal';
import { useEffect, useState, useCallback } from 'react';
import { Edit } from 'lucide-react';
import { format } from 'date-fns';

const statusFilterOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: BookingStatus.PENDING, label: 'Pending' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
  { value: BookingStatus.COMPLETED, label: 'Completed' },
  { value: BookingStatus.CANCELLED, label: 'Cancelled' },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Edit modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    personName: '',
    personPhone: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    addressId: '',
    serviceIds: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bookingsService.getAllBookings(
        statusFilter !== 'ALL' ? statusFilter : undefined,
        undefined,
        undefined,
        searchTerm || undefined,
        page,
        limit
      );
      if (Array.isArray(data)) {
        setBookings(data);
        setTotalPages(1);
        setTotalItems(data.length);
      } else {
        setBookings(data.data);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, page, limit]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (id: string, newStatus: BookingStatus) => {
    try {
      setError(null);
      await bookingsService.updateBookingStatus(id, newStatus);
      fetchBookings();
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const openEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      personName: booking.personName || '',
      personPhone: booking.personPhone || '',
      preferredDate: booking.preferredDate ? new Date(booking.preferredDate).toISOString().substring(0, 10) : '',
      preferredTime: booking.preferredTime || '',
      notes: booking.notes || '',
      addressId: booking.addressId || '',
      serviceIds: booking.bookingServices ? booking.bookingServices.map((bs) => bs.serviceId).join(',') : '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
    setFormData({
      personName: '',
      personPhone: '',
      preferredDate: '',
      preferredTime: '',
      notes: '',
      addressId: '',
      serviceIds: '',
    });
  };

  const handleSave = async () => {
    if (!editingBooking) return;
    try {
      setIsSaving(true);
      setError(null);
      const payload = {
        personName: formData.personName,
        personPhone: formData.personPhone,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        notes: formData.notes,
        addressId: formData.addressId,
        ...(formData.serviceIds && {
          serviceIds: formData.serviceIds
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        }),
      };
      await bookingsService.updateBooking(editingBooking.id, payload);
      fetchBookings();
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.personPhone.includes(searchTerm) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Bookings" description="Manage all bookings" />

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

        {/* Filters */}
        <SearchFilterBar
          searchPlaceholder="Search by name, phone, or ID..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              id: 'status',
              label: 'Status',
              type: 'select',
              options: statusFilterOptions,
            },
          ]}
          filterValues={{ status: statusFilter }}
          onFilterChange={(id, value) => {
            if (id === 'status') {
              setStatusFilter(value as BookingStatus | 'ALL');
              setPage(1);
            }
          }}
        />

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{booking.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.personName}</div>
                        <div className="text-sm text-gray-500">{booking.personPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{format(new Date(booking.preferredDate), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-gray-500">{booking.preferredTime}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{booking.bookingServices?.length || 0} service(s)</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.address?.addressLine1}, {booking.address?.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {booking.status === BookingStatus.PENDING && (
                            <ActionButton
                              variant="success"
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.CONFIRMED)}
                            >
                              Confirm
                            </ActionButton>
                          )}
                          {booking.status === BookingStatus.CONFIRMED && (
                            <ActionButton
                              variant="success"
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.COMPLETED)}
                            >
                              Complete
                            </ActionButton>
                          )}
                          {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) && (
                            <ActionButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.CANCELLED)}
                            >
                              Cancel
                            </ActionButton>
                          )}
                          <ActionButton variant="secondary" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => openEdit(booking)}>
                            Edit
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} totalItems={totalItems} limit={limit} />

        {/* Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Edit Booking"
          size="lg"
          footer={
            <>
              <button onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <ActionButton variant="primary" onClick={handleSave} loading={isSaving}>
                Save
              </ActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <FormInput
              label="Person Name"
              required
              value={formData.personName}
              onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
              placeholder="Full name"
            />
            <FormInput
              label="Person Phone"
              required
              value={formData.personPhone}
              onChange={(e) => setFormData({ ...formData, personPhone: e.target.value })}
              placeholder="Phone number"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Preferred Date"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              />
              <FormInput
                label="Preferred Time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                placeholder="HH:MM"
              />
            </div>
            <FormInput
              label="Address ID"
              value={formData.addressId}
              onChange={(e) => setFormData({ ...formData, addressId: e.target.value })}
              placeholder="Address ID"
            />
            <FormInput
              label="Service IDs"
              value={formData.serviceIds}
              onChange={(e) => setFormData({ ...formData, serviceIds: e.target.value })}
              placeholder="Comma separated service IDs"
            />
            <FormTextArea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

