import api from '../api';
import { PaginatedResponse } from '../types';

export interface CRUDService<T> {
  list: (params?: any) => Promise<PaginatedResponse<T> | T[]>;
  get: (id: string) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export const createCRUDService = <T>(baseUrl: string): CRUDService<T> => {
  return {
    list: async (params?: any) => {
      const response = await api.get(baseUrl, { params });
      return response.data;
    },

    get: async (id: string) => {
      const response = await api.get<T>(`${baseUrl}/${id}`);
      return response.data;
    },

    create: async (data: Partial<T>) => {
      const response = await api.post<T>(baseUrl, data);
      return response.data;
    },

    update: async (id: string, data: Partial<T>) => {
      const response = await api.put<T>(`${baseUrl}/${id}`, data);
      return response.data;
    },

    delete: async (id: string) => {
      await api.delete(`${baseUrl}/${id}`);
    },
  };
};

export default createCRUDService;
