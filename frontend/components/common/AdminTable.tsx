'use client';
import { ReactNode } from 'react';

type AdminTableProps = {
  children: ReactNode;
  minWidth?: number | string;
  outerClassName?: string;
  scrollClassName?: string;
  tableClassName?: string;
};

type CellProps = {
  children: ReactNode;
  className?: string;
  colSpan?: number;
};

type IndexCellProps = {
  index: number;
  page?: number;
  limit?: number;
  id?: string;
  className?: string;
};

export default function AdminTable({
  children,
  minWidth,
  outerClassName = 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
  scrollClassName = 'overflow-auto',
  tableClassName = 'w-full',
}: AdminTableProps) {
  return (
    <div className={outerClassName}>
      <div className={scrollClassName}>
        <table className={tableClassName} style={minWidth ? { minWidth } : undefined}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function AdminTh({ children, className = '' }: CellProps) {
  return (
    <th className={`sticky top-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:px-6 ${className}`}>
      {children}
    </th>
  );
}

export function AdminTd({ children, className = '', colSpan }: CellProps) {
  return (
    <td className={`px-3 py-3 text-sm text-gray-700 align-top break-words whitespace-normal md:px-6 md:py-4 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function AdminIndexTh({ label = '#' }: { label?: string }) {
  return <AdminTh className="w-20">{label}</AdminTh>;
}

export function AdminIndexTd({ index, page = 1, limit = 10, id, className = '' }: IndexCellProps) {
  const serial = (Math.max(page, 1) - 1) * Math.max(limit, 1) + index + 1;
  return (
    <AdminTd className={`whitespace-nowrap ${className}`}>
      <div className="font-semibold text-gray-900">{serial}</div>
      {id ? <div className="font-mono text-xs text-gray-500">{id}</div> : null}
    </AdminTd>
  );
}

export function AdminEmptyRow({ colSpan, message = 'No data' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center text-sm text-gray-500 md:px-6">
        {message}
      </td>
    </tr>
  );
}
