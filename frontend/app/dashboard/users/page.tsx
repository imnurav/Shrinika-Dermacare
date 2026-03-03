import { parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { USER_SORT_FIELDS } from '@/components/features/dashboard/users/constants';
import UsersPage from '@/components/features/dashboard/users/UsersPage';
import { getUsersPageServer } from '@/lib/server/adminData';

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
    startDate: readParam(params, 'startDate', ''),
    endDate: readParam(params, 'endDate', ''),
    page: Number(readParam(params, 'page', '1')),
    limit: parsePageSize(readParam(params, 'limit', '10')),
    sortBy: parseSortField(readParam(params, 'sortBy', 'createdAt'), USER_SORT_FIELDS, 'createdAt'),
    sortOrder: parseSortOrder(readParam(params, 'sortOrder', 'DESC')),
  };

  const initialData = await getUsersPageServer({
    search: query.search || undefined,
    startDate: query.startDate && query.endDate ? query.startDate : undefined,
    endDate: query.startDate && query.endDate ? query.endDate : undefined,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return <UsersPage initialData={initialData} initialQuery={query} />;
}
