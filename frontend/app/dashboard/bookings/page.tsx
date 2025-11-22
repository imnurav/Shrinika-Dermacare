'use client';
import { Search, Filter, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { bookingsService } from '@/lib/services/bookings';
import Pagination from '@/components/common/Pagination';
import { Booking, BookingStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function BookingsPage() {
  const [formData, setFormData] = useState({ personName: '', personPhone: '', preferredDate: '', preferredTime: '', notes: '', addressId: '', serviceIds: '' });
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bookingsService.getAllBookings(
        statusFilter !== 'ALL' ? statusFilter : undefined,
        undefined,
        undefined,
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
      console.error('Error fetching bookings:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: BookingStatus) => {
    try {
      setError(null);
      await bookingsService.updateBookingStatus(id, newStatus);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
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
      serviceIds: booking.bookingServices ? booking.bookingServices.map(bs => bs.serviceId).join(',') : '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  const handleSave = async () => {
    if (!editingBooking) return;
    try {
      setIsSaving(true);
      setError(null);
      const payload: any = {
        personName: formData.personName,
        personPhone: formData.personPhone,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        notes: formData.notes,
        addressId: formData.addressId,
      };
      if (formData.serviceIds) payload.serviceIds = formData.serviceIds.split(',').map(s => s.trim()).filter(Boolean);
      await bookingsService.updateBooking(editingBooking.id, payload);
      fetchBookings();
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [BookingStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return <Clock className="w-4 h-4 opacity-100" />;
      case BookingStatus.CONFIRMED:
        return <CheckCircle className="w-4 h-4 opacity-100" />;
      case BookingStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 opacity-100" />;
      case BookingStatus.CANCELLED:
        return <XCircle className="w-4 h-4 opacity-100" />;
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
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-1">Manage all bookings</p>
          </div>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            type="error"
          />
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 opacity-100" />
              <input
                type="text"
                placeholder="Search by name, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5 opacity-100" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALL')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="ALL">All Status</option>
                <option value={BookingStatus.PENDING}>Pending</option>
                <option value={BookingStatus.CONFIRMED}>Confirmed</option>
                <option value={BookingStatus.COMPLETED}>Completed</option>
                <option value={BookingStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Person
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {booking.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.personName}</div>
                        <div className="text-sm text-gray-500">{booking.personPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(booking.preferredDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">{booking.preferredTime}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.bookingServices?.length || 0} service(s)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.address?.addressLine1}, {booking.address?.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            booking.status
                          )}`}
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {booking.status === BookingStatus.PENDING && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.CONFIRMED)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Confirm
                            </button>
                          )}
                          {booking.status === BookingStatus.CONFIRMED && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, BookingStatus.COMPLETED)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                          )}
                          {(booking.status === BookingStatus.PENDING ||
                            booking.status === BookingStatus.CONFIRMED) && (
                              <button
                                onClick={() => handleStatusUpdate(booking.id, BookingStatus.CANCELLED)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                          <button onClick={() => openEdit(booking)} className="text-indigo-600 hover:text-indigo-900"> <Edit className="inline w-4 h-4" /> Edit</button>
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
        {isModalOpen && editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit Booking</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><XCircle /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Person Name</label>
                  <input value={formData.personName} onChange={(e) => setFormData({ ...formData, personName: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Person Phone</label>
                  <input value={formData.personPhone} onChange={(e) => setFormData({ ...formData, personPhone: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
                    <input type="date" value={formData.preferredDate} onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                    <input value={formData.preferredTime} onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address ID</label>
                  <input value={formData.addressId} onChange={(e) => setFormData({ ...formData, addressId: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service IDs (comma separated)</label>
                  <input value={formData.serviceIds} onChange={(e) => setFormData({ ...formData, serviceIds: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded bg-indigo-600 text-white">{isSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

