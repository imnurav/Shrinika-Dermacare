'use client';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ImageUploadField from '@/components/form/ImageUploadField';
import TopLoader from '@/components/common/TopLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useState, useCallback } from 'react';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import Pagination from '@/components/common/Pagination';
import PageHeader from '@/components/common/PageHeader';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useToast } from '@/components/common/ToastProvider';
import { catalogService } from '@/lib/services/catalog';
import { uploadService } from '@/lib/services/upload';
import Modal from '@/components/common/Modal';
import { Category } from '@/lib/types';

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
  const [page, setPage] = useState(Number(getParam('page', '1')));
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setPage(Number(getParam('page', '1')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await catalogService.getCategories(searchTerm || undefined, false, page, limit);
      setCategories(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, limit]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    } catch (error: any) {
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
    } catch (error: any) {
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
    <DashboardLayout>
      <TopLoader loading={isLoading || isUploading} />
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Categories"
          description="Manage service categories"
          actionButton={
            <ActionButton variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openModal}>
              Add Category
            </ActionButton>
          }
        />

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
            setParams({ search: value, page: '1' });
          }}
          searchPlaceholder="Search categories by name..."
        />

        <div className="min-h-0 flex-1">
          {isLoading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : (
            <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="h-full overflow-auto">
                <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No data
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {category.imageUrl ? (
                              <img src={category.imageUrl} alt={category.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{category.description || '-'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {category.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Edit category"
                              aria-label="Edit category"
                              onClick={() => handleEdit(category)}
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete category"
                              aria-label="Delete category"
                              onClick={() => setDeleteTarget(category)}
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <Pagination
          page={page}
          setPage={(value) => {
            setPage(value);
            setParams({ search: searchTerm, page: String(value) });
          }}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
        />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          size="xl"
          footer={
            <>
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <ActionButton variant="primary" onClick={handleSubmit} loading={isUploading}>
                {editingCategory ? 'Update' : 'Create'}
              </ActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
            />
            <FormTextArea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description"
              rows={3}
            />
            <ImageUploadField
              label="Image"
              value={formData.imageUrl}
              preview={imagePreview}
              onFileChange={handleFileChange}
              onRemove={() => {
                setImagePreview(null);
                setSelectedFile(null);
              }}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete Category"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
