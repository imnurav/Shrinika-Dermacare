import api from '../api';

export const uploadService = {
  uploadImage: async (file: File, folder: 'users' | 'categories' | 'services'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/upload/image/${folder}`, formData);
    return response.data.url as string;
  },

  deleteImage: async (url: string): Promise<void> => {
    await api.delete('/upload/image', {
      params: { url },
    });
  },
};
