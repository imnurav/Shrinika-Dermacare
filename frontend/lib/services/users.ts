import { AdminUserDetail, User, PaginatedResponse } from "../types";
import api from "../api";

export const usersService = {
  getAllUsers: async (
    search?: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 10,
    sortBy?: string,
    sortOrder: "ASC" | "DESC" = "DESC",
  ): Promise<PaginatedResponse<User>> => {
    const response = await api.get("/admin/users", {
      params: { search, startDate, endDate, page, limit, sortBy, sortOrder },
    });
    return response.data;
  },

  getUser: async (id: string): Promise<AdminUserDetail> => {
    const response = await api.get<AdminUserDetail>(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, payload: unknown): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${id}`, payload);
    return response.data;
  },
  createUser: async (payload: unknown) => {
    const response = await api.post<User>("/admin/users", payload);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>("/user/profile");
    return response.data;
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const response = await api.put<User>("/user/profile", payload);
    return response.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    await api.put("/user/change-password", { currentPassword, newPassword });
  },
};
