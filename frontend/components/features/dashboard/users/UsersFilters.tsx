'use client';
import SearchFilterBar from '@/components/common/SearchFilterBar';

type Props = {
  searchTerm: string;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (id: string, value: string) => void;
};

export default function UsersFilters({
  searchTerm,
  startDate,
  endDate,
  onSearchChange,
  onFilterChange,
}: Props) {
  return (
    <SearchFilterBar
      searchPlaceholder="Search by name, email, phone, or ID..."
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      filters={[
        { id: 'startDate', label: 'From Date', type: 'date' },
        { id: 'endDate', label: 'To Date', type: 'date' },
      ]}
      filterValues={{ startDate, endDate }}
      onFilterChange={onFilterChange}
    />
  );
}

