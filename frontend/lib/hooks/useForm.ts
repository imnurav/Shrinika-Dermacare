'use client';
import { useState } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

export interface UseFormOptions<T> {
  onSubmit?: (data: T) => Promise<void>;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  initialData?: T;
}

export const useForm = <T extends Record<string, any>>(options: UseFormOptions<T>) => {
  const [formData, setFormData] = useState<T>(options.initialData || ({} as T));
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!options.onSubmit) return;

    try {
      setIsSaving(true);
      setError(null);
      setErrors({});
      await options.onSubmit(formData);
      options.onSuccess?.();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = (data?: T) => {
    setFormData(data || (options.initialData || ({} as T)));
    setErrors({});
    setError(null);
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSaving,
    error,
    setError,
    handleChange,
    handleSubmit,
    resetForm,
  };
};

export default useForm;
