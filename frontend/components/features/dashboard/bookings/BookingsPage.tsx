'use client';
import ErrorMessage from '@/components/common/ErrorMessage';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { useBookingsPage } from '@/lib/hooks/dashboard/useBookingsPage';
import type { BookingsInitialQuery } from '@/lib/hooks/dashboard/useBookingsPage';
import BookingEditModal from './BookingEditModal';
import BookingsFilters from './BookingsFilters';
import { useRouter } from 'next/navigation';
import BookingsTable from './BookingsTable';
import { Booking, PaginatedResponse } from '@/lib/types';

type Props = {
  initialData?: PaginatedResponse<Booking> | null;
  initialQuery?: BookingsInitialQuery;
};

export default function BookingsPage({ initialData, initialQuery }: Props) {
  const router = useRouter();
  const state = useBookingsPage({ initialData, initialQuery });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Bookings" description="Manage all bookings" />
      {state.error && <ErrorMessage message={state.error} onDismiss={() => state.setError(null)} type="error" />}

      <BookingsFilters
        endDate={state.endDate}
        startDate={state.startDate}
        searchTerm={state.searchInput}
        statusFilter={state.statusFilter}
        onSearchChange={state.updateSearch}
        onFilterChange={state.updateFilter}
      />

      <div className="min-h-0 flex-1">
        <BookingsTable
          sortBy={state.sortBy}
          onEdit={state.openEdit}
          bookings={state.bookings}
          onSort={state.handleSort}
          isLoading={state.isLoading}
          sortOrder={state.sortOrder}
          onStatusUpdate={state.handleStatusUpdate}
          onView={(id) => router.push(`/dashboard/bookings/${id}`)}
        />
      </div>

      <Pagination
        page={state.page}
        limit={state.limit}
        setPage={state.changePage}
        setLimit={state.changeLimit}
        totalPages={state.totalPages}
        totalItems={state.totalItems}
        limitOptions={state.pageSizeOptions}
      />

      <BookingEditModal
        minDate={state.minDate}
        minTime={state.minTime}
        loading={state.isSaving}
        formData={state.formData}
        isOpen={state.isModalOpen}
        onClose={state.closeModal}
        onSubmit={state.handleSave}
        setFormData={state.setFormData}
        serviceOptions={state.serviceOptions}
        addressOptions={state.addressOptions}
        onAddService={state.handleAddService}
        isMetaLoading={state.isEditMetaLoading}
        onRemoveService={state.handleRemoveService}
        serviceSelectValue={state.serviceSelectValue}
        setServiceSelectValue={state.setServiceSelectValue}
      />
    </div>
  );
}
