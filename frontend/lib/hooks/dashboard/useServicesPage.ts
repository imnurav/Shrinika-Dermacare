"use client";
import { SERVICE_SORT_FIELDS } from "@/components/features/dashboard/services/constants";
import { ServiceFormData } from "@/components/features/dashboard/services/types";
import { CategoryOption, PaginatedResponse, Service } from "@/lib/types";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import { useToast } from "@/components/common/ToastProvider";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import { useCallback, useEffect, useState } from "react";
import { catalogService } from "@/lib/services/catalog";
import { uploadService } from "@/lib/services/upload";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import {
  parsePageSize,
  parseSortField,
  parseSortOrder,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants/pagination";

const EMPTY_FORM: ServiceFormData = {
  categoryId: "",
  title: "",
  description: "",
  imageUrl: "",
  duration: 60,
  price: 0,
  isActive: true,
};

export type ServicesInitialQuery = {
  search: string;
  page: number;
  limit: number;
  sortBy: (typeof SERVICE_SORT_FIELDS)[number];
  sortOrder: "ASC" | "DESC";
};

type ServicesHookOptions = {
  initialData?: PaginatedResponse<Service> | null;
  initialQuery?: ServicesInitialQuery;
};

export function useServicesPage(options?: ServicesHookOptions) {
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();
  const initialQuery = options?.initialQuery;
  const initialData = options?.initialData;

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(initialQuery?.sortOrder ?? "DESC");
  const [sortBy, setSortBy] = useState<string>(initialQuery?.sortBy ?? "createdAt");
  const [services, setServices] = useState<Service[]>(initialData?.data || []);
  const [error, setError] = useState<string | null>(null);
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchInput, setSearchInput] = useState(initialQuery?.search ?? "");
  const [searchTerm, setSearchTerm] = useState(initialQuery?.search ?? "");
  const [totalPages, setTotalPages] = useState(initialData?.meta.totalPages ?? 1);
  const [totalItems, setTotalItems] = useState(initialData?.meta.total ?? 0);
  const [limit, setLimit] = useState(initialQuery?.limit ?? 10);
  const [page, setPage] = useState(initialQuery?.page ?? 1);

  useEffect(() => {
    const search = getParam("search", "");
    setSearchInput(search);
    setSearchTerm(search);
    setPage(Number(getParam("page", "1")));
    setLimit(parsePageSize(getParam("limit", "10")));
    const sortByParam = getParam("sortBy", "createdAt");
    setSortBy(parseSortField(sortByParam, SERVICE_SORT_FIELDS, "createdAt"));
    setSortOrder(parseSortOrder(getParam("sortOrder", "DESC")));
    setIsQueryReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [servicesData, categoriesData] = await Promise.all([
        catalogService.getServices(
          undefined,
          searchTerm || undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        ),
        catalogService.getCategoryOptions(),
      ]);
      setServices(servicesData.data);
      setTotalItems(servicesData.meta.total);
      setTotalPages(servicesData.meta.totalPages);
      setCategories(categoriesData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (!isQueryReady) return;
    fetchData();
  }, [fetchData, isQueryReady]);

  const handleSort = useCallback(
    (field: string) => {
      const nextOrder =
        sortBy === field ? (sortOrder === "ASC" ? "DESC" : "ASC") : "ASC";
      setSortBy(field);
      setSortOrder(nextOrder);
      setPage(1);
      setParams({
        search: searchTerm,
        page: "1",
        limit: String(limit),
        sortBy: field,
        sortOrder: nextOrder,
      });
    },
    [limit, searchTerm, setParams, sortBy, sortOrder],
  );

  const applySearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setPage(1);
      setParams({
        search: value,
        page: "1",
        limit: String(limit),
        sortBy,
        sortOrder,
      });
    },
    [limit, setParams, sortBy, sortOrder],
  );

  const debouncedApplySearch = useDebouncedCallback(applySearch, 350);

  const updateSearch = useCallback((value: string) => {
    setSearchInput(value);
    debouncedApplySearch(value);
  }, [debouncedApplySearch]);

  const changePage = useCallback(
    (value: number) => {
      setPage(value);
      setParams({
        search: searchTerm,
        page: String(value),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
    },
    [limit, searchTerm, setParams, sortBy, sortOrder],
  );

  const changeLimit = useCallback(
    (value: number) => {
      setLimit(value);
      setPage(1);
      setParams({
        search: searchTerm,
        page: "1",
        limit: String(value),
        sortBy,
        sortOrder,
      });
    },
    [searchTerm, setParams, sortBy, sortOrder],
  );

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
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
    setEditingService(null);
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((service: Service) => {
    setEditingService(service);
    setFormData({
      categoryId: service.categoryId,
      title: service.title,
      description: service.description || "",
      imageUrl: service.imageUrl || "",
      duration: service.duration,
      price: service.price,
      isActive: service.isActive,
    });
    setImagePreview(service.imageUrl || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingService(null);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsUploading(true);
      let imageUrl = formData.imageUrl;
      if (selectedFile)
        imageUrl = await uploadService.uploadImage(selectedFile, "services");
      const payload = { ...formData, imageUrl };
      if (editingService) {
        await catalogService.updateService(editingService.id, payload);
        showToast("Service updated successfully", "success");
      } else {
        await catalogService.createService(payload);
        showToast("Service created successfully", "success");
      }
      closeModal();
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }, [
    closeModal,
    editingService,
    fetchData,
    formData,
    selectedFile,
    showToast,
  ]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await catalogService.deleteService(deleteTarget.id);
      showToast("Service deleted successfully", "success");
      fetchData();
      setDeleteTarget(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [deleteTarget, fetchData, showToast]);

  return {
    page,
    error,
    limit,
    sortBy,
    services,
    formData,
    openEdit,
    setError,
    isLoading,
    sortOrder,
    categories,
    searchInput,
    searchTerm,
    totalPages,
    totalItems,
    handleSort,
    changePage,
    openCreate,
    closeModal,
    isModalOpen,
    setFormData,
    isUploading,
    changeLimit,
    selectedFile,
    imagePreview,
    deleteTarget,
    updateSearch,
    handleSubmit,
    handleDelete,
    editingService,
    setDeleteTarget,
    setImagePreview,
    setSelectedFile,
    handleFileChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
