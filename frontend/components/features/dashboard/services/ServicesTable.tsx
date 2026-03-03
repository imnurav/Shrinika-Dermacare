'use client';

import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import IconActionButton from '@/components/common/IconActionButton';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import SortableHeader from '@/components/common/SortableHeader';
import { DEFAULT_SERVICE_IMAGE } from './constants';
import { Edit, Trash2 } from 'lucide-react';
import { Service } from '@/lib/types';
import Image from 'next/image';

type Props = {
  sortBy: string;
  isLoading: boolean;
  services: Service[];
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
};

export default function ServicesTable({ services, isLoading, sortBy, sortOrder, onSort, onEdit, onDelete }: Props) {
  if (isLoading) return <TableSkeleton rows={8} columns={7} />;

  return (
    <AdminTable minWidth={980} outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" scrollClassName="h-full overflow-auto">
      <thead className="bg-gray-50">
        <tr>
          <AdminTh>Service ID</AdminTh>
          <AdminTh><SortableHeader field="title" label="Service" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} /></AdminTh>
          <AdminTh>Category</AdminTh>
          <AdminTh>Description</AdminTh>
          <AdminTh><SortableHeader field="duration" label="Duration" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} /></AdminTh>
          <AdminTh><SortableHeader field="price" label="Price" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} /></AdminTh>
          <AdminTh><SortableHeader field="isActive" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} /></AdminTh>
          <AdminTh>Actions</AdminTh>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {services.length === 0 ? (
          <AdminEmptyRow colSpan={8} />
        ) : (
          services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50">
              <AdminTd className="break-all font-mono text-xs">{service.id}</AdminTd>
              <AdminTd>
                <div className="flex items-center gap-3">
                  <Image src={service.imageUrl || DEFAULT_SERVICE_IMAGE} alt={service.title} width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" />
                  <span className="text-sm font-medium text-gray-900">{service.title}</span>
                </div>
              </AdminTd>
              <AdminTd className="text-gray-600">{service.category?.name || '-'}</AdminTd>
              <AdminTd className="text-gray-600">{service.description || '-'}</AdminTd>
              <AdminTd>{service.duration} min</AdminTd>
              <AdminTd>₹{service.price}</AdminTd>
              <AdminTd className="font-medium">{service.isActive ? 'ACTIVE' : 'INACTIVE'}</AdminTd>
              <AdminTd>
                <div className="flex items-center gap-2">
                  <IconActionButton title="Edit service" ariaLabel="Edit service" onClick={() => onEdit(service)} icon={<Edit className="h-4 w-4" />} variant="edit" />
                  <IconActionButton title="Delete service" ariaLabel="Delete service" onClick={() => onDelete(service)} icon={<Trash2 className="h-4 w-4" />} variant="delete" />
                </div>
              </AdminTd>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}