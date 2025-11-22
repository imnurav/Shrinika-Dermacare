import api from '../api';

export const uploadService = {
  uploadImage: async (file: File, folder: 'users' | 'categories' | 'services'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch for multipart upload to avoid axios instance default headers
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const res = await fetch(`${apiBase}/upload/image/${folder}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Upload failed');
    }

    const data = await res.json();
    return data.url as string;
  },

  deleteImage: async (url: string): Promise<void> => {
    await api.delete('/upload/image', {
      params: { url },
    });
  },
};

