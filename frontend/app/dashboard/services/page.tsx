'use client';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import ConfirmModal from '@/components/common/ConfirmModal';
import FormModal from '@/components/common/FormModal';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import SortableHeader from '@/components/common/SortableHeader';
import IconActionButton from '@/components/common/IconActionButton';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { PAGE_SIZE_OPTIONS, parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { useEffect, useState, useCallback } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useToast } from '@/components/common/ToastProvider';
import { catalogService } from '@/lib/services/catalog';
import Pagination from '@/components/common/Pagination';
import Image from 'next/image';
import { uploadService } from '@/lib/services/upload';
import { Service, CategoryOption } from '@/lib/types';

const SORT_FIELDS = ['title', 'duration', 'price', 'isActive', 'createdAt'] as const;
const DEFAULT_SERVICE_IMAGE =
  'https://shrinikadermacare.com/wp-content/uploads/2025/08/beautician-with-brush-applies-white-moisturizing-mask-face-young-girl-client-spa-beauty-salon.jpg';

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setPage(Number(getParam('page', '1')));
    setLimit(parsePageSize(getParam('limit', '10')));
    const sortByParam = getParam('sortBy', 'createdAt');
    setSortBy(parseSortField(sortByParam, SORT_FIELDS, 'createdAt'));
    setSortOrder(parseSortOrder(getParam('sortOrder', 'DESC')));
    setIsQueryReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [servicesData, categoriesData] = await Promise.all([
        catalogService.getServices(undefined, searchTerm || undefined, page, limit, sortBy, sortOrder),
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
    fetchData();
  }, [fetchData, isQueryReady]);

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
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Services"
        description="Manage services"
        actionButton={<ActionButton variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openModal}>
          Add Service
        </ActionButton>} />

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          type="error" />
      )}

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
        }}
        searchPlaceholder="Search by service ID, title or description..." />

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <AdminTable minWidth={980} outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" scrollClassName="h-full overflow-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <AdminTh>Service ID</AdminTh>
                    <AdminTh>
                      <SortableHeader field="title" label="Service" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>Category</AdminTh>
                    <AdminTh>Description</AdminTh>
                    <AdminTh>
                      <SortableHeader field="duration" label="Duration" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>
                      <SortableHeader field="price" label="Price" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>
                      <SortableHeader field="isActive" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
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
                            {service.imageUrl ? (
                              <Image
                                src={service.imageUrl}
                                alt={service.title}
                                width={40}
                                height={40}
                                unoptimized
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <Image
                                src={DEFAULT_SERVICE_IMAGE}
                                alt={service.title}
                                width={40}
                                height={40}
                                unoptimized
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            )}
                            <span className="text-sm font-medium text-gray-900">{service.title}</span>
                          </div>
                        </AdminTd>
                        <AdminTd className="text-gray-600">{service.category?.name || '-'}</AdminTd>
                        <AdminTd className="text-gray-600">{service.description || '-'}</AdminTd>
                        <AdminTd>{service.duration} min</AdminTd>
                        <AdminTd>₹{service.price}</AdminTd>
                        <AdminTd className="font-medium">
                          {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </AdminTd>
                        <AdminTd>
                          <div className="flex items-center gap-2">
                            <IconActionButton title="Edit service" ariaLabel="Edit service" onClick={() => handleEdit(service)} icon={<Edit className="h-4 w-4" />} variant="edit" />
                            <IconActionButton title="Delete service" ariaLabel="Delete service" onClick={() => setDeleteTarget(service)} icon={<Trash2 className="h-4 w-4" />} variant="delete" />
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
        }}
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
        }}
        limitOptions={PAGE_SIZE_OPTIONS} />

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
          resetForm();
        }}
        onSubmit={handleSubmit}
        title={editingService ? 'Edit Service' : 'Add Service'}
        submitText={isUploading ? 'Uploading...' : editingService ? 'Update' : 'Create'}
        loading={isUploading}
      >
        <div className="space-y-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            {imagePreview ? (
              <div className="relative mb-2">
                <Image
                  src={imagePreview || "https://shrinikadermacare.com/wp-content/uploads/2025/08/beautician-doing-injection-filler-female-client.jpg"}
                  alt="Preview"
                  width={800}
                  height={320}
                  unoptimized
                  className="w-full h-48 object-cover rounded-lg border border-gray-300" />
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
              id="image-upload-service" />
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
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
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
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white" />
            </div>
          </div>
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
        title="Delete Service"
        message={`Are you sure you want to delete ${deleteTarget?.title || 'this service'}?`}
      />
    </div>
  );
}
