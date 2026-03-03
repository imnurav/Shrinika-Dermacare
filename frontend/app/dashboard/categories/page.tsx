'use client';
import { PAGE_SIZE_OPTIONS, parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import IconActionButton from '@/components/common/IconActionButton';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ImageUploadField from '@/components/form/ImageUploadField';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import SortableHeader from '@/components/common/SortableHeader';
import { useToast } from '@/components/common/ToastProvider';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import ConfirmModal from '@/components/common/ConfirmModal';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useState, useCallback } from 'react';
import Pagination from '@/components/common/Pagination';
import PageHeader from '@/components/common/PageHeader';
import { catalogService } from '@/lib/services/catalog';
import FormModal from '@/components/common/FormModal';
import { uploadService } from '@/lib/services/upload';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Category } from '@/lib/types';
import Image from 'next/image';

const SORT_FIELDS = ['name', 'isActive', 'createdAt'] as const;
const DEFAULT_CATEGORY_IMAGE =
  'https://shrinikadermacare.com/wp-content/uploads/2025/08/beautician-with-brush-applies-white-moisturizing-mask-face-young-girl-client-spa-beauty-salon.jpg';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setPage(Number(getParam('page', '1')));
    setLimit(parsePageSize(getParam('limit', '10')));
    const sortByParam = getParam('sortBy', 'name');
    setSortBy(parseSortField(sortByParam, SORT_FIELDS, 'name'));
    setSortOrder(parseSortOrder(getParam('sortOrder', 'ASC')));
    setIsQueryReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await catalogService.getCategories(
        searchTerm || undefined,
        false,
        page,
        limit,
        sortBy,
        sortOrder,
      );
      setCategories(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, limit, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    const nextOrder = sortBy === field ? (sortOrder === 'ASC' ? 'DESC' : 'ASC') : 'ASC';
    setSortBy(field);
    setSortOrder(nextOrder);
    setPage(1);
    setParams({
      search: searchTerm,
      page: '1',
      limit: String(limit),
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  useEffect(() => {
    if (!isQueryReady) return;
    fetchCategories();
  }, [fetchCategories, isQueryReady]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      let imageUrl = formData.imageUrl;

      if (selectedFile) {
        imageUrl = await uploadService.uploadImage(selectedFile, 'categories');
      }

      const categoryData = {
        ...formData,
        imageUrl,
      };

      if (editingCategory) {
        await catalogService.updateCategory(editingCategory.id, categoryData);
        showToast('Category updated successfully', 'success');
      } else {
        await catalogService.createCategory(categoryData);
        showToast('Category created successfully', 'success');
      }
      closeModal();
      fetchCategories();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive,
    });
    setImagePreview(category.imageUrl || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await catalogService.deleteCategory(deleteTarget.id);
      showToast('Category deleted successfully', 'success');
      fetchCategories();
      setDeleteTarget(null);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      isActive: true,
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    resetForm();
  };

  const openModal = () => {
    setEditingCategory(null);
    resetForm();
    setIsModalOpen(true);
  };

  return (
      <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Categories"
        description="Manage service categories"
        actionButton={<ActionButton variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openModal}>
          Add Category
        </ActionButton>} />

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
          setParams({
            search: value,
            page: '1',
            limit: String(limit),
            sortBy,
            sortOrder,
          });
        } }
        searchPlaceholder="Search by category ID or name..." />

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : (
          <AdminTable minWidth={760} outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" scrollClassName="h-full overflow-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <AdminTh>Category ID</AdminTh>
                    <AdminTh>
                      <SortableHeader field="name" label="Category" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>Description</AdminTh>
                    <AdminTh>
                      <SortableHeader field="isActive" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>
                      <SortableHeader field="createdAt" label="Created" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
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
                            {category.imageUrl ? (
                              <Image src={category.imageUrl} alt={category.name} width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <Image src={DEFAULT_CATEGORY_IMAGE} alt={category.name} width={40} height={40} unoptimized className="h-10 w-10 rounded-lg object-cover" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          </div>
                        </AdminTd>
                        <AdminTd className="text-gray-600">{category.description || '-'}</AdminTd>
                        <AdminTd className="font-medium">
                          {category.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </AdminTd>
                        <AdminTd className="text-gray-600">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </AdminTd>
                        <AdminTd>
                          <div className="flex items-center gap-2">
                            <IconActionButton title="Edit category" ariaLabel="Edit category" onClick={() => handleEdit(category)} icon={<Edit className="h-4 w-4" />} variant="edit" />
                            <IconActionButton title="Delete category" ariaLabel="Delete category" onClick={() => setDeleteTarget(category)} icon={<Trash2 className="h-4 w-4" />} variant="delete" />
                          </div>
                        </AdminTd>
                      </tr>
                    ))
                  )}
                </tbody>
              </AdminTable>
        )}
      </div>

      <Pagination
        page={page}
        setPage={(value) => {
          setPage(value);
          setParams({
            search: searchTerm,
            page: String(value),
            limit: String(limit),
            sortBy,
            sortOrder,
          });
        } }
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        setLimit={(value) => {
          setLimit(value);
          setPage(1);
          setParams({
            search: searchTerm,
            page: '1',
            limit: String(value),
            sortBy,
            sortOrder,
          });
        } }
        limitOptions={PAGE_SIZE_OPTIONS} />

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        submitText={editingCategory ? 'Update' : 'Create'}
        loading={isUploading}
      >
        <div className="space-y-4">
          <FormInput
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Category name" />
          <FormTextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Category description"
            rows={3} />
          <ImageUploadField
            label="Image"
            preview={imagePreview}
            onFileChange={handleFileChange}
            onRemove={() => {
              setImagePreview(null);
              setSelectedFile(null);
            } } />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete ${deleteTarget?.name || 'this category'}?`}
      />
    </div>
  );
}
