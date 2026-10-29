import type { QueryClient } from '@tanstack/react-query';
import type { CompletedMatchResult } from '../domain/result';
import { postMatch as defaultPostMatch } from './client';
import { ApiError, ConflictError, ValidationError } from './contracts';
import type { OutboxEntry, OutboxErrorCategory, OutboxStatus } from './contracts';
import { outboxStore as defaultOutboxStore, type OutboxStore } from './outboxStore';
import { queryClient as defaultQueryClient } from './queryClient';

export interface OutboxServiceOptions {
  store?: OutboxStore;
  postMatch?: (result: CompletedMatchResult) => Promise<CompletedMatchResult>;
  queryClient?: QueryClient;
  maxAttempts?: number;
  backoffBaseMs?: number;
  scheduleTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (timerId: unknown) => void;
}

export function createOutboxService(options?: OutboxServiceOptions) {
  const store = options?.store ?? defaultOutboxStore;
  const postMatchFn = options?.postMatch ?? defaultPostMatch;
  const qClient = options?.queryClient ?? defaultQueryClient;
  const maxAttempts = options?.maxAttempts ?? 3;
  const backoffBaseMs = options?.backoffBaseMs ?? 1000;
  const scheduleTimer = options?.scheduleTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options?.clearTimer ?? (id => clearTimeout(id as ReturnType<typeof setTimeout>));

  const inFlightPromises = new Map<string, Promise<CompletedMatchResult | null>>();
  const scheduledTimers = new Map<string, unknown>();

  function cancelScheduled(matchId: string) {
    const timer = scheduledTimers.get(matchId);
    if (timer !== undefined) {
      clearTimer(timer);
      scheduledTimers.delete(matchId);
    }
  }

  function categorizeError(error: unknown): { category: OutboxErrorCategory; message: string; permanent: boolean } {
    if (error instanceof ValidationError) {
      return { category: 'validation', message: error.message, permanent: true };
    }
    if (error instanceof ConflictError) {
      return { category: 'conflict', message: error.message, permanent: true };
    }
    if (error instanceof ApiError) {
      if (error.status === 400) {
        return { category: 'validation', message: error.message, permanent: true };
      }
      if (error.status === 409) {
        return { category: 'conflict', message: error.message, permanent: true };
      }
      if (error.code === 'NETWORK_ERROR' || error.status === 0) {
        return { category: 'network', message: error.message, permanent: false };
      }
      if (error.code === 'TIMEOUT' || error.message.toLowerCase().includes('timeout')) {
        return { category: 'timeout', message: error.message, permanent: false };
      }
      if (error.status >= 500) {
        return { category: 'server', message: error.message, permanent: false };
      }
      return { category: 'unknown', message: error.message, permanent: false };
    }
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.toLowerCase().includes('timeout')) {
        return { category: 'timeout', message: msg, permanent: false };
      }
      return { category: 'unknown', message: msg, permanent: false };
    }
    return { category: 'unknown', message: 'Unknown error occurred', permanent: false };
  }

  async function dispatchEntry(matchId: string, force = false): Promise<CompletedMatchResult | null> {
    cancelScheduled(matchId);

    const existingPromise = inFlightPromises.get(matchId);
    if (existingPromise) {
      return existingPromise;
    }

    const entry = store.getEntry(matchId);
    if (!entry) return null;

    if (!force && entry.permanentFailure) {
      return null;
    }

    const currentAttempts = force ? 0 : entry.attempts;
    const newAttempts = currentAttempts + 1;

    store.updateEntry(matchId, {
      status: 'recording',
      attempts: newAttempts,
      lastAttemptAt: new Date().toISOString(),
      permanentFailure: force ? false : entry.permanentFailure,
    });

    const execution = (async () => {
      try {
        const confirmed = await postMatchFn(entry.result);

        // Success: update to recorded and remove from outbox
        store.updateEntry(matchId, {
          status: 'recorded',
          error: null,
          errorCategory: undefined,
          permanentFailure: false,
        });
        store.remove(matchId);

        // Invalidate queries so that ranking and match history get fresh data
        try {
          void qClient?.invalidateQueries({ queryKey: ['ranking'] });
          void qClient?.invalidateQueries({ queryKey: ['history'] });
          void qClient?.invalidateQueries({ queryKey: ['playerMatches'] });
        } catch {
          // ignore query client errors in non-react environments
        }

        return confirmed;
      } catch (err) {
        const errorInfo = categorizeError(err);
        const shouldRetry = !errorInfo.permanent && newAttempts < maxAttempts;

        store.updateEntry(matchId, {
          status: 'failed',
          error: errorInfo.message,
          errorCategory: errorInfo.category,
          permanentFailure: errorInfo.permanent,
        });

        if (shouldRetry) {
          const delayMs = backoffBaseMs * Math.pow(2, newAttempts - 1);
          const timerId = scheduleTimer(() => {
            scheduledTimers.delete(matchId);
            void dispatchEntry(matchId, false);
          }, delayMs);
          scheduledTimers.set(matchId, timerId);
        }

        return null;
      } finally {
        inFlightPromises.delete(matchId);
      }
    })();

    inFlightPromises.set(matchId, execution);
    return execution;
  }

  async function dispatchAllPending(): Promise<void> {
    const entries = store.getEntries();
    const eligible = entries.filter(e => !e.permanentFailure && e.status !== 'recording');
    await Promise.all(eligible.map(e => dispatchEntry(e.matchId, false)));
  }

  function enqueueAndDispatch(result: CompletedMatchResult): OutboxEntry {
    const entry = store.enqueue(result);
    // Dispatch in background
    void dispatchEntry(entry.matchId, false);
    return entry;
  }

  function retry(matchId: string): Promise<CompletedMatchResult | null> {
    return dispatchEntry(matchId, true);
  }

  function getStatus(matchId: string): OutboxStatus | 'not_found' {
    const entry = store.getEntry(matchId);
    return entry ? entry.status : 'not_found';
  }

  function dispose() {
    for (const timer of scheduledTimers.values()) {
      clearTimer(timer);
    }
    scheduledTimers.clear();
    inFlightPromises.clear();
  }

  return {
    dispatchEntry,
    dispatchAllPending,
    enqueueAndDispatch,
    retry,
    getStatus,
    cancelScheduled,
    dispose,
  };
}

export const outboxService = createOutboxService();
