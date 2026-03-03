import { User } from '../types';
import api from '../api';

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  imageUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

type UnknownAuthPayload = Partial<AuthResponse> & {
  access_token?: string;
};

function normalizeAuthResponse(payload: UnknownAuthPayload): AuthResponse {
  const accessToken = payload.accessToken || payload.access_token || '';
  if (!accessToken) {
    throw new Error('Login failed: token missing in response');
  }
  return {
    accessToken,
    user: (payload.user || null) as User,
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<UnknownAuthPayload>('/auth/login', credentials);
    const normalized = normalizeAuthResponse(response.data);
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', normalized.accessToken);
      if (normalized.user) {
        localStorage.setItem('user', JSON.stringify(normalized.user));
      }
    }
    return normalized;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<UnknownAuthPayload>('/auth/register', data);
    const normalized = normalizeAuthResponse(response.data);
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', normalized.accessToken);
      if (normalized.user) {
        localStorage.setItem('user', JSON.stringify(normalized.user));
      }
    }
    return normalized;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors and clear local state anyway.
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

};
