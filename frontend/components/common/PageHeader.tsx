'use client';
import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actionButton }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {actionButton && <div className="flex gap-2">{actionButton}</div>}
    </div>
  );
};

export default PageHeader;
