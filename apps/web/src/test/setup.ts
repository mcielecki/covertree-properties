import { MockLink } from '@apollo/client/testing';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Apollo 4 defaults to a random 20–50 ms delay per mocked response; tests don't need it.
MockLink.defaultOptions = { delay: 0 };

// jsdom implements <dialog> (the `open` attribute hides and shows it) but not showModal/close.
// These stubs only toggle `open` and fire `close`; modality and focus return are checked in a
// real browser.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return;
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
