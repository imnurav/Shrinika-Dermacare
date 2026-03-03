import { parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { CATEGORY_SORT_FIELDS } from '@/components/features/dashboard/categories/constants';
import CategoriesPage from '@/components/features/dashboard/categories/CategoriesPage';
import { getCategoriesPageServer } from '@/lib/server/adminData';

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
    sortBy: parseSortField(readParam(params, 'sortBy', 'name'), CATEGORY_SORT_FIELDS, 'name'),
    sortOrder: parseSortOrder(readParam(params, 'sortOrder', 'ASC'), 'ASC'),
  };

  const initialData = await getCategoriesPageServer({
    search: query.search || undefined,
    includeServices: false,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return <CategoriesPage initialData={initialData} initialQuery={query} />;
}
