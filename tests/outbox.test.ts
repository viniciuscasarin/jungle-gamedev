import { describe, it, expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { createOutboxStore } from '../src/data/outboxStore';
import { createOutboxService } from '../src/data/outboxService';
import { server } from '../src/mocks/server';
import { confirmedMatchesStore } from '../src/mocks/store';
import { DEFAULT_CONFIG } from '../src/domain/config';
import { DEFAULT_CONFIGURATION_KEY } from '../src/mocks/fixtures';
import type { CompletedMatchResult } from '../src/domain/result';
import { ConflictError, ValidationError, ApiError } from '../src/data/contracts';
import { LOCAL_KEYS } from '../src/storage/local';
import legacyFixture from './fixtures/finite-result-v2.json';
import { validateCompletedResult } from '../src/domain/result';
import { createApiClient } from '../src/data/client';

describe('Result Outbox Pattern and Dispatcher', () => {
  const createSampleResult = (id: string, score = 10): CompletedMatchResult => ({
    matchId: id,
    playerId: 'captain-player-1',
    playerName: 'Captain Morgan',
    completedAt: '2026-10-28T12:00:00.000Z',
    score,
    activeDurationMs: DEFAULT_CONFIG.options.sessionDurationMs,
    endReason: 'time_expired',
    configuration: DEFAULT_CONFIG,
    configurationKey: DEFAULT_CONFIGURATION_KEY,
    seed: 12345,
  });

  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    confirmedMatchesStore.reset();
  });

  afterAll(() => {
    server.close();
  });

  describe('OutboxStore persistence and operations', () => {
    it('rehydrates and dispatches a pending literal finite result through the unchanged REST envelope', async () => {
      const result = validateCompletedResult(legacyFixture);
      const memory = new Map<string, string>([[LOCAL_KEYS.outbox, JSON.stringify({ version: 1, data: [{ matchId: result.matchId, result, status: 'pending', attempts: 0, lastAttemptAt: null, error: null, permanentFailure: false, createdAt: result.completedAt }] })]]);
      const store = createOutboxStore(() => ({ getItem: k => memory.get(k) ?? null, setItem: (k, v) => { memory.set(k, v); } } as Storage));
      expect(store.getEntries()[0]?.result).toEqual(result);
      const api = createApiClient();
      const service = createOutboxService({ store, postMatch: api.postMatch });
      expect(await service.dispatchEntry(result.matchId)).toEqual(result);
      expect(store.getEntry(result.matchId)).toBeUndefined(); // confirmed delivery consumes the pending entry
      service.dispose();
      expect((await api.getRanking({ configurationKey: result.configurationKey })).items).toContainEqual(result);
      expect((await api.getPlayerMatches(result.playerId)).items).toContainEqual(result);
    });
    it('enqueues match results atomically and preserves them', () => {
      const memory: Record<string, string> = {};
      const fakeStorage: Storage = {
        getItem: (k: string) => memory[k] ?? null,
        setItem: (k: string, v: string) => { memory[k] = v; },
        removeItem: (k: string) => { delete memory[k]; },
        clear: () => { for (const k of Object.keys(memory)) delete memory[k]; },
        key: (i: number) => Object.keys(memory)[i] ?? null,
        get length() { return Object.keys(memory).length; },
      };

      const store = createOutboxStore(() => fakeStorage);
      const match = createSampleResult('match-outbox-1');

      const entry = store.enqueue(match);
      expect(entry.matchId).toBe('match-outbox-1');
      expect(entry.status).toBe('pending');
      expect(entry.attempts).toBe(0);
      expect(entry.permanentFailure).toBe(false);

      // Verify raw storage content
      const raw = fakeStorage.getItem(LOCAL_KEYS.outbox);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toMatchObject({
        version: 1,
        data: [{ matchId: 'match-outbox-1', status: 'pending' }],
      });

      // Rehydrate in a new store instance (simulating refresh)
      const storeRehydrated = createOutboxStore(() => fakeStorage);
      const entries = storeRehydrated.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.matchId).toBe('match-outbox-1');
      expect(entries[0]?.result.score).toBe(10);
    });

    it('enqueue is idempotent: returns existing entry without duplicating', () => {
      const memory: Record<string, string> = {};
      const fakeStorage: Storage = {
        getItem: (k: string) => memory[k] ?? null,
        setItem: (k: string, v: string) => { memory[k] = v; },
        removeItem: (k: string) => { delete memory[k]; },
        clear: () => { for (const k of Object.keys(memory)) delete memory[k]; },
        key: (i: number) => Object.keys(memory)[i] ?? null,
        get length() { return Object.keys(memory).length; },
      };

      const store = createOutboxStore(() => fakeStorage);
      const match = createSampleResult('match-idempotent-store');

      store.enqueue(match);
      store.updateEntry(match.matchId, { attempts: 2, status: 'failed' });

      const second = store.enqueue(match);
      expect(second.attempts).toBe(2);
      expect(second.status).toBe('failed');
      expect(store.getEntries()).toHaveLength(1);
    });

    it('falls back seamlessly to in-memory store when storage access throws', () => {
      const failingStorage: Storage = {
        getItem: () => { throw new Error('QuotaExceededError'); },
        setItem: () => { throw new Error('QuotaExceededError'); },
        removeItem: () => { throw new Error('QuotaExceededError'); },
        clear: () => { throw new Error('QuotaExceededError'); },
        key: () => null,
        length: 0,
      };

      const store = createOutboxStore(() => failingStorage);
      const match = createSampleResult('match-fallback-1');

      expect(() => {
        const entry = store.enqueue(match);
        expect(entry.matchId).toBe('match-fallback-1');
      }).not.toThrow();

      expect(store.isMemoryFallback()).toBe(true);
      expect(store.getEntries()).toHaveLength(1);
      expect(store.getEntry('match-fallback-1')).toBeDefined();

      store.remove('match-fallback-1');
      expect(store.getEntries()).toHaveLength(0);
    });
  });

  describe('OutboxService delivery and lifecycle', () => {
    it('dispatches pending result and removes from outbox only on confirmation (HTTP 200/201)', async () => {
      const store = createOutboxStore();
      const match = createSampleResult('match-dispatch-success');
      store.enqueue(match);

      expect(store.getEntries()).toHaveLength(1);

      const service = createOutboxService({ store });
      const confirmed = await service.dispatchEntry('match-dispatch-success');

      expect(confirmed).toBeDefined();
      expect(confirmed?.matchId).toBe('match-dispatch-success');
      // Must be removed from outbox after confirmed delivery
      expect(store.getEntries()).toHaveLength(0);
    });

    it('maintains independent queues for multiple matches', async () => {
      const store = createOutboxStore();
      const match1 = createSampleResult('match-indep-1', 20);
      const match2 = createSampleResult('match-indep-2', 40);

      store.enqueue(match1);
      store.enqueue(match2);

      expect(store.getEntries()).toHaveLength(2);

      // Post match1 only
      const service = createOutboxService({ store });
      await service.dispatchEntry('match-indep-1');

      // match1 removed, match2 still in outbox
      expect(store.getEntry('match-indep-1')).toBeUndefined();
      expect(store.getEntry('match-indep-2')).toBeDefined();
      expect(store.getEntries()).toHaveLength(1);

      // Now dispatch all
      await service.dispatchAllPending();
      expect(store.getEntries()).toHaveLength(0);
    });

    it('performs exponential backoff up to 3 attempts on transient network failures and transitions to failed', async () => {
      const store = createOutboxStore();
      const match = createSampleResult('match-transient-fail');
      store.enqueue(match);

      let attemptsCount = 0;
      const failingPost = vi.fn().mockImplementation(async () => {
        attemptsCount++;
        throw new ApiError(0, 'NETWORK_ERROR', 'Network connection unavailable');
      });

      // Use fake timers or fast backoffBaseMs
      const scheduledDelays: number[] = [];
      const service = createOutboxService({
        store,
        postMatch: failingPost,
        maxAttempts: 3,
        backoffBaseMs: 100,
        scheduleTimer: (fn, ms) => {
          scheduledDelays.push(ms);
          // execute immediately for test determinism
          setTimeout(fn, 1);
          return 1;
        },
      });

      await service.dispatchEntry('match-transient-fail');
      expect(attemptsCount).toBe(1);

      // Wait for the scheduled retries to run (adjusted tolerance to 450ms for CPU load resilience)
      await new Promise(r => setTimeout(r, 450));

      const entry = store.getEntry('match-transient-fail');
      expect(entry).toBeDefined();
      expect(entry?.attempts).toBe(3);
      expect(entry?.status).toBe('failed');
      expect(entry?.permanentFailure).toBe(false);
      expect(entry?.errorCategory).toBe('network');

      // Scheduled backoffs: first retry after attempt 1: 100 * 2^0 = 100ms; second retry after attempt 2: 100 * 2^1 = 200ms
      expect(scheduledDelays).toEqual([100, 200]);
    });

    it('halts automatic retries immediately on HTTP 400 ValidationError without infinite loops', async () => {
      const store = createOutboxStore();
      const match = createSampleResult('match-validation-fail');
      store.enqueue(match);

      const failingPost = vi.fn().mockRejectedValue(new ValidationError('Invalid score value'));
      const scheduleTimer = vi.fn();

      const service = createOutboxService({
        store,
        postMatch: failingPost,
        scheduleTimer,
      });

      await service.dispatchEntry('match-validation-fail');

      expect(failingPost).toHaveBeenCalledTimes(1);
      expect(scheduleTimer).not.toHaveBeenCalled();

      const entry = store.getEntry('match-validation-fail');
      expect(entry?.status).toBe('failed');
      expect(entry?.permanentFailure).toBe(true);
      expect(entry?.errorCategory).toBe('validation');
      expect(entry?.error).toBe('Invalid score value');

      // Calling dispatchEntry again without force does not execute
      await service.dispatchEntry('match-validation-fail', false);
      expect(failingPost).toHaveBeenCalledTimes(1);
    });

    it('halts automatic retries immediately on HTTP 409 ConflictError without infinite loops', async () => {
      const store = createOutboxStore();
      const match = createSampleResult('match-conflict-fail');
      store.enqueue(match);

      const failingPost = vi.fn().mockRejectedValue(new ConflictError('Match ID already registered with divergent payload'));
      const scheduleTimer = vi.fn();

      const service = createOutboxService({
        store,
        postMatch: failingPost,
        scheduleTimer,
      });

      await service.dispatchEntry('match-conflict-fail');

      expect(failingPost).toHaveBeenCalledTimes(1);
      expect(scheduleTimer).not.toHaveBeenCalled();

      const entry = store.getEntry('match-conflict-fail');
      expect(entry?.status).toBe('failed');
      expect(entry?.permanentFailure).toBe(true);
      expect(entry?.errorCategory).toBe('conflict');
      expect(entry?.error).toContain('divergent payload');
    });

    it('recovers cleanly from post-commit network timeout via idempotent retry without duplicate records', async () => {
      const store = createOutboxStore();
      const match = createSampleResult('match-timeout-post-commit', 35);
      store.enqueue(match);

      // Simulate post-commit timeout:
      // First attempt: mock server commits the match to confirmedMatchesStore, but the client experiences a timeout error.
      let callIndex = 0;
      const timeoutPost = vi.fn().mockImplementation(async (payload: CompletedMatchResult) => {
        callIndex++;
        if (callIndex === 1) {
          // Server committed match behind the scenes
          confirmedMatchesStore.addMatch(payload);
          // But network dropped on response
          throw new ApiError(0, 'TIMEOUT', 'Request timed out waiting for server response');
        }
        // Second attempt: retries and receives 200 OK with the committed record
        const res = confirmedMatchesStore.addMatch(payload);
        return res.match;
      });

      const service = createOutboxService({
        store,
        postMatch: timeoutPost,
        maxAttempts: 3,
        backoffBaseMs: 10,
        scheduleTimer: (fn) => { setTimeout(fn, 1); return 1; },
      });

      await service.dispatchEntry('match-timeout-post-commit');

      // Allow the scheduled retry to fire
      await new Promise(r => setTimeout(r, 20));

      // After retry, outbox is cleared
      expect(store.getEntries()).toHaveLength(0);

      // Confirmed store has exactly 1 entry for this matchId
      const matches = confirmedMatchesStore.getAll().filter(m => m.matchId === 'match-timeout-post-commit');
      expect(matches).toHaveLength(1);
      expect(matches[0]?.score).toBe(35);
    });
  });
});
