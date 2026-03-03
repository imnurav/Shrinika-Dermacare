'use client';
import { ReactNode, useId } from 'react';
import ActionButton from './ActionButton';
import Modal from './Modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitText: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  formClassName?: string;
};

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitText,
  loading = false,
  size = 'xl',
  children,
  formClassName = 'space-y-4',
}: Props) {
  const formId = useId().replace(/:/g, '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <ActionButton type="submit" form={formId} variant="primary" loading={loading}>
            {submitText}
          </ActionButton>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className={formClassName}
      >
        {children}
      </form>
    </Modal>
  );
}
