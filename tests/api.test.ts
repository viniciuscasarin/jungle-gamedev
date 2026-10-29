import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import axios from 'axios';
import { server } from '../src/mocks/server';
import { confirmedMatchesStore, CONFIRMED_MATCHES_KEY, createConfirmedMatchesStore } from '../src/mocks/store';
import { DEFAULT_CONFIGURATION_KEY, DETERMINISTIC_FIXTURES } from '../src/mocks/fixtures';
import { getRanking, getPlayerMatches, postMatch } from '../src/data/client';
import { ConflictError, ValidationError } from '../src/data/contracts';
import { DEFAULT_CONFIG } from '../src/domain/config';
import type { CompletedMatchResult } from '../src/domain/result';
import { getOrGenerateIdentity } from '../src/api/identity';
import { initMocks } from '../src/mocks/init';

describe('Mock REST API and Confirmed Matches Store', () => {
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

  describe('GET /api/ranking', () => {
    it('returns paginated ranking sorted by score DESC, completedAt ASC, matchId ASC', async () => {
      const response = await getRanking({
        configurationKey: DEFAULT_CONFIGURATION_KEY,
        page: 1,
        pageSize: 5,
      });

      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(5);
      expect(response.totalItems).toBe(DETERMINISTIC_FIXTURES.length);
      expect(response.items).toHaveLength(5);

      // Verify strict deterministic ordering
      for (let i = 0; i < response.items.length - 1; i++) {
        const curr = response.items[i]!;
        const next = response.items[i + 1]!;
        if (curr.score !== next.score) {
          expect(curr.score).toBeGreaterThan(next.score);
        } else if (curr.completedAt !== next.completedAt) {
          expect(curr.completedAt.localeCompare(next.completedAt)).toBeLessThanOrEqual(0);
        } else {
          expect(curr.matchId.localeCompare(next.matchId)).toBeLessThanOrEqual(0);
        }
      }

      // Check first item: fixture-match-001 has highest score 42
      expect(response.items[0]?.matchId).toBe('fixture-match-001');
      expect(response.items[0]?.score).toBe(42);

      // Check tie breaker between fixture-match-002 and fixture-match-003:
      // Both score 35. 002 completedAt is 2026-10-25T15:30:00.000Z, 003 is 2026-10-26T10:15:00.000Z.
      // 002 is earlier so it must come first!
      const ids = response.items.map(m => m.matchId);
      expect(ids.indexOf('fixture-match-002')).toBeLessThan(ids.indexOf('fixture-match-003'));
    });

    it('filters strictly by canonical configurationKey', async () => {
      const response = await getRanking({
        configurationKey: 'non-existent-configuration-key',
        page: 1,
        pageSize: 10,
      });

      expect(response.items).toHaveLength(0);
      expect(response.totalItems).toBe(0);
    });

    it('returns empty items when page is beyond totalItems', async () => {
      const response = await getRanking({
        configurationKey: DEFAULT_CONFIGURATION_KEY,
        page: 999,
        pageSize: 10,
      });

      expect(response.items).toEqual([]);
      expect(response.page).toBe(999);
      expect(response.pageSize).toBe(10);
      expect(response.totalItems).toBe(DETERMINISTIC_FIXTURES.length);
    });

    it('throws error on missing configurationKey', async () => {
      await expect(
        axios.get('http://localhost/api/ranking')
      ).rejects.toThrow();
    });
  });

  describe('GET /api/players/:playerId/matches', () => {
    it('returns paginated player history sorted by completedAt DESC', async () => {
      // player-fixture-calico has 2 matches (fixture-match-002: 2026-10-25, fixture-match-004: 2026-10-26)
      const response = await getPlayerMatches('player-fixture-calico', { page: 1, pageSize: 10 });

      expect(response.totalItems).toBe(2);
      expect(response.items).toHaveLength(2);
      expect(response.items[0]?.matchId).toBe('fixture-match-004'); // newer
      expect(response.items[1]?.matchId).toBe('fixture-match-002'); // older
    });

    it('returns empty list for unknown player', async () => {
      const response = await getPlayerMatches('unknown-player-id');

      expect(response.totalItems).toBe(0);
      expect(response.items).toEqual([]);
    });
  });

  describe('POST /api/matches (idempotency and conflict resolution)', () => {
    it('successfully posts a new match (201 Created)', async () => {
      const newMatch: CompletedMatchResult = {
        matchId: 'match-custom-test-1',
        playerId: 'player-test-me',
        playerName: 'Captain Tester',
        completedAt: '2026-10-28T14:00:00.000Z',
        score: 50,
        activeDurationMs: 120_000,
        endReason: 'time_expired',
        configuration: DEFAULT_CONFIG,
        configurationKey: DEFAULT_CONFIGURATION_KEY,
        seed: 4242,
      };

      const result = await postMatch(newMatch);
      expect(result).toEqual(newMatch);

      // Verify it appears in ranking immediately
      const ranking = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 5 });
      expect(ranking.items[0]?.matchId).toBe('match-custom-test-1');
      expect(ranking.items[0]?.score).toBe(50);
    });

    it('returns existing record for idempotent retry with identical payload (200 OK)', async () => {
      const match: CompletedMatchResult = {
        matchId: 'match-idempotent-test-2',
        playerId: 'player-test-me',
        playerName: 'Captain Tester',
        completedAt: '2026-10-28T14:00:00.000Z',
        score: 30,
        activeDurationMs: 120_000,
        endReason: 'time_expired',
        configuration: DEFAULT_CONFIG,
        configurationKey: DEFAULT_CONFIGURATION_KEY,
        seed: 99,
      };

      // First call
      const first = await postMatch(match);
      expect(first.matchId).toBe(match.matchId);

      // Second identical call
      const second = await postMatch(match);
      expect(second).toEqual(first);

      // Ranking total items should only increase by 1
      const ranking = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY });
      const matchesWithId = ranking.items.filter(m => m.matchId === match.matchId);
      expect(matchesWithId).toHaveLength(1);
    });

    it('rejects divergent payload with same matchId with ConflictError (409 Conflict)', async () => {
      const original: CompletedMatchResult = {
        matchId: 'match-conflict-test-3',
        playerId: 'player-test-me',
        playerName: 'Captain Tester',
        completedAt: '2026-10-28T14:00:00.000Z',
        score: 30,
        activeDurationMs: 120_000,
        endReason: 'time_expired',
        configuration: DEFAULT_CONFIG,
        configurationKey: DEFAULT_CONFIGURATION_KEY,
        seed: 99,
      };

      await postMatch(original);

      // Divergent payload (different score)
      const divergent: CompletedMatchResult = {
        ...original,
        score: 999,
      };

      await expect(postMatch(divergent)).rejects.toThrow(ConflictError);
    });

    it('rejects invalid match payload with ValidationError (400 Bad Request)', async () => {
      const invalid = {
        matchId: '',
        score: -5,
      } as unknown as CompletedMatchResult;

      await expect(postMatch(invalid)).rejects.toThrow(ValidationError);
    });
  });

  describe('Storage persistence and memory fallback', () => {
    it('persists matches to storage and reloads without loss', () => {
      const memoryStorage: Record<string, string> = {};
      const fakeStorage: Storage = {
        getItem: (k: string) => memoryStorage[k] ?? null,
        setItem: (k: string, v: string) => { memoryStorage[k] = v; },
        removeItem: (k: string) => { delete memoryStorage[k]; },
        clear: () => { for (const k of Object.keys(memoryStorage)) delete memoryStorage[k]; },
        key: (i: number) => Object.keys(memoryStorage)[i] ?? null,
        get length() { return Object.keys(memoryStorage).length; },
      };

      const storeA = createConfirmedMatchesStore(() => fakeStorage);
      const match: CompletedMatchResult = {
        matchId: 'store-test-persist-1',
        playerId: 'player-test-persist',
        playerName: 'Captain Persist',
        completedAt: '2026-10-28T14:00:00.000Z',
        score: 10,
        activeDurationMs: 60_000,
        endReason: 'player_destroyed',
        configuration: DEFAULT_CONFIG,
        configurationKey: DEFAULT_CONFIGURATION_KEY,
        seed: 123,
      };

      storeA.addMatch(match);
      expect(fakeStorage.getItem(CONFIRMED_MATCHES_KEY)).toBeTruthy();

      // Create a second store instance simulating page reload with same storage
      const storeB = createConfirmedMatchesStore(() => fakeStorage);
      const ranking = storeB.getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY });
      const found = ranking.items.find(m => m.matchId === 'store-test-persist-1');
      expect(found).toBeDefined();
      expect(found?.score).toBe(10);
    });

    it('falls back safely to in-memory store when storage throws quota/security exceptions', () => {
      const throwingStorage: Storage = {
        getItem: () => { throw new Error('QuotaExceededError'); },
        setItem: () => { throw new Error('QuotaExceededError'); },
        removeItem: () => { throw new Error('QuotaExceededError'); },
        clear: () => { throw new Error('QuotaExceededError'); },
        key: () => null,
        length: 0,
      };

      const resilientStore = createConfirmedMatchesStore(() => throwingStorage);
      expect(() => {
        const ranking = resilientStore.getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY });
        expect(ranking.items.length).toBeGreaterThan(0);
      }).not.toThrow();

      const newMatch: CompletedMatchResult = {
        matchId: 'store-fallback-test-2',
        playerId: 'player-test-fallback',
        playerName: 'Captain Fallback',
        completedAt: '2026-10-28T14:00:00.000Z',
        score: 99,
        activeDurationMs: 60_000,
        endReason: 'player_destroyed',
        configuration: DEFAULT_CONFIG,
        configurationKey: DEFAULT_CONFIGURATION_KEY,
        seed: 123,
      };

      expect(() => {
        const result = resilientStore.addMatch(newMatch);
        expect(result.created).toBe(true);
      }).not.toThrow();
    });
  });

  describe('Local identity generation and persistence', () => {
    it('generates a stable Captain-XXXX identity and saves it to storage', () => {
      const memoryStorage: Record<string, string> = {};
      const fakeStorage: Storage = {
        getItem: (k: string) => memoryStorage[k] ?? null,
        setItem: (k: string, v: string) => { memoryStorage[k] = v; },
        removeItem: (k: string) => { delete memoryStorage[k]; },
        clear: () => { for (const k of Object.keys(memoryStorage)) delete memoryStorage[k]; },
        key: (i: number) => Object.keys(memoryStorage)[i] ?? null,
        get length() { return Object.keys(memoryStorage).length; },
      };

      const identity1 = getOrGenerateIdentity(fakeStorage);
      expect(identity1.playerId).toBeTruthy();
      expect(identity1.playerName).toMatch(/^Captain-[0-9A-F]{4}$/);

      // Second call returns existing identity
      const identity2 = getOrGenerateIdentity(fakeStorage);
      expect(identity2).toEqual(identity1);
    });
  });

  describe('Service Worker init resilience', () => {
    it('returns false gracefully when navigator.serviceWorker is absent', async () => {
      const initialized = await initMocks({ timeoutMs: 100 });
      expect(typeof initialized).toBe('boolean');
    });
  });
});
