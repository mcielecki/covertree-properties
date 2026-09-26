import { describe, expect, it } from 'vitest';
import { US_STATES } from './us-states.js';

describe('US_STATES', () => {
  it('has the 50 states plus DC, without duplicates', () => {
    expect(US_STATES).toHaveLength(51);
    expect(new Set(US_STATES).size).toBe(51);
  });

  it('includes DC', () => {
    expect(US_STATES).toContain('DC');
  });

  it('excludes territories', () => {
    expect(US_STATES).not.toContain('PR');
    expect(US_STATES).not.toContain('GU');
  });

  it('uses two-letter uppercase codes', () => {
    for (const state of US_STATES) expect(state).toMatch(/^[A-Z]{2}$/);
  });
});
