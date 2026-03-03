'use client';
import React from 'react';
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actionButton, breadcrumbs = [] }) => {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-500 px-4 py-4 text-white sm:flex sm:items-center sm:justify-between">
      <div>
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-indigo-100">{description}</p>}
      </div>
      {actionButton && <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">{actionButton}</div>}
    </div>
  );
};

export default PageHeader;
