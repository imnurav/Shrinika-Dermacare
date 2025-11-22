'use client';
import { Plus, Edit, Trash2, ShoppingBag, Upload, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { catalogService } from '@/lib/services/catalog';
import Pagination from '@/components/common/Pagination';
import { uploadService } from '@/lib/services/upload';
import { Service, Category } from '@/lib/types';
import { useEffect, useState } from 'react';


export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [servicesData, categoriesData] = await Promise.all([
        catalogService.getServices(undefined, page, limit),
        catalogService.getCategories(),
      ]);
      if (Array.isArray(servicesData)) {
        setServices(servicesData);
        setTotalPages(1);
        setTotalItems(servicesData.length);
      } else {
        setServices(servicesData.data);
        setTotalPages(servicesData.meta.totalPages);
        setTotalItems(servicesData.meta.total);
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

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
      } else {
        await catalogService.createService(serviceData);
      }
      setIsModalOpen(false);
      setEditingService(null);
      resetForm();
      fetchData();
    } catch (error: any) {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      setError(null);
      await catalogService.deleteService(id);
      fetchData();
    } catch (error: any) {
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>

        <Pagination page={page} setPage={setPage} totalPages={totalPages} totalItems={totalItems} limit={limit} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-1">Manage services</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            type="error"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-indigo-600 opacity-100" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {service.category?.name || 'No category'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit className="w-4 h-4 opacity-100" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 opacity-100" />
                  </button>
                </div>
              </div>
              {service.description && (
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Duration: {service.duration} min</span>
                  <span className="text-gray-600">₹{service.price}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${service.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} totalItems={totalItems} limit={limit} />

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
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
                        src={imagePreview}
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
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : editingService ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

