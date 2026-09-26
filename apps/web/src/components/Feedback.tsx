import { Link } from 'react-router';
import type { ErrorDescription } from '../lib/error-messages';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="py-6 text-gray-600">
      {label}
    </p>
  );
}

interface ErrorAlertProps {
  error: ErrorDescription;
  onRetry?: () => void;
}

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  return (
    <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <p>{error.message}</p>
      {error.existingId && (
        <Link to={`/properties/${error.existingId}`} className="font-medium underline">
          View the existing property
        </Link>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-medium underline">
          Try again
        </button>
      )}
    </div>
  );
}
