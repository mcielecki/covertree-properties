import { MockLink } from '@apollo/client/testing';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Apollo 4 defaults to a random 20–50 ms delay per mocked response; tests don't need it.
MockLink.defaultOptions = { delay: 0 };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
