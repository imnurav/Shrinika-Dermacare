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
};

