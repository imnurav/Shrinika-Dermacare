'use client';
import { Search, Filter } from 'lucide-react';
import React from 'react';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface SearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (filterId: string, value: string) => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="hidden h-4 w-4 text-gray-400 md:block" />
            {filters.map((filter) => (
              <div key={filter.id} className="min-w-0">
                {filter.type === 'select' ? (
                  <select
                    value={filterValues[filter.id] || ''}
                    onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                    className="h-10 min-w-[130px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{filter.label}</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={filter.type === 'date' ? 'date' : 'text'}
                    placeholder={filter.placeholder || filter.label}
                    value={filterValues[filter.id] || ''}
                    onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                    className="h-10 min-w-[130px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;
