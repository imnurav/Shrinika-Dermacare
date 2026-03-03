export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export function parsePageSize(raw: string, fallback = 10): number {
  const parsed = Number(raw);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : fallback;
}

export function parseSortOrder(raw: string, fallback: 'ASC' | 'DESC' = 'DESC'): 'ASC' | 'DESC' {
  if (raw === 'ASC' || raw === 'DESC') return raw;
  return fallback;
}

export function parseSortField<T extends readonly string[]>(raw: string, fields: T, fallback: T[number]): T[number] {
  return (fields as readonly string[]).includes(raw) ? (raw as T[number]) : fallback;
}
