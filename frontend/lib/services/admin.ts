import { DashboardAnalytics } from '../types';
import api from '../api';

export const adminService = {
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const response = await api.get<DashboardAnalytics>('/admin/analytics');
    return response.data;
  },
};
