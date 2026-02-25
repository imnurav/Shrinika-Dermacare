'use client';
import React from 'react';
import { Search, Filter, LucideIcon } from 'lucide-react';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>

        {/* Filters */}
        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center gap-2">
            {filter === filters[0] && (
              <Filter className="text-gray-400 w-5 h-5" />
            )}
            {filter.type === 'select' ? (
              <select
                value={filterValues[filter.id] || ''}
                onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white whitespace-nowrap"
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
                type="text"
                placeholder={filter.placeholder || filter.label}
                value={filterValues[filter.id] || ''}
                onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchFilterBar;
