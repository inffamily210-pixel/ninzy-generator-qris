import { customAlphabet } from 'nanoid';

// Alphabet excludes visually-confusable characters (0/O, 1/l/I) since these
// codes are meant to be read off a screen or typed by hand occasionally.
const nanoid = customAlphabet(
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  7
);

export function generateCode(): string {
  return nanoid();
}

/**
 * Validates that a string is a safe, well-formed http(s) URL before it's
 * stored and later used as a redirect target. This matters for an open
 * redirect / SSRF surface: without it, someone could submit a
 * `javascript:` URL (stored XSS when rendered back into an href) or a
 * `file:`/`data:` URL.
 */
export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
      }
