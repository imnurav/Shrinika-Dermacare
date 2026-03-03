'use client';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import SortableHeader from '@/components/common/SortableHeader';
import IconActionButton from '@/components/common/IconActionButton';
import { Edit, Trash2 } from 'lucide-react';
import { Category } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { DEFAULT_CATEGORY_IMAGE } from './constants';

type Props = {
  categories: Category[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export default function CategoriesTable({
  categories,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: Props) {
  if (isLoading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  return (
    <AdminTable
      minWidth={760}
      outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      scrollClassName="h-full overflow-auto"
    >
      <thead className="bg-gray-50">
        <tr>
          <AdminTh>Category ID</AdminTh>
          <AdminTh>
            <SortableHeader field="name" label="Category" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          </AdminTh>
          <AdminTh>Description</AdminTh>
          <AdminTh>
            <SortableHeader field="isActive" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          </AdminTh>
          <AdminTh>
            <SortableHeader field="createdAt" label="Created" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          </AdminTh>
          <AdminTh>Actions</AdminTh>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200 bg-white">
        {categories.length === 0 ? (
          <AdminEmptyRow colSpan={6} />
        ) : (
          categories.map((category) => (
            <tr key={category.id} className="hover:bg-gray-50">
              <AdminTd className="break-all font-mono text-xs">{category.id}</AdminTd>
              <AdminTd>
                <div className="flex items-center gap-3">
                  <Image
                    src={category.imageUrl || DEFAULT_CATEGORY_IMAGE}
                    alt={category.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
              </AdminTd>
              <AdminTd className="text-gray-600">{category.description || '-'}</AdminTd>
              <AdminTd className="font-medium">{category.isActive ? 'ACTIVE' : 'INACTIVE'}</AdminTd>
              <AdminTd className="text-gray-600">
                {category.createdAt ? format(new Date(category.createdAt), 'MMM dd, yyyy') : '-'}
              </AdminTd>
              <AdminTd>
                <div className="flex items-center gap-2">
                  <IconActionButton
                    title="Edit category"
                    ariaLabel="Edit category"
                    onClick={() => onEdit(category)}
                    icon={<Edit className="h-4 w-4" />}
                    variant="edit"
                  />
                  <IconActionButton
                    title="Delete category"
                    ariaLabel="Delete category"
                    onClick={() => onDelete(category)}
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="delete"
                  />
                </div>
              </AdminTd>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}

