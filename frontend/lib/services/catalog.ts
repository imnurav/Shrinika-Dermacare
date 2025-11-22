import { Category, Service, PaginatedResponse } from '../types';
import api from '../api';

export const catalogService = {
  // Categories
  getCategories: async (includeServices = false): Promise<Category[]> => {
    const response = await api.get<Category[]>('/catalog/categories', {
      params: { includeServices },
    });
    return response.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/catalog/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await api.post<Category>('/catalog/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put<Category>(`/catalog/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/catalog/categories/${id}`);
  },

  // Services
  getServices: async (categoryId?: string, page = 1, limit = 10): Promise<PaginatedResponse<Service> | Service[]> => {
    const response = await api.get('/catalog/services', {
      params: { categoryId, page, limit },
    });
    return response.data;
  },

  getService: async (id: string): Promise<Service> => {
    const response = await api.get<Service>(`/catalog/services/${id}`);
    return response.data;
  },

  createService: async (data: Partial<Service>): Promise<Service> => {
    const response = await api.post<Service>('/catalog/services', data);
    return response.data;
  },

  updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
    const response = await api.put<Service>(`/catalog/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/catalog/services/${id}`);
  },
};

