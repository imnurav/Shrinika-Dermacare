'use client';
import ActionButton from './ActionButton';

type Props = {
  onCancel: () => void;
  onSubmit: () => void;
  loading?: boolean;
  submitText: string;
};

export default function ModalActionFooter({ onCancel, onSubmit, loading = false, submitText }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
      >
        Cancel
      </button>
      <ActionButton variant="primary" onClick={onSubmit} loading={loading}>
        {submitText}
      </ActionButton>
    </>
  );
}
