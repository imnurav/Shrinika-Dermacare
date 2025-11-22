import api from '../api';

export const uploadService = {
  uploadImage: async (file: File, folder: 'users' | 'categories' | 'services'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ url: string }>(`/upload/image/${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  },

  deleteImage: async (url: string): Promise<void> => {
    await api.delete('/upload/image', {
      params: { url },
    });
  },
};

