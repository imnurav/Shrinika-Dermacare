'use client';
import type { CategoriesInitialQuery } from '@/lib/hooks/dashboard/useCategoriesPage';
import { useCategoriesPage } from '@/lib/hooks/dashboard/useCategoriesPage';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ActionButton from '@/components/common/ActionButton';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorMessage from '@/components/common/ErrorMessage';
import { Category, PaginatedResponse } from '@/lib/types';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import CategoryFormModal from './CategoryFormModal';
import CategoriesTable from './CategoriesTable';
import { Plus } from 'lucide-react';

type Props = {
  initialData?: PaginatedResponse<Category> | null;
  initialQuery?: CategoriesInitialQuery;
};

export default function CategoriesPage({ initialData, initialQuery }: Props) {
  const state = useCategoriesPage({ initialData, initialQuery });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Categories"
        description="Manage service categories"
        actionButton={
          <ActionButton variant="primary" icon={<Plus className="h-5 w-5" />} onClick={state.openCreate}>
            Add Category
          </ActionButton>
        }
      />

      {state.error && <ErrorMessage message={state.error} onDismiss={() => state.setError(null)} type="error" />}

      <SearchFilterBar
        searchValue={state.searchInput}
        onSearchChange={state.updateSearch}
        searchPlaceholder="Search by category ID or name..."
      />

      <div className="min-h-0 flex-1">
        <CategoriesTable
          categories={state.categories}
          isLoading={state.isLoading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
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

      <CategoryFormModal
        isOpen={state.isModalOpen}
        loading={state.isUploading}
        editing={state.editing}
        formData={state.formData}
        imagePreview={state.imagePreview}
        onClose={state.closeModal}
        onSubmit={state.handleSubmit}
        onChange={state.setFormData}
        onFileChange={state.handleFileChange}
        onRemoveImage={() => state.handleFileChange(null)}
      />

      <ConfirmModal
        isOpen={Boolean(state.deleteTarget)}
        onClose={() => state.setDeleteTarget(null)}
        onConfirm={state.handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete ${state.deleteTarget?.name || 'this category'}?`}
      />
    </div>
  );
}
