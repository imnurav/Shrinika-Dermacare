'use client';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import { BOOKING_STATUS_FILTER_OPTIONS } from './constants';
import { BookingStatus } from '@/lib/types';

type Props = {
  endDate: string;
  startDate: string;
  searchTerm: string;
  statusFilter: BookingStatus | 'ALL';
  onSearchChange: (value: string) => void;
  onFilterChange: (id: string, value: string) => void;
};

export default function BookingsFilters({
  endDate,
  startDate,
  searchTerm,
  statusFilter,
  onSearchChange,
  onFilterChange,
}: Props) {
  return (
    <SearchFilterBar
      searchPlaceholder="Search by booking ID, name or phone..."
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      filters={[
        { id: 'status', label: 'Status', type: 'select', options: BOOKING_STATUS_FILTER_OPTIONS },
        { id: 'startDate', label: 'From Date', type: 'date' },
        { id: 'endDate', label: 'To Date', type: 'date' },
      ]}
      filterValues={{ status: statusFilter, startDate, endDate }}
      onFilterChange={onFilterChange}
    />
  );
}

