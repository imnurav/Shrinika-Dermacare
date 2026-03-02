'use client';
import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actionButton }) => {
  return (
    <div className="rounded-xl border border-transparent bg-gray-50 px-2 py-3 sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {actionButton && <div className="mt-3 flex gap-2 sm:mt-0">{actionButton}</div>}
    </div>
  );
};

export default PageHeader;
