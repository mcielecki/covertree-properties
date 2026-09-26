import { useApolloClient, useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ErrorAlert } from '../../../components/Feedback';
import { describeError } from '../../../lib/error-messages';
import { evictProperty } from '../api/cache';
import { DELETE_PROPERTY } from '../api/mutations';
import { PROPERTIES_QUERY } from '../api/queries';

interface DeleteButtonProps {
  id: string;
  /** Shown in the confirmation dialog. */
  address: string;
  onDeleted?: () => void;
  className?: string;
}

/**
 * Asks for confirmation, deletes, refetches the active list query and evicts the property from
 * the cache (AC-W.6). Every delete entry point (list and details) goes through here.
 */
export function DeleteButton({ id, address, onDeleted, className = '' }: DeleteButtonProps) {
  const { cache } = useApolloClient();
  const [confirming, setConfirming] = useState(false);
  const [deleteProperty, { loading, error }] = useMutation(DELETE_PROPERTY, {
    refetchQueries: [PROPERTIES_QUERY],
    awaitRefetchQueries: true,
  });

  async function handleConfirm() {
    try {
      await deleteProperty({ variables: { id } });
    } catch {
      setConfirming(false);
      return; // The hook's `error` renders the message below.
    }
    setConfirming(false);
    evictProperty(cache, id);
    if (onDeleted) {
      onDeleted();
    } else {
      // The row holding this button is gone, so focus would fall back to <body>.
      document.getElementById('main')?.focus();
    }
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={loading}
        aria-label={`Delete ${address}`}
        className="btn btn-danger-quiet"
      >
        {loading ? 'Deleting…' : 'Delete'}
      </button>
      <ConfirmDialog
        open={confirming}
        title="Delete this property?"
        description={`${address} will be permanently removed.`}
        confirmLabel="Delete property"
        busyLabel="Deleting…"
        busy={loading}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirming(false)}
      />
      {error && <ErrorAlert error={describeError(error)} />}
    </div>
  );
}
