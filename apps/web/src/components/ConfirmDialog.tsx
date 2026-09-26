import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** Replaces `confirmLabel` while `busy`. */
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A modal confirmation on the native <dialog>. showModal() makes the rest of the page inert,
 * handles Escape and returns focus to the element that opened it when it closes.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleClose() {
    // Closed by the browser (Escape) while the parent still thinks it is open.
    if (openRef.current) onCancel();
  }

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={handleClose}
      onClick={(event) => {
        // A click on the dialog element itself, not its content, is a click on the backdrop.
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
      className="confirm-dialog m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg bg-white p-0 text-pine shadow-xl"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-slate">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {/* First in the DOM, so showModal() focuses the safe choice. */}
          <button type="button" onClick={onCancel} disabled={busy} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="btn btn-danger">
            {busy && busyLabel ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
