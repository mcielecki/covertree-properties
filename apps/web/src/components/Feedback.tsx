import { Link } from 'react-router';
import type { ErrorDescription } from '../lib/error-messages';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-3 py-8 text-slate">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-mist border-t-canopy motion-reduce:animate-none"
      />
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
    <div
      role="alert"
      className="rounded-md border border-alert/25 border-l-4 border-l-alert bg-alert-wash px-4 py-3 text-sm text-alert-deep"
    >
      <p className="font-medium">{error.message}</p>
      {(error.existingId ?? onRetry) && (
        <div className="mt-2 flex gap-4">
          {error.existingId && (
            <Link
              to={`/properties/${error.existingId}`}
              className="font-semibold underline underline-offset-4"
            >
              View the existing property
            </Link>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
