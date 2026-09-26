import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

// jsdom has no showModal/close; src/test/setup.ts stubs them. Real modality (inert page,
// Escape, focus return) is the browser's job and is checked in the Playwright walkthrough.

function renderDialog(open: boolean) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <ConfirmDialog
      open={open}
      title="Delete this property?"
      description="15528 E Golden Eagle Blvd will be removed. This cannot be undone."
      confirmLabel="Delete property"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { ...view, onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('opens as a modal alertdialog named by its title and described by its text', () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    renderDialog(true);

    const dialog = screen.getByRole('alertdialog', { name: 'Delete this property?' });
    expect(dialog).toHaveAccessibleDescription(/cannot be undone/);
    expect(showModal).toHaveBeenCalledOnce();
  });

  it('is not shown while closed', () => {
    renderDialog(false);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('calls onConfirm from the confirm button', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog(true);

    await user.click(screen.getByRole('button', { name: 'Delete property' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel from the cancel button', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog(true);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when the browser closes it (Escape)', () => {
    const { onCancel } = renderDialog(true);

    screen.getByRole<HTMLDialogElement>('alertdialog').close();

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('closes the native dialog when `open` turns false, without reporting a cancel', () => {
    const { rerender, onCancel, onConfirm } = renderDialog(true);
    const dialog = screen.getByRole('alertdialog');

    rerender(
      <ConfirmDialog
        open={false}
        title="Delete this property?"
        description="x"
        confirmLabel="Delete property"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(dialog).not.toHaveAttribute('open');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables both buttons and shows the busy label while busy', () => {
    render(
      <ConfirmDialog
        open
        busy
        title="Delete this property?"
        description="x"
        confirmLabel="Delete property"
        busyLabel="Deleting…"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
