"use client";
import { BOOKING_SORT_FIELDS } from "@/components/features/dashboard/bookings/constants";
import { BookingFormData } from "@/components/features/dashboard/bookings/types";
import { Booking, BookingStatus, PaginatedResponse, ServiceOption } from "@/lib/types";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import { useToast } from "@/components/common/ToastProvider";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import { bookingsService } from "@/lib/services/bookings";
import { useCallback, useEffect, useState } from "react";
import { catalogService } from "@/lib/services/catalog";
import { usersService } from "@/lib/services/users";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import {
  parsePageSize,
  parseSortField,
  parseSortOrder,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants/pagination";
import { format } from "date-fns";

const EMPTY_FORM: BookingFormData = {
  personName: "",
  personPhone: "",
  preferredDate: "",
  preferredTime: "",
  notes: "",
  addressId: "",
  serviceIds: [],
};

export type BookingsInitialQuery = {
  search: string;
  status: BookingStatus | "ALL";
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
  sortBy: (typeof BOOKING_SORT_FIELDS)[number];
  sortOrder: "ASC" | "DESC";
};

type BookingsHookOptions = {
  initialData?: PaginatedResponse<Booking> | null;
  initialQuery?: BookingsInitialQuery;
};

const toRows = (payload: unknown): Booking[] => {
  if (Array.isArray(payload)) return payload as Booking[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: Booking[] }).data;
  }
  return [];
};

const toMeta = (payload: unknown): { total: number; totalPages: number } => {
  if (payload && typeof payload === "object" && (payload as { meta?: unknown }).meta) {
    const meta = (payload as { meta?: { total?: number; totalPages?: number } }).meta;
    return {
      total: meta?.total ?? 0,
      totalPages: meta?.totalPages ?? 1,
    };
  }
  return { total: 0, totalPages: 1 };
};

export function useBookingsPage(options?: BookingsHookOptions) {
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();
  const initialQuery = options?.initialQuery;
  const initialData = options?.initialData;
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    initialQuery?.status ?? "ALL",
  );
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const initialRows = toRows(initialData);
  const initialMeta = toMeta(initialData);
  const [bookings, setBookings] = useState<Booking[]>(initialRows);
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchInput, setSearchInput] = useState(initialQuery?.search ?? "");
  const [searchTerm, setSearchTerm] = useState(initialQuery?.search ?? "");
  const [startDate, setStartDate] = useState(initialQuery?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialQuery?.endDate ?? "");
  const [formData, setFormData] = useState<BookingFormData>(EMPTY_FORM);
  const [addressCache, setAddressCache] = useState<
    Record<string, Array<{ id: string; label: string }>>
  >({});
  const [addressOptions, setAddressOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(initialQuery?.sortOrder ?? "DESC");
  const [isEditMetaLoading, setIsEditMetaLoading] = useState(false);
  const [serviceSelectValue, setServiceSelectValue] = useState("");
  const [sortBy, setSortBy] = useState<string>(initialQuery?.sortBy ?? "createdAt");
  const [isSaving, setIsSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(initialMeta.totalPages);
  const [totalItems, setTotalItems] = useState(initialMeta.total);
  const [limit, setLimit] = useState(initialQuery?.limit ?? 10);
  const [page, setPage] = useState(initialQuery?.page ?? 1);

  const getDateQuery = useCallback(
    (from: string, to: string) =>
      !from || !to
        ? { startDate: "", endDate: "" }
        : { startDate: from, endDate: to },
    [],
  );

  useEffect(() => {
    const search = getParam("search", "");
    setSearchInput(search);
    setSearchTerm(search);
    setStatusFilter(
      (getParam("status", "ALL") as BookingStatus | "ALL") || "ALL",
    );
    setStartDate(getParam("startDate", ""));
    setEndDate(getParam("endDate", ""));
    setPage(Number(getParam("page", "1")));
    setLimit(parsePageSize(getParam("limit", "10")));
    const sortByParam = getParam("sortBy", "createdAt");
    setSortBy(parseSortField(sortByParam, BOOKING_SORT_FIELDS, "createdAt"));
    setSortOrder(parseSortOrder(getParam("sortOrder", "DESC")));
    setIsQueryReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bookingsService.getAllBookings(
        statusFilter !== "ALL" ? statusFilter : undefined,
        startDate && endDate ? startDate : undefined,
        startDate && endDate ? endDate : undefined,
        searchTerm || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      );
      const nextRows = toRows(data);
      const nextMeta = toMeta(data);
      setBookings(nextRows);
      setTotalPages(nextMeta.totalPages);
      setTotalItems(nextMeta.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    endDate,
    limit,
    page,
    searchTerm,
    sortBy,
    sortOrder,
    startDate,
    statusFilter,
  ]);

  useEffect(() => {
    if (!isQueryReady) return;
    fetchBookings();
  }, [fetchBookings, isQueryReady]);

  useEffect(() => {
    if (serviceOptions.length > 0) return;
    const loadServiceOptions = async () => {
      try {
        const services = await catalogService.getServiceOptions();
        setServiceOptions(Array.isArray(services) ? services : []);
      } catch {
        // No-op: regular actions already show errors.
      }
    };
    loadServiceOptions();
  }, [serviceOptions.length]);

  const loadAddressesForUser = useCallback(
    async (userId: string) => {
      if (!userId) {
        setAddressOptions([]);
        return [];
      }
      if (addressCache[userId]) {
        setAddressOptions(addressCache[userId]);
        return addressCache[userId];
      }
      const userDetail = await usersService.getUser(userId);
      const options = (userDetail.addresses || []).map((address) => ({
        id: address.id,
        label: `${address.label} - ${address.addressLine1}, ${address.city}`,
      }));
      setAddressOptions(options);
      setAddressCache((prev) => ({ ...prev, [userId]: options }));
      return options;
    },
    [addressCache],
  );

  const openEdit = useCallback(
    async (booking: Booking) => {
      setEditingBooking(booking);
      setFormData({
        personName: booking.personName || "",
        personPhone: booking.personPhone || "",
        preferredDate: booking.preferredDate
          ? new Date(booking.preferredDate).toISOString().slice(0, 10)
          : "",
        preferredTime: booking.preferredTime
          ? booking.preferredTime.slice(0, 5)
          : "",
        notes: booking.notes || "",
        addressId: booking.addressId || "",
        serviceIds: booking.bookingServices
          ? booking.bookingServices.map((bs) => bs.serviceId)
          : [],
      });
      setIsModalOpen(true);
      setIsEditMetaLoading(true);
      try {
        const servicesPromise =
          serviceOptions.length > 0
            ? Promise.resolve(serviceOptions)
            : catalogService.getServiceOptions();
        const [services] = await Promise.all([
          servicesPromise,
          loadAddressesForUser(booking.userId),
        ]);
        if (serviceOptions.length === 0) setServiceOptions(Array.isArray(services) ? services : []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsEditMetaLoading(false);
      }
    },
    [loadAddressesForUser, serviceOptions],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingBooking(null);
    setFormData(EMPTY_FORM);
    setAddressOptions([]);
    setServiceSelectValue("");
    setIsEditMetaLoading(false);
  }, []);

  const handleSort = useCallback(
    (field: string) => {
      const nextOrder =
        sortBy === field ? (sortOrder === "ASC" ? "DESC" : "ASC") : "ASC";
      setSortBy(field);
      setSortOrder(nextOrder);
      setPage(1);
      setParams({
        search: searchTerm,
        status: statusFilter === "ALL" ? "" : statusFilter,
        ...getDateQuery(startDate, endDate),
        page: "1",
        limit: String(limit),
        sortBy: field,
        sortOrder: nextOrder,
      });
    },
    [
      endDate,
      getDateQuery,
      limit,
      searchTerm,
      setParams,
      sortBy,
      sortOrder,
      startDate,
      statusFilter,
    ],
  );

  const applySearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setPage(1);
      setParams({
        search: value,
        status: statusFilter === "ALL" ? "" : statusFilter,
        ...getDateQuery(startDate, endDate),
        page: "1",
        limit: String(limit),
        sortBy,
        sortOrder,
      });
    },
    [
      limit,
      sortBy,
      endDate,
      setParams,
      sortOrder,
      startDate,
      getDateQuery,
      statusFilter,
    ],
  );

  const debouncedApplySearch = useDebouncedCallback(applySearch, 350);

  const updateSearch = useCallback((value: string) => {
    setSearchInput(value);
    debouncedApplySearch(value);
  }, [debouncedApplySearch]);

  const updateFilter = useCallback(
    (id: string, value: string) => {
      if (id === "status") {
        const next = (value as BookingStatus | "ALL") || "ALL";
        setStatusFilter(next);
        setPage(1);
        setParams({
          search: searchTerm,
          status: next === "ALL" ? "" : next,
          ...getDateQuery(startDate, endDate),
          page: "1",
          limit: String(limit),
          sortBy,
          sortOrder,
        });
        return;
      }
      if (id === "startDate" || id === "endDate") {
        const nextStart = id === "startDate" ? value : startDate;
        const nextEnd = id === "endDate" ? value : endDate;
        setStartDate(nextStart);
        setEndDate(nextEnd);
        setPage(1);
        setParams({
          search: searchTerm,
          status: statusFilter === "ALL" ? "" : statusFilter,
          ...getDateQuery(nextStart, nextEnd),
          page: "1",
          limit: String(limit),
          sortBy,
          sortOrder,
        });
      }
    },
    [
      limit,
      sortBy,
      endDate,
      setParams,
      sortOrder,
      startDate,
      searchTerm,
      getDateQuery,
      statusFilter,
    ],
  );

  const changePage = useCallback(
    (value: number) => {
      setPage(value);
      setParams({
        search: searchTerm,
        status: statusFilter === "ALL" ? "" : statusFilter,
        ...getDateQuery(startDate, endDate),
        page: String(value),
        limit: String(limit),
        sortBy,
        sortOrder,
      });
    },
    [
      endDate,
      getDateQuery,
      limit,
      searchTerm,
      setParams,
      sortBy,
      sortOrder,
      startDate,
      statusFilter,
    ],
  );

  const changeLimit = useCallback(
    (value: number) => {
      setLimit(value);
      setPage(1);
      setParams({
        search: searchTerm,
        status: statusFilter === "ALL" ? "" : statusFilter,
        ...getDateQuery(startDate, endDate),
        page: "1",
        limit: String(value),
        sortBy,
        sortOrder,
      });
    },
    [
      endDate,
      getDateQuery,
      searchTerm,
      setParams,
      sortBy,
      sortOrder,
      startDate,
      statusFilter,
    ],
  );

  const handleStatusUpdate = useCallback(
    async (id: string, newStatus: BookingStatus) => {
      try {
        setError(null);
        await bookingsService.updateBookingStatus(id, newStatus);
        setBookings((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item,
          ),
        );
        showToast("Booking status updated", "success");
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [showToast],
  );

  const handleAddService = useCallback(() => {
    if (!serviceSelectValue) return;
    if (formData.serviceIds.includes(serviceSelectValue)) {
      setServiceSelectValue("");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      serviceIds: [...prev.serviceIds, serviceSelectValue],
    }));
    setServiceSelectValue("");
  }, [formData.serviceIds, serviceSelectValue]);

  const handleRemoveService = useCallback((serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.filter((id) => id !== serviceId),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingBooking) return;
    try {
      setIsSaving(true);
      setError(null);
      const today = format(new Date(), "yyyy-MM-dd");
      if (formData.preferredDate < today) {
        setError("Preferred date cannot be in the past.");
        return;
      }
      if (formData.preferredDate === today) {
        const nowTime = format(new Date(), "HH:mm");
        if (formData.preferredTime < nowTime) {
          setError("Preferred time cannot be in the past.");
          return;
        }
      }
      await bookingsService.updateBooking(editingBooking.id, {
        personName: formData.personName,
        personPhone: formData.personPhone,
        preferredDate: formData.preferredDate,
        preferredTime: `${formData.preferredTime}:00`,
        notes: formData.notes,
        addressId: formData.addressId,
        serviceIds: formData.serviceIds,
      });
      await fetchBookings();
      showToast("Booking updated successfully", "success");
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [closeModal, editingBooking, fetchBookings, formData, showToast]);

  const minDate = format(new Date(), "yyyy-MM-dd");
  const minTime =
    formData.preferredDate !== format(new Date(), "yyyy-MM-dd")
      ? undefined
      : format(new Date(), "HH:mm");

  return {
    page,
    error,
    limit,
    sortBy,
    endDate,
    minDate,
    minTime,
    bookings,
    isSaving,
    formData,
    openEdit,
    setError,
    isLoading,
    startDate,
    sortOrder,
    searchInput,
    searchTerm,
    totalPages,
    totalItems,
    handleSort,
    changePage,
    closeModal,
    handleSave,
    isModalOpen,
    setFormData,
    changeLimit,
    statusFilter,
    updateSearch,
    updateFilter,
    serviceOptions,
    addressOptions,
    handleAddService,
    isEditMetaLoading,
    serviceSelectValue,
    handleStatusUpdate,
    handleRemoveService,
    setServiceSelectValue,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
