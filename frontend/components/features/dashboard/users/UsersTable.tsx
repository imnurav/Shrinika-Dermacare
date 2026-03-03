'use client';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import IconActionButton from '@/components/common/IconActionButton';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import SortableHeader from '@/components/common/SortableHeader';
import { getUserAvatar } from '@/lib/utils/avatar';
import { User, UserRole } from '@/lib/types';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

type Props = {
  users: User[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  currentUserId?: string;
  currentUserRole?: UserRole;
  onSort: (field: string) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
};

export default function UsersTable({
  users,
  isLoading,
  sortBy,
  sortOrder,
  currentUserId,
  currentUserRole,
  onSort,
  onEdit,
  onDelete,
}: Props) {
  if (isLoading) {
    return <TableSkeleton rows={8} columns={8} />;
  }

  return (
    <AdminTable
      minWidth={980}
      outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      scrollClassName="h-full overflow-auto"
    >
      <thead className="bg-gray-50">
        <tr>
          <AdminTh className="min-w-[240px]">User ID</AdminTh>
          <AdminTh>
            <SortableHeader field="name" label="User" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          </AdminTh>
          <AdminTh>Email</AdminTh>
          <AdminTh>Phone</AdminTh>
          <AdminTh>Gender</AdminTh>
          <AdminTh>
            <SortableHeader field="role" label="Role" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          </AdminTh>
          <AdminTh>
            <SortableHeader field="createdAt" label="Joined" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          </AdminTh>
          <AdminTh>Actions</AdminTh>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200 bg-white">
        {users.length === 0 ? (
          <AdminEmptyRow colSpan={8} />
        ) : (
          users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <AdminTd className="min-w-[240px] break-all font-mono text-xs leading-5">{user.id}</AdminTd>
              <AdminTd>
                <div className="flex items-center gap-3">
                  <Image
                    src={getUserAvatar(user.imageUrl, user.gender)}
                    alt={user.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                </div>
              </AdminTd>
              <AdminTd className="text-gray-600">{user.email || '-'}</AdminTd>
              <AdminTd className="text-gray-600">{user.phone || '-'}</AdminTd>
              <AdminTd>{user.gender}</AdminTd>
              <AdminTd className="font-medium">{user.role}</AdminTd>
              <AdminTd className="text-gray-600">
                {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
              </AdminTd>
              <AdminTd>
                {((currentUserRole === UserRole.SUPERADMIN) ||
                  (currentUserRole === UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)) && (
                    <div className="flex items-center gap-2">
                      <IconActionButton
                        title="Edit user"
                        ariaLabel="Edit user"
                        onClick={() => onEdit(user)}
                        icon={<Edit className="h-4 w-4" />}
                        variant="edit"
                      />
                      {currentUserId !== user.id && (
                        <IconActionButton
                          title="Delete user"
                          ariaLabel="Delete user"
                          onClick={() => onDelete(user)}
                          icon={<Trash2 className="h-4 w-4" />}
                          variant="delete"
                        />
                      )}
                    </div>
                  )}
              </AdminTd>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}