import { useMutation } from '@apollo/client/react';
import { ErrorAlert } from '../../../components/Feedback';
import { describeError } from '../../../lib/error-messages';
import { DELETE_PROPERTY } from '../api/mutations';
import { PROPERTIES_QUERY } from '../api/queries';

interface DeleteButtonProps {
  id: string;
  /** Shown in the confirmation prompt. */
  address: string;
  onDeleted?: () => void;
}

/** Asks for confirmation, deletes, then refetches the active list query (AC-W.6). */
export function DeleteButton({ id, address, onDeleted }: DeleteButtonProps) {
  const [deleteProperty, { loading, error }] = useMutation(DELETE_PROPERTY, {
    refetchQueries: [PROPERTIES_QUERY],
    awaitRefetchQueries: true,
  });

  async function handleClick() {
    if (!window.confirm(`Delete ${address}? This cannot be undone.`)) return;
    try {
      await deleteProperty({ variables: { id } });
    } catch {
      return; // The hook's `error` renders the message below.
    }
    onDeleted?.();
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        aria-label={`Delete ${address}`}
        className="rounded border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? 'Deleting…' : 'Delete'}
      </button>
      {error && <ErrorAlert error={describeError(error)} />}
    </div>
  );
}
