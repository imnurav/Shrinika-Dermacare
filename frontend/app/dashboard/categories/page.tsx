'use client';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ImageUploadField from '@/components/form/ImageUploadField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useState, useCallback } from 'react';
import Pagination from '@/components/common/Pagination';
import PageHeader from '@/components/common/PageHeader';
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
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await catalogService.getCategories(searchTerm || undefined);
      setCategories(data);
      setTotalItems(data.length);
      setTotalPages(Math.max(1, Math.ceil(data.length / limit)));
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, limit]);

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
      } else {
        await catalogService.createCategory(categoryData);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      setError(null);
      await catalogService.deleteCategory(id);
      fetchCategories();
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search categories by name..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const visibleCategories = categories.slice((page - 1) * limit, page * limit);
            if (visibleCategories.length === 0) {
              return <div className="col-span-full text-center py-12 text-gray-500">No categories found</div>;
            }

            return visibleCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => handleEdit(category)}
                    >
                      &nbsp;
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDelete(category.id)}
                    >
                      &nbsp;
                    </ActionButton>
                  </div>
                </div>
                {category.description && <p className="text-sm text-gray-600 mb-4">{category.description}</p>}
              </div>
            ));
          })()}
        </div>

        <Pagination page={page} setPage={setPage} totalPages={totalPages} totalItems={totalItems} limit={limit} />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          size="md"
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
      </div>
    </DashboardLayout>
  );
}

