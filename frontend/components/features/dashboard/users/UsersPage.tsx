'use client';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorMessage from '@/components/common/ErrorMessage';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { useUsersPage } from '@/lib/hooks/dashboard/useUsersPage';
import type { UsersInitialQuery } from '@/lib/hooks/dashboard/useUsersPage';
import UsersFilters from './UsersFilters';
import UsersTable from './UsersTable';
import UserFormModal from './UserFormModal';
import { PaginatedResponse, User } from '@/lib/types';
import { UserPlus } from 'lucide-react';

type Props = {
  initialData?: PaginatedResponse<User> | null;
  initialQuery?: UsersInitialQuery;
};

export default function UsersPage({ initialData, initialQuery }: Props) {
  const state = useUsersPage({ initialData, initialQuery });
  const canCreate = Boolean(state.currentUser?.role === 'ADMIN' || state.currentUser?.role === 'SUPERADMIN');

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Users"
        description="Manage all users"
        actionButton={
          canCreate ? (
            <button
              type="button"
              onClick={state.openCreate}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              <UserPlus className="h-4 w-4" />
              Create User
            </button>
          ) : null
        }
      />

      {state.error && <ErrorMessage message={state.error} onDismiss={() => state.setError(null)} type="error" />}

      <UsersFilters
        searchTerm={state.searchInput}
        startDate={state.startDate}
        endDate={state.endDate}
        onSearchChange={state.updateSearch}
        onFilterChange={state.updateFilter}
      />

      <div className="min-h-0 flex-1">
        <UsersTable
          users={state.users}
          isLoading={state.isLoading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          currentUserId={state.currentUser?.id}
          currentUserRole={state.currentUser?.role}
          onSort={state.handleSort}
          onEdit={state.openEdit}
          onDelete={state.setDeleteTarget}
        />
      </div>

      <Pagination
        page={state.page}
        setPage={state.changePage}
        totalPages={state.totalPages}
        totalItems={state.totalItems}
        limit={state.limit}
        setLimit={state.changeLimit}
        limitOptions={state.pageSizeOptions}
      />

      <UserFormModal
        isOpen={state.isModalOpen}
        loading={state.isSaving}
        currentUserId={state.currentUser?.id}
        currentUserRole={state.currentUser?.role}
        editingUser={state.editingUser}
        formData={state.formData}
        imagePreview={state.imagePreview}
        onClose={state.closeModal}
        onSubmit={state.handleSave}
        setFormData={state.setFormData}
        onFileChange={state.handleFileChange}
        onRemoveImage={() => state.handleFileChange(null)}
      />

      <ConfirmModal
        isOpen={Boolean(state.deleteTarget)}
        onClose={() => state.setDeleteTarget(null)}
        onConfirm={state.handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${state.deleteTarget?.name || 'this user'}?`}
      />
    </div>
  );
}
