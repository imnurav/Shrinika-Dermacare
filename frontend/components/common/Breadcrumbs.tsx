'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-indigo-100/95 sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="rounded px-1 py-0.5 transition hover:bg-white/10 hover:text-white">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-white' : ''}>{item.label}</span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 opacity-80" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
