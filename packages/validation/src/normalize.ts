/** Trims and collapses every run of whitespace to a single space. Casing is kept. */
export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
