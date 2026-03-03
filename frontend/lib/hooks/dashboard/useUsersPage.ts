'use client';
import { PAGE_SIZE_OPTIONS, parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { USER_SORT_FIELDS } from '@/components/features/dashboard/users/constants';
import { UserFormData } from '@/components/features/dashboard/users/types';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useCurrentUser } from '@/lib/context/CurrentUserContext';
import { useToast } from '@/components/common/ToastProvider';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { User, UserGender, UserRole } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';
import { usersService } from '@/lib/services/users';
import { PaginatedResponse } from '@/lib/types';

const EMPTY_FORM: UserFormData = {
  name: '',
  phone: '',
  imageUrl: '',
  role: UserRole.USER,
  gender: UserGender.OTHER,
};

export type UsersInitialQuery = {
  search: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
  sortBy: (typeof USER_SORT_FIELDS)[number];
  sortOrder: 'ASC' | 'DESC';
};

type UsersHookOptions = {
  initialData?: PaginatedResponse<User> | null;
  initialQuery?: UsersInitialQuery;
};

export function useUsersPage(options?: UsersHookOptions) {
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const initialQuery = options?.initialQuery;
  const initialData = options?.initialData;
  const [users, setUsers] = useState<User[]>(initialData?.data || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(initialQuery?.search ?? '');
  const [searchTerm, setSearchTerm] = useState(initialQuery?.search ?? '');
  const [startDate, setStartDate] = useState(initialQuery?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialQuery?.endDate ?? '');
  const [sortBy, setSortBy] = useState<string>(initialQuery?.sortBy ?? 'createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialQuery?.sortOrder ?? 'DESC');
  const [page, setPage] = useState(initialQuery?.page ?? 1), [limit, setLimit] = useState(initialQuery?.limit ?? 10);
  const [totalPages, setTotalPages] = useState(initialData?.meta.totalPages ?? 1), [totalItems, setTotalItems] = useState(initialData?.meta.total ?? 0);
  const [isModalOpen, setIsModalOpen] = useState(false), [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null), [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null), [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);

  const getDateQuery = useCallback(
    (from: string, to: string) => (!from || !to ? { startDate: '', endDate: '' } : { startDate: from, endDate: to }),
    [],
  );

  const updateQuery = useCallback(
    (overrides: Record<string, string>) => {
      setParams({
        search: searchTerm,
        ...getDateQuery(startDate, endDate),
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
        ...overrides,
      });
    },
    [endDate, getDateQuery, limit, page, searchTerm, setParams, sortBy, sortOrder, startDate],
  );

  useEffect(() => {
    const search = getParam('search', '');
    setSearchInput(search);
    setSearchTerm(search);
    setStartDate(getParam('startDate', ''));
    setEndDate(getParam('endDate', ''));
    setPage(Number(getParam('page', '1')));
    setLimit(parsePageSize(getParam('limit', '10')));
    const sortByParam = getParam('sortBy', 'createdAt');
    setSortBy(parseSortField(sortByParam, USER_SORT_FIELDS, 'createdAt'));
    setSortOrder(parseSortOrder(getParam('sortOrder', 'DESC')));
    setIsQueryReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersService.getAllUsers(
        searchTerm || undefined,
        startDate && endDate ? startDate : undefined,
        startDate && endDate ? endDate : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      );
      setUsers(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalItems(data.meta.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [endDate, limit, page, searchTerm, sortBy, sortOrder, startDate]);

  useEffect(() => {
    if (!isQueryReady) return;
    fetchUsers();
  }, [fetchUsers, isQueryReady]);

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

  const updateFilter = useCallback(
    (id: string, value: string) => {
      const nextStart = id === 'startDate' ? value : startDate;
      const nextEnd = id === 'endDate' ? value : endDate;
      setStartDate(nextStart);
      setEndDate(nextEnd);
      setPage(1);
      setParams({
        search: searchTerm,
        ...getDateQuery(nextStart, nextEnd),
        page: '1',
        limit: String(limit),
        sortBy,
        sortOrder,
      });
    },
    [endDate, getDateQuery, limit, searchTerm, setParams, sortBy, sortOrder, startDate],
  );

  const changePage = useCallback((value: number) => {
    setPage(value);
    updateQuery({ page: String(value) });
  }, [updateQuery]);

  const changeLimit = useCallback((value: number) => {
    setLimit(value);
    setPage(1);
    updateQuery({ limit: String(value), page: '1' });
  }, [updateQuery]);

  const openEdit = useCallback((user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      imageUrl: user.imageUrl || '',
      role: user.role,
      gender: user.gender || UserGender.OTHER,
    });
    setImagePreview(user.imageUrl || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setImagePreview(null);
  }, []);

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

  const handleSave = useCallback(async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      setError(null);
      const form = new FormData();
      if (formData.name) form.append('name', formData.name);
      if (formData.phone) form.append('phone', formData.phone);
      if (formData.role) form.append('role', formData.role);
      if (formData.gender) form.append('gender', formData.gender);
      if (selectedFile) form.append('file', selectedFile);

      const updated = await usersService.updateUser(editingUser.id, form);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast('User updated successfully', 'success');
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [closeModal, editingUser, formData.gender, formData.name, formData.phone, formData.role, selectedFile, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await usersService.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setTotalItems((prev) => Math.max(prev - 1, 0));
      showToast('User deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [deleteTarget, showToast]);

  return {
    page, limit, users, error, sortBy, isLoading, sortOrder, endDate, startDate, formData, isSaving, totalPages, totalItems,
    isModalOpen, searchInput, searchTerm, editingUser, deleteTarget, imagePreview, currentUser, setError, setFormData, setDeleteTarget,
    closeModal, openEdit, handleSort, handleSave, changePage, handleDelete, changeLimit, updateSearch, updateFilter,
    handleFileChange, pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
