'use client';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { memo } from 'react';

type Props = {
  field: string;
  label: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  className?: string;
};

function SortableHeaderComponent({ field, label, sortBy, sortOrder, onSort, className = '' }: Props) {
  const isActive = sortBy === field;

  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center gap-1 ${className}`}
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        sortOrder === 'ASC' ? (
          <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
      )}
    </button>
  );
}

const SortableHeader = memo(SortableHeaderComponent);
export default SortableHeader;
