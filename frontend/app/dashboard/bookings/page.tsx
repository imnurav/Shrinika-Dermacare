'use client';
import { PAGE_SIZE_OPTIONS, parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import { Booking, BookingStatus, ServiceOption } from '@/lib/types';
import IconActionButton from '@/components/common/IconActionButton';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import SortableHeader from '@/components/common/SortableHeader';
import { useToast } from '@/components/common/ToastProvider';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { bookingsService } from '@/lib/services/bookings';
import { useEffect, useState, useCallback } from 'react';
import { catalogService } from '@/lib/services/catalog';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { Plus, X, Eye, SquarePen } from 'lucide-react';
import FormModal from '@/components/common/FormModal';
import { usersService } from '@/lib/services/users';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const statusFilterOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: BookingStatus.PENDING, label: 'Pending' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
  { value: BookingStatus.COMPLETED, label: 'Completed' },
  { value: BookingStatus.CANCELLED, label: 'Cancelled' },
];
const SORT_FIELDS = ['personName', 'personPhone', 'preferredDate', 'preferredTime', 'status', 'createdAt'] as const;

export default function BookingsPage() {
  const router = useRouter();
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    personName: '',
    personPhone: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    addressId: '',
    serviceIds: [] as string[],
  });
  const [addressCache, setAddressCache] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const [addressOptions, setAddressOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isEditMetaLoading, setIsEditMetaLoading] = useState(false);
  const [serviceSelectValue, setServiceSelectValue] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [isSaving, setIsSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const getDateQuery = useCallback((from: string, to: string) => {
    if (!from || !to) {
      return { startDate: '', endDate: '' };
    }
    return { startDate: from, endDate: to };
  }, []);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setStatusFilter((getParam('status', 'ALL') as BookingStatus | 'ALL') || 'ALL');
    setStartDate(getParam('startDate', ''));
    setEndDate(getParam('endDate', ''));
    setPage(Number(getParam('page', '1')));
    setLimit(parsePageSize(getParam('limit', '10')));
    const sortByParam = getParam('sortBy', 'createdAt');
    setSortBy(parseSortField(sortByParam, SORT_FIELDS, 'createdAt'));
    setSortOrder(parseSortOrder(getParam('sortOrder', 'DESC')));
    setIsQueryReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bookingsService.getAllBookings(
        statusFilter !== 'ALL' ? statusFilter : undefined,
        startDate && endDate ? startDate : undefined,
        startDate && endDate ? endDate : undefined,
        searchTerm || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      );
      setBookings(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalItems(data.meta.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, startDate, endDate, searchTerm, page, limit, sortBy, sortOrder]);

  const handleSort = useCallback((field: string) => {
    const nextOrder = sortBy === field ? (sortOrder === 'ASC' ? 'DESC' : 'ASC') : 'ASC';
    setSortBy(field);
    setSortOrder(nextOrder);
    setPage(1);
    setParams({
      search: searchTerm,
      status: statusFilter === 'ALL' ? '' : statusFilter,
      ...getDateQuery(startDate, endDate),
      page: '1',
      limit: String(limit),
      sortBy: field,
      sortOrder: nextOrder,
    });
  }, [sortBy, sortOrder, searchTerm, statusFilter, startDate, endDate, limit, setParams, getDateQuery]);

  const loadAddressesForUser = useCallback(async (userId: string) => {
    if (!userId) {
      setAddressOptions([]);
      return [] as Array<{ id: string; label: string }>;
    }

    if (addressCache[userId]) {
      setAddressOptions(addressCache[userId]);
      return addressCache[userId];
    }

    const userDetail = await usersService.getUser(userId);
    const options = (userDetail.addresses || []).map((address) => ({
      id: address.id,
      label: `${address.label} - ${address.addressLine1}, ${address.city}`,
    }));
    setAddressOptions(options);
    setAddressCache((prev) => ({ ...prev, [userId]: options }));
    return options;
  }, [addressCache]);

  useEffect(() => {
    if (serviceOptions.length > 0) return;
    const loadServiceOptions = async () => {
      try {
        const services = await catalogService.getServiceOptions();
        setServiceOptions(services);
      } catch {
        // Keep silent here; booking edit flow already handles and shows errors.
      }
    };
    loadServiceOptions();
  }, [serviceOptions.length]);

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
    });
    setIsModalOpen(true);
    setIsEditMetaLoading(true);

    try {
      const servicesPromise =
        serviceOptions.length > 0
          ? Promise.resolve(serviceOptions)
          : catalogService.getServiceOptions();
      const [services] = await Promise.all([
        servicesPromise,
        loadAddressesForUser(booking.userId),
      ]);
      if (serviceOptions.length === 0) {
        setServiceOptions(services);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsEditMetaLoading(false);
    }
  };

  useEffect(() => {
    if (!isQueryReady) return;
    fetchBookings();
  }, [fetchBookings, isQueryReady]);

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
    });
    setAddressOptions([]);
    setServiceSelectValue('');
    setIsEditMetaLoading(false);
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
      if (formData.preferredDate < today) {
        setError('Preferred date cannot be in the past.');
        return;
      }
      if (formData.preferredDate === today) {
        const nowTime = format(new Date(), 'HH:mm');
        if (formData.preferredTime < nowTime) {
          setError('Preferred time cannot be in the past.');
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
      });
      await fetchBookings();
      showToast('Booking updated successfully', 'success');
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');
  const minTime = formData.preferredDate !== format(new Date(), 'yyyy-MM-dd') ? undefined : format(new Date(), 'HH:mm');

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Bookings" description="Manage all bookings" />

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

      <SearchFilterBar
        searchPlaceholder="Search by booking ID, name or phone..."
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
          setParams({
            search: value,
            status: statusFilter === 'ALL' ? '' : statusFilter,
            ...getDateQuery(startDate, endDate),
            page: '1',
            limit: String(limit),
            sortBy,
            sortOrder,
          });
        }}
        filters={[
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: statusFilterOptions,
          },
          {
            id: 'startDate',
            label: 'From Date',
            type: 'date',
          },
          {
            id: 'endDate',
            label: 'To Date',
            type: 'date',
          },
        ]}
        filterValues={{ status: statusFilter, startDate, endDate }}
        onFilterChange={(id, value) => {
          if (id === 'status') {
            const next = (value as BookingStatus | 'ALL') || 'ALL';
            setStatusFilter(next);
            setPage(1);
            setParams({
              search: searchTerm,
              status: next === 'ALL' ? '' : next,
              ...getDateQuery(startDate, endDate),
              page: '1',
              limit: String(limit),
              sortBy,
              sortOrder,
            });
          }
          if (id === 'startDate' || id === 'endDate') {
            const nextStart = id === 'startDate' ? value : startDate;
            const nextEnd = id === 'endDate' ? value : endDate;
            setStartDate(nextStart);
            setEndDate(nextEnd);
            setPage(1);
            setParams({
              search: searchTerm,
              status: statusFilter === 'ALL' ? '' : statusFilter,
              ...getDateQuery(nextStart, nextEnd),
              page: '1',
              limit: String(limit),
              sortBy,
              sortOrder,
            });
          }
        }} />

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <AdminTable minWidth={1100} outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" scrollClassName="h-full overflow-auto">
            <thead className="bg-gray-50">
              <tr>
                <AdminTh>Booking ID</AdminTh>
                <AdminTh>
                  <SortableHeader field="personName" label="Person" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </AdminTh>
                <AdminTh>
                  <SortableHeader field="preferredDate" label="Date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </AdminTh>
                <AdminTh>Services</AdminTh>
                <AdminTh>Address</AdminTh>
                <AdminTh>
                  <SortableHeader field="status" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </AdminTh>
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
                    <AdminTd className="text-gray-900">
                      {booking.bookingServices?.map((item) => item.service?.title).filter(Boolean).join(', ') || '-'}
                    </AdminTd>
                    <AdminTd className="text-gray-900">
                      {booking.address ? `${booking.address.addressLine1}, ${booking.address.city}` : '-'}
                    </AdminTd>
                    <AdminTd className="whitespace-nowrap">
                      <select
                        className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                        value={booking.status}
                        onChange={(e) => handleStatusUpdate(booking.id, e.target.value as BookingStatus)}
                      >
                        <option value={BookingStatus.PENDING}>PENDING</option>
                        <option value={BookingStatus.CONFIRMED}>CONFIRMED</option>
                        <option value={BookingStatus.COMPLETED}>COMPLETED</option>
                        <option value={BookingStatus.CANCELLED}>CANCELLED</option>
                      </select>
                    </AdminTd>
                    <AdminTd className="whitespace-nowrap font-medium">
                      <div className="flex items-center gap-2">
                        <IconActionButton title="View booking" ariaLabel="View booking" onClick={() => router.push(`/dashboard/bookings/${booking.id}`)} icon={<Eye className="h-4 w-4" />} variant="view" />
                        <IconActionButton title="Edit booking" ariaLabel="Edit booking" onClick={() => openEdit(booking)} icon={<SquarePen className="h-4 w-4" />} variant="edit" />
                      </div>
                    </AdminTd>
                  </tr>
                ))
              )}
            </tbody>
          </AdminTable>
        )}
      </div>

      <Pagination
        page={page}
        setPage={(value) => {
          setPage(value);
          setParams({
            search: searchTerm,
            status: statusFilter === 'ALL' ? '' : statusFilter,
            ...getDateQuery(startDate, endDate),
            page: String(value),
            limit: String(limit),
            sortBy,
            sortOrder,
          });
        }}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        setLimit={(value) => {
          setLimit(value);
          setPage(1);
          setParams({
            search: searchTerm,
            status: statusFilter === 'ALL' ? '' : statusFilter,
            ...getDateQuery(startDate, endDate),
            page: '1',
            limit: String(value),
            sortBy,
            sortOrder,
          });
        }}
        limitOptions={PAGE_SIZE_OPTIONS} />

      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        title="Edit Booking"
        submitText="Save"
        loading={isSaving}
      >
        <div className="space-y-4">
          <FormInput
            label="Person Name"
            required
            value={formData.personName}
            onChange={(e) => setFormData((prev) => ({ ...prev, personName: e.target.value }))}
            placeholder="Full name" />
          <FormInput
            label="Person Phone"
            required
            value={formData.personPhone}
            onChange={(e) => setFormData((prev) => ({ ...prev, personPhone: e.target.value }))}
            placeholder="Phone number" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Preferred Date"
              type="date"
              min={minDate}
              value={formData.preferredDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, preferredDate: e.target.value }))} />
            <FormInput
              label="Preferred Time"
              type="time"
              min={minTime}
              value={formData.preferredTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, preferredTime: e.target.value }))} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
            <select
              value={formData.addressId}
              onChange={(e) => setFormData((prev) => ({ ...prev, addressId: e.target.value }))}
              disabled={isEditMetaLoading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">{isEditMetaLoading ? 'Loading addresses...' : 'Select address'}</option>
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
                disabled={isEditMetaLoading}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">{isEditMetaLoading ? 'Loading services...' : 'Select service'}</option>
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddService}
                disabled={isEditMetaLoading}
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
            rows={3} />
        </div>
      </FormModal>
    </div>
  );
}
