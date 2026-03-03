import {
  Category,
  CategoryOption,
  PaginatedResponse,
  Service,
  ServiceOption,
} from "../types";
import api from "../api";

export const catalogService = {
  // Categories
  getCategories: async (
    search?: string,
    includeServices = false,
    page = 1,
    limit = 10,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<PaginatedResponse<Category>> => {
    const response = await api.get<PaginatedResponse<Category>>("/catalog/categories", {
      params: { search, includeServices, page, limit, sortBy, sortOrder },
    });
    return response.data;
  },

  getCategoryOptions: async (): Promise<CategoryOption[]> => {
    const response = await api.get<CategoryOption[]>("/catalog/categories/options");
    return response.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/catalog/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await api.post<Category>("/catalog/categories", data);
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: Partial<Category>,
  ): Promise<Category> => {
    const response = await api.put<Category>(`/catalog/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/catalog/categories/${id}`);
  },

  // Services
  getServices: async (
    categoryId?: string,
    search?: string,
    page = 1,
    limit = 10,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResponse<Service>> => {
    const response = await api.get<PaginatedResponse<Service>>("/catalog/services", {
      params: { categoryId, search, page, limit, sortBy, sortOrder },
    });
    return response.data;
  },

  getServiceOptions: async (categoryId?: string): Promise<ServiceOption[]> => {
    const response = await api.get<ServiceOption[]>("/catalog/services/options", {
      params: { categoryId },
    });
    return response.data;
  },

  getService: async (id: string): Promise<Service> => {
    const response = await api.get<Service>(`/catalog/services/${id}`);
    return response.data;
  },

  createService: async (data: Partial<Service>): Promise<Service> => {
    const response = await api.post<Service>("/catalog/services", data);
    return response.data;
  },

  updateService: async (
    id: string,
    data: Partial<Service>,
  ): Promise<Service> => {
    const response = await api.put<Service>(`/catalog/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/catalog/services/${id}`);
  },
};
