import { User, PaginatedResponse } from '../types';
import api from '../api';

export const usersService = {
  getAllUsers: async (page = 1, limit = 10): Promise<PaginatedResponse<User> | User[]> => {
    const response = await api.get('/admin/users', {
      params: { page, limit },
    });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, payload: any): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${id}`, payload);
    return response.data;
  },
  createUser: async (payload: any) => {
    const response = await api.post<User>('/admin/users', payload);
    return response.data;
  },
};

