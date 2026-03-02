'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

type QueryShape = Record<string, string>;

export function useListQueryState() {
  const router = useRouter();
  const pathname = usePathname();

  const readParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }, []);

  const getParam = useCallback((key: string, fallback = '') => {
    return readParams().get(key) ?? fallback;
  }, [readParams]);

  const setParams = useCallback((updates: QueryShape) => {
    const next = readParams();
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, readParams]);

  return { getParam, setParams };
}
