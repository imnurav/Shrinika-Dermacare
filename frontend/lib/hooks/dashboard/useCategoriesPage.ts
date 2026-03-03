'use client';
import { PAGE_SIZE_OPTIONS, parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { CATEGORY_SORT_FIELDS } from '@/components/features/dashboard/categories/constants';
import { CategoryFormData } from '@/components/features/dashboard/categories/types';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useToast } from '@/components/common/ToastProvider';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Category, PaginatedResponse } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';
import { catalogService } from '@/lib/services/catalog';
import { uploadService } from '@/lib/services/upload';

const EMPTY_FORM: CategoryFormData = {
  name: '',
  description: '',
  imageUrl: '',
  isActive: true,
};

export type CategoriesInitialQuery = {
  search: string;
  page: number;
  limit: number;
  sortBy: (typeof CATEGORY_SORT_FIELDS)[number];
  sortOrder: 'ASC' | 'DESC';
};

type CategoriesHookOptions = {
  initialData?: PaginatedResponse<Category> | null;
  initialQuery?: CategoriesInitialQuery;
};

export function useCategoriesPage(options?: CategoriesHookOptions) {
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();
  const initialQuery = options?.initialQuery;
  const initialData = options?.initialData;

  const [categories, setCategories] = useState<Category[]>(initialData?.data || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUploading, setIsUploading] = useState(false);
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(initialQuery?.search ?? '');
  const [searchTerm, setSearchTerm] = useState(initialQuery?.search ?? '');
  const [sortBy, setSortBy] = useState<string>(initialQuery?.sortBy ?? 'name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialQuery?.sortOrder ?? 'ASC');
  const [page, setPage] = useState(initialQuery?.page ?? 1);
  const [limit, setLimit] = useState(initialQuery?.limit ?? 10);
  const [totalPages, setTotalPages] = useState(initialData?.meta.totalPages ?? 1);
  const [totalItems, setTotalItems] = useState(initialData?.meta.total ?? 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);

  const updateQuery = useCallback(
    (overrides: Record<string, string>) => {
      setParams({
        search: searchTerm,
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
        ...overrides,
      });
    },
    [limit, page, searchTerm, setParams, sortBy, sortOrder],
  );

  useEffect(() => {
    const search = getParam('search', '');
    setSearchInput(search);
    setSearchTerm(search);
    setPage(Number(getParam('page', '1')));
    setLimit(parsePageSize(getParam('limit', '10')));
    const sortByParam = getParam('sortBy', 'name');
    setSortBy(parseSortField(sortByParam, CATEGORY_SORT_FIELDS, 'name'));
    setSortOrder(parseSortOrder(getParam('sortOrder', 'ASC')));
    setIsQueryReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await catalogService.getCategories(
        searchTerm || undefined,
        false,
        page,
        limit,
        sortBy,
        sortOrder,
      );
      setCategories(Array.isArray(data?.data) ? data.data : []);
      setTotalItems(data?.meta?.total ?? 0);
      setTotalPages(data?.meta?.totalPages ?? 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (!isQueryReady) return;
    fetchCategories();
  }, [fetchCategories, isQueryReady]);

  const handleSort = useCallback(
    (field: string) => {
      const nextOrder = sortBy === field ? (sortOrder === 'ASC' ? 'DESC' : 'ASC') : 'ASC';
      setSortBy(field);
      setSortOrder(nextOrder);
      setPage(1);
      updateQuery({ sortBy: field, sortOrder: nextOrder, page: '1' });
    },
    [sortBy, sortOrder, updateQuery],
  );

  const applySearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setPage(1);
      updateQuery({ search: value, page: '1' });
    },
    [updateQuery],
  );

  const debouncedApplySearch = useDebouncedCallback(applySearch, 350);

  const updateSearch = useCallback((value: string) => {
    setSearchInput(value);
    debouncedApplySearch(value);
  }, [debouncedApplySearch]);

  const changePage = useCallback(
    (value: number) => {
      setPage(value);
      updateQuery({ page: String(value) });
    },
    [updateQuery],
  );

  const changeLimit = useCallback(
    (value: number) => {
      setLimit(value);
      setPage(1);
      updateQuery({ limit: String(value), page: '1' });
    },
    [updateQuery],
  );

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setImagePreview(null);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setImagePreview(null);
  }, []);

  const openCreate = useCallback(() => {
    setEditingCategory(null);
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive,
    });
    setImagePreview(category.imageUrl || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsUploading(true);
      let imageUrl = formData.imageUrl;
      if (selectedFile) {
        imageUrl = await uploadService.uploadImage(selectedFile, 'categories');
      }

      const payload = { ...formData, imageUrl };
      if (editingCategory) {
        await catalogService.updateCategory(editingCategory.id, payload);
        showToast('Category updated successfully', 'success');
      } else {
        await catalogService.createCategory(payload);
        showToast('Category created successfully', 'success');
      }

      closeModal();
      fetchCategories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }, [closeModal, editingCategory, fetchCategories, formData, selectedFile, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await catalogService.deleteCategory(deleteTarget.id);
      showToast('Category deleted successfully', 'success');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [deleteTarget, fetchCategories, showToast]);

  return {
    page,
    limit,
    error,
    sortBy,
    formData,
    isLoading,
    sortOrder,
    categories,
    isUploading,
    totalPages,
    totalItems,
    isModalOpen,
    searchInput,
    searchTerm,
    imagePreview,
    deleteTarget,
    setError,
    openEdit,
    openCreate,
    closeModal,
    setFormData,
    handleSort,
    changePage,
    handleDelete,
    changeLimit,
    updateSearch,
    handleSubmit,
    handleFileChange,
    setDeleteTarget,
    editing: Boolean(editingCategory),
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
