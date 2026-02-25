'use client';
import { useState, useCallback, useEffect } from 'react';
import { PaginatedResponse } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

export interface UseCRUDOptions<T> {
  initialPage?: number;
  initialLimit?: number;
  onFetch?: () => Promise<PaginatedResponse<T> | T[]>;
  onError?: (error: string) => void;
}

export const useCRUDList = <T extends { id?: string }>(options: UseCRUDOptions<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.initialPage || 1);
  const [limit] = useState(options.initialLimit || 10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchItems = useCallback(async () => {
    if (!options.onFetch) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await options.onFetch();

      if (Array.isArray(data)) {
        setItems(data);
        setTotalPages(1);
        setTotalItems(data.length);
      } else {
        setItems(data.data);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, page]);

  const addItem = (item: T) => {
    setItems((prev) => [item, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    items,
    isLoading,
    error,
    setError,
    page,
    setPage,
    limit,
    totalPages,
    totalItems,
    fetchItems,
    addItem,
    updateItem,
    removeItem,
  };
};

export default useCRUDList;
