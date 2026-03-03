import { cookies } from "next/headers";
import {
  Booking,
  Category,
  PaginatedResponse,
  Service,
  User,
  DashboardAnalytics,
} from "@/lib/types";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

type QueryValue = string | number | boolean | undefined;
type Query = Record<string, QueryValue>;

function createUrl(path: string, query?: Query): string {
  const base = BACKEND_URL.endsWith("/")
    ? BACKEND_URL.slice(0, -1)
    : BACKEND_URL;
  const url = new URL(`${base}${path.startsWith("/") ? "" : "/"}${path}`);
  if (!query) return url.toString();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function fetchWithAuth<T>(
  path: string,
  query?: Query,
): Promise<T | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  const response = await fetch(createUrl(path, query), {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function getDashboardAnalyticsServer() {
  return fetchWithAuth<DashboardAnalytics>("/admin/analytics");
}

export async function getBookingsPageServer(query: {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}) {
  return fetchWithAuth<PaginatedResponse<Booking>>("/admin/bookings", query);
}

export async function getBookingByIdServer(id: string) {
  return fetchWithAuth<Booking>(`/admin/bookings/${id}`);
}

export async function getUsersPageServer(query: {
  search?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}) {
  return fetchWithAuth<PaginatedResponse<User>>("/admin/users", query);
}

export async function getCategoriesPageServer(query: {
  search?: string;
  includeServices?: boolean;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}) {
  return fetchWithAuth<PaginatedResponse<Category>>(
    "/catalog/categories",
    query,
  );
}

export async function getServicesPageServer(query: {
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}) {
  return fetchWithAuth<PaginatedResponse<Service>>("/catalog/services", query);
}

export async function getProfileServer() {
  return fetchWithAuth<User>("/user/profile");
}
