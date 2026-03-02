'use client';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import TopLoader from '@/components/common/TopLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useState, useCallback } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useToast } from '@/components/common/ToastProvider';
import { catalogService } from '@/lib/services/catalog';
import Pagination from '@/components/common/Pagination';
import { uploadService } from '@/lib/services/upload';
import { Service, CategoryOption } from '@/lib/types';
import Modal from '@/components/common/Modal';
// import Image from 'next/image';


export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    imageUrl: '',
    duration: 60,
    price: 0,
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
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setPage(Number(getParam('page', '1')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [servicesData, categoriesData] = await Promise.all([
        catalogService.getServices(undefined, searchTerm || undefined, page, limit),
        catalogService.getCategoryOptions(),
      ]);
      setServices(servicesData.data);
      setTotalItems(servicesData.meta.total);
      setTotalPages(servicesData.meta.totalPages);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      let imageUrl = formData.imageUrl;

      // Upload image if a new file is selected
      if (selectedFile) {
        imageUrl = await uploadService.uploadImage(selectedFile, 'services');
      }

      const serviceData = {
        ...formData,
        imageUrl,
      };

      if (editingService) {
        await catalogService.updateService(editingService.id, serviceData);
        showToast('Service updated successfully', 'success');
      } else {
        await catalogService.createService(serviceData);
        showToast('Service created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingService(null);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      categoryId: service.categoryId,
      title: service.title,
      description: service.description || '',
      imageUrl: service.imageUrl || '',
      duration: service.duration,
      price: service.price,
      isActive: service.isActive,
    });
    setImagePreview(service.imageUrl || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await catalogService.deleteService(deleteTarget.id);
      showToast('Service deleted successfully', 'success');
      fetchData();
      setDeleteTarget(null);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };
  const resetForm = () => {
    setFormData({
      categoryId: '',
      title: '',
      description: '',
      imageUrl: '',
      duration: 60,
      price: 0,
      isActive: true,
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const openModal = () => {
    setEditingService(null);
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <TopLoader loading={isLoading || isUploading} />
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Services"
          description="Manage services"
          actionButton={
            <ActionButton variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openModal}>
              Add Service
            </ActionButton>
          }
        />

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            type="error"
          />
        )}

        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
            setParams({ search: value, page: '1' });
          }}
          searchPlaceholder="Search services by title or description..."
        />

        <div className="min-h-0 flex-1">
          {isLoading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : (
            <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="h-full overflow-auto">
                <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No data
                      </td>
                    </tr>
                  ) : (
                    services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {service.imageUrl ? (
                              <img
                                src={service.imageUrl}
                                alt={service.title}
                                className="h-10 w-10 rounded-lg object-cover"
                                referrerPolicy="origin-when-cross-origin"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{service.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{service.category?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{service.description || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{service.duration} min</td>
                        <td className="px-6 py-4 text-sm text-gray-700">₹{service.price}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Edit service"
                              aria-label="Edit service"
                              onClick={() => handleEdit(service)}
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete service"
                              aria-label="Delete service"
                              onClick={() => setDeleteTarget(service)}
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
          onClose={() => {
            setIsModalOpen(false);
            setEditingService(null);
            resetForm();
          }}
          title={editingService ? 'Edit Service' : 'Add Service'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  {imagePreview ? (
                    <div className="relative mb-2">
                      <img
                        src={imagePreview || "https://shrinikadermacare.com/wp-content/uploads/2025/08/beautician-doing-injection-filler-female-client.jpg"}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload-service"
                  />
                  <label
                    htmlFor="image-upload-service"
                    className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {imagePreview ? 'Change Image' : 'Choose Image'}
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (min) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>
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
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingService(null);
                  resetForm();
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : editingService ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete Service"
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
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.title}</span>?
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
