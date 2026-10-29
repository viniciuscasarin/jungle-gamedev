import { validateCompletedResult } from '../domain/result';
import type { CompletedMatchResult } from '../domain/result';
import { LOCAL_KEYS } from '../storage/local';
import type { OutboxEntry, OutboxStatus } from './contracts';

export interface OutboxStore {
  getEntries(): readonly OutboxEntry[];
  getEntry(matchId: string): OutboxEntry | undefined;
  enqueue(result: CompletedMatchResult): OutboxEntry;
  updateEntry(matchId: string, patch: Partial<Omit<OutboxEntry, 'matchId' | 'result'>>): OutboxEntry | undefined;
  remove(matchId: string): boolean;
  clear(): void;
  isMemoryFallback(): boolean;
  subscribe(listener: () => void): () => void;
}

const OUTBOX_STORAGE_KEY = LOCAL_KEYS.outbox;

function isValidStatus(status: unknown): status is OutboxStatus {
  return status === 'pending' || status === 'recording' || status === 'recorded' || status === 'failed';
}

function sanitizeEntry(raw: unknown): OutboxEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<OutboxEntry>;
  if (typeof candidate.matchId !== 'string' || !candidate.matchId) return null;
  try {
    const validatedResult = validateCompletedResult(candidate.result);
    return {
      matchId: candidate.matchId,
      result: validatedResult,
      status: isValidStatus(candidate.status) ? candidate.status : 'pending',
      attempts: typeof candidate.attempts === 'number' && Number.isFinite(candidate.attempts) ? candidate.attempts : 0,
      lastAttemptAt: typeof candidate.lastAttemptAt === 'string' ? candidate.lastAttemptAt : null,
      error: typeof candidate.error === 'string' ? candidate.error : null,
      errorCategory: candidate.errorCategory ?? undefined,
      permanentFailure: Boolean(candidate.permanentFailure),
      createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function createOutboxStore(getStorage?: () => Storage | undefined): OutboxStore {
  let memoryEntries: OutboxEntry[] = [];
  let isMemoryOnly = false;
  let cachedRaw: string | null = null;
  let cachedEntries: readonly OutboxEntry[] = [];
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) {
      try {
        listener();
      } catch (err) {
        console.error('OutboxStore listener error:', err);
      }
    }
  }

  function acquireStorage(): Storage | undefined {
    if (isMemoryOnly) return undefined;
    try {
      if (getStorage) return getStorage();
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
      return undefined;
    } catch {
      isMemoryOnly = true;
      return undefined;
    }
  }

  function readEntries(): readonly OutboxEntry[] {
    const storage = acquireStorage();
    if (!storage) return memoryEntries;

    try {
      const raw = storage.getItem(OUTBOX_STORAGE_KEY);
      if (raw === cachedRaw) {
        return cachedEntries;
      }

      cachedRaw = raw;
      if (raw === null) {
        cachedEntries = [];
        return cachedEntries;
      }

      const parsed: unknown = JSON.parse(raw);
      let items: unknown[];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown }).data)) {
        items = (parsed as { data: unknown[] }).data;
      } else {
        cachedEntries = [];
        return cachedEntries;
      }

      const list: OutboxEntry[] = [];
      for (const item of items) {
        const sanitized = sanitizeEntry(item);
        if (sanitized) list.push(sanitized);
      }
      cachedEntries = Object.freeze(list);
      return cachedEntries;
    } catch {
      isMemoryOnly = true;
      cachedRaw = null;
      cachedEntries = memoryEntries;
      return cachedEntries;
    }
  }

  function writeEntries(entries: readonly OutboxEntry[]): boolean {
    const storage = acquireStorage();
    if (!storage) {
      memoryEntries = [...entries];
      cachedEntries = Object.freeze([...entries]);
      cachedRaw = null;
      return true;
    }

    try {
      const envelope = { version: 1, data: entries };
      const raw = JSON.stringify(envelope);
      storage.setItem(OUTBOX_STORAGE_KEY, raw);
      cachedRaw = raw;
      cachedEntries = Object.freeze([...entries]);
      return true;
    } catch {
      isMemoryOnly = true;
      memoryEntries = [...entries];
      cachedEntries = Object.freeze([...entries]);
      cachedRaw = null;
      return false;
    }
  }

  return {
    getEntries(): readonly OutboxEntry[] {
      return readEntries();
    },

    getEntry(matchId: string): OutboxEntry | undefined {
      const entries = readEntries();
      return entries.find(e => e.matchId === matchId);
    },

    enqueue(result: CompletedMatchResult): OutboxEntry {
      const validResult = validateCompletedResult(result);
      const entries = readEntries();
      const existing = entries.find(e => e.matchId === validResult.matchId);
      if (existing) {
        return existing;
      }

      const newEntry: OutboxEntry = {
        matchId: validResult.matchId,
        result: validResult,
        status: 'pending',
        attempts: 0,
        lastAttemptAt: null,
        error: null,
        permanentFailure: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [...entries, newEntry];
      writeEntries(updated);
      notify();
      return newEntry;
    },

    updateEntry(matchId: string, patch: Partial<Omit<OutboxEntry, 'matchId' | 'result'>>): OutboxEntry | undefined {
      const entries = readEntries();
      const idx = entries.findIndex(e => e.matchId === matchId);
      if (idx === -1) return undefined;

      const current = entries[idx]!;
      const updatedEntry: OutboxEntry = {
        ...current,
        ...patch,
        matchId: current.matchId,
        result: current.result,
      };

      const next = [...entries];
      next[idx] = updatedEntry;
      writeEntries(next);
      notify();
      return updatedEntry;
    },

    remove(matchId: string): boolean {
      const entries = readEntries();
      const filtered = entries.filter(e => e.matchId !== matchId);
      if (filtered.length === entries.length) return false;

      writeEntries(filtered);
      notify();
      return true;
    },

    clear(): void {
      writeEntries([]);
      memoryEntries = [];
      cachedEntries = [];
      cachedRaw = null;
      notify();
    },

    isMemoryFallback(): boolean {
      return isMemoryOnly;
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const outboxStore = createOutboxStore();
