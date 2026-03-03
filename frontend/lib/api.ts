import axios from 'axios';
import { AxiosRequestHeaders } from 'axios';

const API_URL = '/api/proxy/';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // If sending FormData, let the browser/axios set the Content-Type (with boundary)
  if (config.data instanceof FormData) {
    if (config.headers) {
      // Remove explicit content-type so browser sets the multipart boundary
      delete (config.headers as AxiosRequestHeaders)['Content-Type'];
    }
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
