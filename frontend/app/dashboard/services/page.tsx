import { parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { SERVICE_SORT_FIELDS } from '@/components/features/dashboard/services/constants';
import ServicesPage from '@/components/features/dashboard/services/ServicesPage';
import { getServicesPageServer } from '@/lib/server/adminData';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string, fallback = ''): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = {
    search: readParam(params, 'search', ''),
    page: Number(readParam(params, 'page', '1')),
    limit: parsePageSize(readParam(params, 'limit', '10')),
    sortBy: parseSortField(readParam(params, 'sortBy', 'createdAt'), SERVICE_SORT_FIELDS, 'createdAt'),
    sortOrder: parseSortOrder(readParam(params, 'sortOrder', 'DESC')),
  };

  const initialData = await getServicesPageServer({
    search: query.search || undefined,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return <ServicesPage initialData={initialData} initialQuery={query} />;
}
