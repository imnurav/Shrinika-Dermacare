'use client';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import TopLoader from '@/components/common/TopLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { bookingsService } from '@/lib/services/bookings';
import { catalogService } from '@/lib/services/catalog';
import { usersService } from '@/lib/services/users';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { Booking, BookingStatus, ServiceOption } from '@/lib/types';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import Modal from '@/components/common/Modal';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useToast } from '@/components/common/ToastProvider';
import { useRouter } from 'next/navigation';
import { Plus, X, Eye, SquarePen } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';

const statusFilterOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: BookingStatus.PENDING, label: 'Pending' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
  { value: BookingStatus.COMPLETED, label: 'Completed' },
  { value: BookingStatus.CANCELLED, label: 'Cancelled' },
];

export default function BookingsPage() {
  const router = useRouter();
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(getParam('search', ''));
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>(
    (getParam('status', 'ALL') as BookingStatus | 'ALL') || 'ALL',
  );
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    personName: '',
    personPhone: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    addressId: '',
    serviceIds: [] as string[],
    manualOverride: false,
  });
  const [addressOptions, setAddressOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [serviceSelectValue, setServiceSelectValue] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(Number(getParam('page', '1')));
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setStatusFilter((getParam('status', 'ALL') as BookingStatus | 'ALL') || 'ALL');
    setPage(Number(getParam('page', '1')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        limit,
      );
      setBookings(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalItems(data.meta.total);
    } catch (err) {
      setError(getErrorMessage(err));
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
      setBookings((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      showToast('Booking status updated', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openEdit = async (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      personName: booking.personName || '',
      personPhone: booking.personPhone || '',
      preferredDate: booking.preferredDate ? new Date(booking.preferredDate).toISOString().slice(0, 10) : '',
      preferredTime: booking.preferredTime ? booking.preferredTime.slice(0, 5) : '',
      notes: booking.notes || '',
      addressId: booking.addressId || '',
      serviceIds: booking.bookingServices ? booking.bookingServices.map((bs) => bs.serviceId) : [],
      manualOverride: false,
    });
    setIsModalOpen(true);

    try {
      const [userDetail, services] = await Promise.all([
        usersService.getUser(booking.userId),
        catalogService.getServiceOptions(),
      ]);
      setAddressOptions(
        (userDetail.addresses || []).map((address) => ({
          id: address.id,
          label: `${address.label} - ${address.addressLine1}, ${address.city}`,
        })),
      );
      setServiceOptions(services);
    } catch (err) {
      setError(getErrorMessage(err));
    }
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
      serviceIds: [],
      manualOverride: false,
    });
    setAddressOptions([]);
    setServiceOptions([]);
    setServiceSelectValue('');
  };

  const handleAddService = () => {
    if (!serviceSelectValue) return;
    if (formData.serviceIds.includes(serviceSelectValue)) {
      setServiceSelectValue('');
      return;
    }
    setFormData((prev) => ({ ...prev, serviceIds: [...prev.serviceIds, serviceSelectValue] }));
    setServiceSelectValue('');
  };

  const handleRemoveService = (serviceId: string) => {
    setFormData((prev) => ({ ...prev, serviceIds: prev.serviceIds.filter((id) => id !== serviceId) }));
  };

  const handleSave = async () => {
    if (!editingBooking) return;
    try {
      setIsSaving(true);
      setError(null);
      const today = format(new Date(), 'yyyy-MM-dd');
      if (!formData.manualOverride && formData.preferredDate < today) {
        setError('Preferred date cannot be in the past. Enable manual override if needed.');
        return;
      }
      if (!formData.manualOverride && formData.preferredDate === today) {
        const nowTime = format(new Date(), 'HH:mm');
        if (formData.preferredTime < nowTime) {
          setError('Preferred time cannot be in the past. Enable manual override if needed.');
          return;
        }
      }
      await bookingsService.updateBooking(editingBooking.id, {
        personName: formData.personName,
        personPhone: formData.personPhone,
        preferredDate: formData.preferredDate,
        preferredTime: `${formData.preferredTime}:00`,
        notes: formData.notes,
        addressId: formData.addressId,
        serviceIds: formData.serviceIds,
        manualOverride: formData.manualOverride,
      } as any);
      await fetchBookings();
      showToast('Booking updated successfully', 'success');
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const minDate = formData.manualOverride ? undefined : format(new Date(), 'yyyy-MM-dd');
  const minTime =
    formData.manualOverride || formData.preferredDate !== format(new Date(), 'yyyy-MM-dd')
      ? undefined
      : format(new Date(), 'HH:mm');

  return (
    <DashboardLayout>
      <TopLoader loading={isLoading || isSaving} />
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader title="Bookings" description="Manage all bookings" />

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

        <SearchFilterBar
          searchPlaceholder="Search by name or phone..."
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
            setParams({ search: value, status: statusFilter === 'ALL' ? '' : statusFilter, page: '1' });
          }}
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
              const next = (value as BookingStatus | 'ALL') || 'ALL';
              setStatusFilter(next);
              setPage(1);
              setParams({ search: searchTerm, status: next === 'ALL' ? '' : next, page: '1' });
            }
          }}
        />

        <div className="min-h-0 flex-1">
          {isLoading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : (
            <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="h-full overflow-auto">
                <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Services</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No data
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
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
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.bookingServices?.map((item) => item.service?.title).filter(Boolean).join(', ') || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.address ? `${booking.address.addressLine1}, ${booking.address.city}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                            value={booking.status}
                            onChange={(e) => handleStatusUpdate(booking.id, e.target.value as BookingStatus)}
                          >
                            <option value={BookingStatus.PENDING}>PENDING</option>
                            <option value={BookingStatus.CONFIRMED}>CONFIRMED</option>
                            <option value={BookingStatus.COMPLETED}>COMPLETED</option>
                            <option value={BookingStatus.CANCELLED}>CANCELLED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="View booking"
                              aria-label="View booking"
                              onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Edit booking"
                              aria-label="Edit booking"
                              onClick={() => openEdit(booking)}
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <SquarePen className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <Pagination
          page={page}
          setPage={(value) => {
            setPage(value);
            setParams({ search: searchTerm, status: statusFilter === 'ALL' ? '' : statusFilter, page: String(value) });
          }}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Edit Booking"
          size="xl"
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
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
              onChange={(e) => setFormData((prev) => ({ ...prev, personName: e.target.value }))}
              placeholder="Full name"
            />
            <FormInput
              label="Person Phone"
              required
              value={formData.personPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, personPhone: e.target.value }))}
              placeholder="Phone number"
            />

            <label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={formData.manualOverride}
                onChange={(e) => setFormData((prev) => ({ ...prev, manualOverride: e.target.checked }))}
              />
              Allow manual booking for past date/time
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Preferred Date"
                type="date"
                min={minDate}
                value={formData.preferredDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, preferredDate: e.target.value }))}
              />
              <FormInput
                label="Preferred Time"
                type="time"
                min={minTime}
                value={formData.preferredTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, preferredTime: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
              <select
                value={formData.addressId}
                onChange={(e) => setFormData((prev) => ({ ...prev, addressId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select address</option>
                {addressOptions.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Services</label>
              <div className="flex gap-2">
                <select
                  value={serviceSelectValue}
                  onChange={(e) => setServiceSelectValue(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select service</option>
                  {serviceOptions.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {formData.serviceIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.serviceIds.map((serviceId) => {
                    const service = serviceOptions.find((item) => item.id === serviceId);
                    return (
                      <div
                        key={serviceId}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800"
                      >
                        <span>{service?.title || serviceId}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(serviceId)}
                          className="rounded-full p-0.5 text-indigo-700 hover:bg-indigo-200"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No services selected.</p>
              )}
            </div>

            <FormTextArea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
