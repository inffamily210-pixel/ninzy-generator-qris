'use client';

const STORAGE_KEY = 'ninzy_history_v1';
const MAX_ENTRIES = 200; // keep the list bounded so it never grows unbounded in localStorage

export type HistoryEntryType = 'shortlink' | 'page';

export interface HistoryEntry {
  id: string; // the short `code` — also used as the React key and dedupe key
  type: HistoryEntryType;
  url: string; // the shareable URL (e.g. https://.../s/abc123 or .../p/abc123)
  originalUrl: string; // the link the user originally entered
  title?: string; // only set for 'page' entries, and only if the user gave one
  createdAt: string; // ISO timestamp
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAll(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // Corrupted or unparsable data shouldn't crash the app — treat as empty.
    return [];
  }
}

function writeAll(entries: HistoryEntry[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage disabled (e.g. private browsing in some
    // browsers) — fail silently. History is a convenience feature, not
    // critical path: the shortlink/page itself was already created
    // successfully on the server regardless of whether we can remember it
    // locally.
  }
}

/**
 * Adds a new entry to the front of the history list. Safe to call even if
 * localStorage is unavailable — it just becomes a no-op.
 */
export function addHistoryEntry(entry: Omit<HistoryEntry, 'createdAt'>): void {
  const entries = readAll();
  // Avoid duplicate entries if this function is ever called twice for the
  // same code (e.g. a retried request).
  const withoutDupe = entries.filter((e) => e.id !== entry.id);
  const next: HistoryEntry[] = [
    { ...entry, createdAt: new Date().toISOString() },
    ...withoutDupe,
  ].slice(0, MAX_ENTRIES);
  writeAll(next);
}

export function getHistory(): HistoryEntry[] {
  return readAll();
}

export function removeHistoryEntry(id: string): void {
  const entries = readAll();
  writeAll(entries.filter((e) => e.id !== id));
}

export function clearHistory(): void {
  writeAll([]);
}
