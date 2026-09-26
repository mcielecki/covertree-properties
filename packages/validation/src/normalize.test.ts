import { describe, expect, it } from 'vitest';
import { normalizeWhitespace } from './normalize.js';

describe('normalizeWhitespace', () => {
  it('trims both ends', () => {
    expect(normalizeWhitespace('  Phoenix  ')).toBe('Phoenix');
  });

  it('collapses runs of spaces, tabs, newlines and NBSP to one space', () => {
    expect(normalizeWhitespace('Fountain \t\n  Hills')).toBe('Fountain Hills');
  });

  it('AC-5.6: keeps casing', () => {
    expect(normalizeWhitespace('  15528  E Golden Eagle Blvd ')).toBe('15528 E Golden Eagle Blvd');
  });

  it('turns whitespace-only input into an empty string', () => {
    expect(normalizeWhitespace(' \t\n ')).toBe('');
  });
});
