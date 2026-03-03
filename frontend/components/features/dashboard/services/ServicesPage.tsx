'use client';
import type { ServicesInitialQuery } from '@/lib/hooks/dashboard/useServicesPage';
import { useServicesPage } from '@/lib/hooks/dashboard/useServicesPage';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ActionButton from '@/components/common/ActionButton';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorMessage from '@/components/common/ErrorMessage';
import { PaginatedResponse, Service } from '@/lib/types';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import ServiceFormModal from './ServiceFormModal';
import ServicesTable from './ServicesTable';
import { Plus } from 'lucide-react';

type Props = {
  initialData?: PaginatedResponse<Service> | null;
  initialQuery?: ServicesInitialQuery;
};

export default function ServicesPage({ initialData, initialQuery }: Props) {
  const state = useServicesPage({ initialData, initialQuery });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Services"
        description="Manage services"
        actionButton={
          <ActionButton variant="primary" icon={<Plus className="h-5 w-5" />} onClick={state.openCreate}>
            Add Service
          </ActionButton>
        }
      />

      {state.error && <ErrorMessage message={state.error} onDismiss={() => state.setError(null)} type="error" />}

      <SearchFilterBar
        searchValue={state.searchInput}
        onSearchChange={state.updateSearch}
        searchPlaceholder="Search by service ID, title or description..."
      />

      <div className="min-h-0 flex-1">
        <ServicesTable
          services={state.services}
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

      <ServiceFormModal
        isOpen={state.isModalOpen}
        loading={state.isUploading}
        editing={Boolean(state.editingService)}
        categories={state.categories}
        formData={state.formData}
        imagePreview={state.imagePreview}
        onClose={state.closeModal}
        onSubmit={state.handleSubmit}
        onChange={state.setFormData}
        onFileChange={state.handleFileChange}
        onRemoveImage={() => {
          state.setImagePreview(null);
          state.setSelectedFile(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(state.deleteTarget)}
        onClose={() => state.setDeleteTarget(null)}
        onConfirm={state.handleDelete}
        title="Delete Service"
        message={`Are you sure you want to delete ${state.deleteTarget?.title || 'this service'}?`}
      />
    </div>
  );
}
