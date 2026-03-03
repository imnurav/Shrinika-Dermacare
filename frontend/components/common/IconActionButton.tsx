'use client';
import { memo, ReactNode } from 'react';

type Variant = 'default' | 'edit' | 'view' | 'delete';

type Props = {
  title: string;
  ariaLabel: string;
  onClick: () => void;
  icon: ReactNode;
  className?: string;
  variant?: Variant;
};

const VARIANT_CLASS: Record<Variant, string> = {
  default: 'hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700',
  edit: 'hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
  view: 'hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
  delete: 'hover:border-red-300 hover:bg-red-50 hover:text-red-700',
};

function IconActionButtonComponent({
  title,
  ariaLabel,
  onClick,
  icon,
  className = '',
  variant = 'default',
}: Props) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors ${VARIANT_CLASS[variant]} ${className}`}
    >
      {icon}
    </button>
  );
}

const IconActionButton = memo(IconActionButtonComponent);
export default IconActionButton;
