import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { server } from '../src/mocks/server';
import {
  NETWORK_SCENARIOS,
  NETWORK_SCENARIO_STORAGE_KEY,
  getNetworkScenario,
  setNetworkScenario,
  clearNetworkScenario,
  onScenarioChange,
  resetMockData,
  configureScenarioDelays,
  handleTemporaryOutage,
  resetTransientScenarioState,
  type NetworkScenarioId,
} from '../src/mocks/scenarios';
import { confirmedMatchesStore, CONFIRMED_MATCHES_KEY } from '../src/mocks/store';
import { DETERMINISTIC_FIXTURES, DEFAULT_CONFIGURATION_KEY, MULTI_PAGE_FIXTURES } from '../src/mocks/fixtures';
import { createApiClient, getRanking, getPlayerMatches, postMatch } from '../src/data/client';
import { ValidationError } from '../src/data/contracts';
import { LOCAL_KEYS, AUDIO_KEYS } from '../src/storage/local';
import { DEFAULT_CONFIG } from '../src/domain/config';
import type { CompletedMatchResult } from '../src/domain/result';
import { createSimulation } from '../src/simulation/engine';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import { QueryClient } from '@tanstack/react-query';

describe('Network Scenarios Orchestrator and Simulation Decoupling', () => {
  const storageMap = new Map<string, string>();
  const fakeLocalStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, val: string) => {
      storageMap.set(key, String(val));
    },
    removeItem: (key: string) => {
      storageMap.delete(key);
    },
    clear: () => {
      storageMap.clear();
    },
    get length() {
      return storageMap.size;
    },
    key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  };

  const fakeWindow = {
    localStorage: fakeLocalStorage,
    location: { search: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
    // @ts-expect-error mocking window on global
    globalThis.window = fakeWindow;
    (globalThis as unknown as { localStorage: typeof fakeLocalStorage }).localStorage = fakeLocalStorage;
  });

  afterEach(() => {
    server.resetHandlers();
    clearNetworkScenario();
    confirmedMatchesStore.reset();
    resetTransientScenarioState();
    configureScenarioDelays(); // restore default delays
    storageMap.clear();
    fakeWindow.location.search = '';
    delete (fakeWindow as unknown as { __pbNetworkScenario?: unknown }).__pbNetworkScenario;
    delete (globalThis as unknown as { __pbNetworkScenario?: unknown }).__pbNetworkScenario;
    vi.restoreAllMocks();
  });

  afterAll(() => {
    server.close();
    // @ts-expect-error cleanup
    delete globalThis.window;
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  });

  const createSampleResult = (id: string, score = 10): CompletedMatchResult => ({
    matchId: id,
    playerId: 'captain-player-tester',
    playerName: 'Captain Tester',
    completedAt: '2026-10-28T18:00:00.000Z',
    score,
    activeDurationMs: DEFAULT_CONFIG.options.sessionDurationMs,
    endReason: 'time_expired',
    configuration: DEFAULT_CONFIG,
    configurationKey: DEFAULT_CONFIGURATION_KEY,
    seed: 55555,
  });

  describe('1. Scenario Catalogue and Types', () => {
    it('defines the 12 regulatory profiles with descriptions and names', () => {
      const expectedProfiles: NetworkScenarioId[] = [
        'default',
        'empty',
        'multi-page',
        'slow-jitter',
        'out-of-order',
        'timeout',
        'offline',
        'error-4xx',
        'error-5xx',
        'isolated-tab-failure',
        'commit-timeout',
        'temporary-outage',
      ];

      expect(NETWORK_SCENARIOS).toHaveLength(12);
      for (const expectedId of expectedProfiles) {
        const found = NETWORK_SCENARIOS.find(s => s.id === expectedId);
        expect(found, `Profile ${expectedId} should exist`).toBeDefined();
        expect(found?.name.length).toBeGreaterThan(0);
        expect(found?.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('2. Cascading Precedence Resolution', () => {
    it('prioritizes explicit request URL param over all other layers', () => {
      fakeLocalStorage.setItem(NETWORK_SCENARIO_STORAGE_KEY, 'empty');
      (fakeWindow as unknown as { __pbNetworkScenario?: string }).__pbNetworkScenario = 'error-5xx';

      const scenario = getNetworkScenario('http://localhost/api/ranking?networkScenario=slow-jitter');
      expect(scenario).toBe('slow-jitter');
    });

    it('prioritizes window.location.search when request URL has no param', () => {
      fakeWindow.location.search = '?networkScenario=timeout';
      fakeLocalStorage.setItem(NETWORK_SCENARIO_STORAGE_KEY, 'empty');

      const scenario = getNetworkScenario();
      expect(scenario).toBe('timeout');
    });

    it('resolves LocalStorage when no URL query is present', () => {
      fakeLocalStorage.setItem(NETWORK_SCENARIO_STORAGE_KEY, 'multi-page');
      (fakeWindow as unknown as { __pbNetworkScenario?: string }).__pbNetworkScenario = 'offline';

      const scenario = getNetworkScenario();
      expect(scenario).toBe('multi-page');
    });

    it('resolves window.__pbNetworkScenario when LocalStorage is empty', () => {
      fakeLocalStorage.removeItem(NETWORK_SCENARIO_STORAGE_KEY);
      (fakeWindow as unknown as { __pbNetworkScenario?: string }).__pbNetworkScenario = 'isolated-tab-failure';

      const scenario = getNetworkScenario();
      expect(scenario).toBe('isolated-tab-failure');
    });

    it('falls back to "default" when no source is present or value is invalid', () => {
      fakeLocalStorage.removeItem(NETWORK_SCENARIO_STORAGE_KEY);
      delete (fakeWindow as unknown as { __pbNetworkScenario?: string }).__pbNetworkScenario;

      expect(getNetworkScenario()).toBe('default');

      // Invalid scenario string
      fakeLocalStorage.setItem(NETWORK_SCENARIO_STORAGE_KEY, 'non-existent-scenario');
      expect(getNetworkScenario()).toBe('default');
    });

    it('dispatches notifications through onScenarioChange when setNetworkScenario is called', () => {
      const received: NetworkScenarioId[] = [];
      const unsubscribe = onScenarioChange(sc => received.push(sc));

      setNetworkScenario('error-4xx');
      setNetworkScenario('empty');
      unsubscribe();
      setNetworkScenario('default');

      expect(received).toEqual(['error-4xx', 'empty']);
    });
  });

  describe('3. Strict Reset Policy (resetMockData)', () => {
    it('restores canonical fixtures and clears transient scenario states', () => {
      // Add custom record
      confirmedMatchesStore.addMatch(createSampleResult('match-custom-1'));
      expect(confirmedMatchesStore.getAll().length).toBe(DETERMINISTIC_FIXTURES.length + 1);

      // Advance temporary outage
      handleTemporaryOutage();
      expect(handleTemporaryOutage().attempt).toBe(2);

      // Perform reset
      resetMockData();

      // Confirmed matches returned to canonical count
      expect(confirmedMatchesStore.getAll().length).toBe(DETERMINISTIC_FIXTURES.length);
      // Outage counter reset
      expect(handleTemporaryOutage().attempt).toBe(1);
    });

    it('inconditionally preserves options, identity, last-result, outbox and audio preference', () => {
      const memory: Record<string, string> = {
        [CONFIRMED_MATCHES_KEY]: JSON.stringify([{ matchId: 'to-be-reset' }]),
        [LOCAL_KEYS.options]: JSON.stringify({ version: 1, data: { sessionDurationMs: 90000 } }),
        [LOCAL_KEYS.identity]: JSON.stringify({ version: 1, data: { playerId: 'captain-fixed-id', playerName: 'Captain Preserved' } }),
        [LOCAL_KEYS.result]: JSON.stringify({ version: 1, data: { matchId: 'last-result-preserved', score: 99 } }),
        [LOCAL_KEYS.outbox]: JSON.stringify({ version: 1, data: [{ matchId: 'pending-outbox-match-1' }] }),
        [AUDIO_KEYS.soundMuted]: JSON.stringify({ version: 1, data: true }),
      };

      for (const [k, v] of Object.entries(memory)) {
        fakeLocalStorage.setItem(k, v);
      }

      resetMockData();

      // Confirmed matches was reset to canonical fixtures
      const confirmedRaw = fakeLocalStorage.getItem(CONFIRMED_MATCHES_KEY);
      expect(confirmedRaw).not.toBeNull();
      const confirmedParsed = JSON.parse(confirmedRaw!);
      expect(confirmedParsed.length).toBe(DETERMINISTIC_FIXTURES.length);

      // All other keys MUST be strictly intact
      expect(fakeLocalStorage.getItem(LOCAL_KEYS.options)).toBe(memory[LOCAL_KEYS.options]);
      expect(fakeLocalStorage.getItem(LOCAL_KEYS.identity)).toBe(memory[LOCAL_KEYS.identity]);
      expect(fakeLocalStorage.getItem(LOCAL_KEYS.result)).toBe(memory[LOCAL_KEYS.result]);
      expect(fakeLocalStorage.getItem(LOCAL_KEYS.outbox)).toBe(memory[LOCAL_KEYS.outbox]);
      expect(fakeLocalStorage.getItem(AUDIO_KEYS.soundMuted)).toBe(memory[AUDIO_KEYS.soundMuted]);
    });

    it('invalidates TanStack Query client caches on reset', () => {
      const qClient = new QueryClient();
      const invalidateSpy = vi.spyOn(qClient, 'invalidateQueries');

      resetMockData(qClient);

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ranking'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['history'] });
    });
  });

  describe('4. MSW Declarative Behavior for the 12 Regulatory Scenarios', () => {
    it('scenario "default": returns 200 OK with deterministic fixtures', async () => {
      setNetworkScenario('default');
      const response = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 10 });
      expect(response.totalItems).toBe(DETERMINISTIC_FIXTURES.length);
      expect(response.items[0]?.matchId).toBe('fixture-match-001');
    });

    it('scenario "empty": returns empty items and totalItems 0 for ranking and player history', async () => {
      setNetworkScenario('empty');

      const ranking = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 10 });
      expect(ranking.items).toEqual([]);
      expect(ranking.totalItems).toBe(0);

      const history = await getPlayerMatches('player-fixture-bonny');
      expect(history.items).toEqual([]);
      expect(history.totalItems).toBe(0);
    });

    it('scenario "multi-page": returns expanded dataset allowing 4 pages of navigation', async () => {
      setNetworkScenario('multi-page');

      expect(MULTI_PAGE_FIXTURES.length).toBeGreaterThanOrEqual(35);

      const page1 = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 10 });
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(10);
      expect(page1.totalItems).toBe(MULTI_PAGE_FIXTURES.length);
      expect(page1.items).toHaveLength(10);

      const page2 = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 2, pageSize: 10 });
      expect(page2.page).toBe(2);
      expect(page2.items).toHaveLength(10);
      expect(page2.items[0]?.matchId).not.toBe(page1.items[0]?.matchId);

      const page4 = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 4, pageSize: 10 });
      expect(page4.page).toBe(4);
      expect(page4.items.length).toBeGreaterThan(0);
    });

    it('scenario "slow-jitter": delays response with success', async () => {
      setNetworkScenario('slow-jitter');
      // Configure fast jitter delay for test speed
      configureScenarioDelays({ slowJitterMinMs: 25, slowJitterMaxMs: 35 });

      const start = Date.now();
      const response = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 5 });
      const elapsed = Date.now() - start;

      expect(response.items).toHaveLength(5);
      expect(elapsed).toBeGreaterThanOrEqual(20);
    });

    it('scenario "out-of-order": alternates delay between consecutive requests', async () => {
      setNetworkScenario('out-of-order');
      configureScenarioDelays({ outOfOrderSlowMs: 70, outOfOrderFastMs: 5 });

      const start1 = Date.now();
      await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 2 });
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 2 });
      const duration2 = Date.now() - start2;

      // 1st was odd (slow), 2nd was even (fast)
      expect(duration1).toBeGreaterThanOrEqual(50);
      expect(duration2).toBeLessThan(duration1);
    });

    it('scenario "timeout": triggers timeout error on the HTTP client', async () => {
      setNetworkScenario('timeout');
      configureScenarioDelays({ timeoutMs: 80 });

      const client = createApiClient({ timeout: 25 });
      await expect(client.getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY })).rejects.toThrow();
    });

    it('scenario "offline": rejects with network error immediately', async () => {
      setNetworkScenario('offline');

      await expect(getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY })).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });

    it('scenario "error-4xx": returns 400 Bad Request causing ValidationError', async () => {
      setNetworkScenario('error-4xx');

      await expect(postMatch(createSampleResult('match-4xx-test'))).rejects.toBeInstanceOf(ValidationError);
    });

    it('scenario "error-5xx": returns 500 Internal Server Error causing ApiError', async () => {
      setNetworkScenario('error-5xx');

      await expect(getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY })).rejects.toMatchObject({
        status: 500,
      });
    });

    it('scenario "isolated-tab-failure": ranking fails with 500 while player history succeeds with 200', async () => {
      setNetworkScenario('isolated-tab-failure');

      // Ranking must fail with 500
      await expect(getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY })).rejects.toMatchObject({
        status: 500,
      });

      // Player matches must succeed with 200 OK!
      const history = await getPlayerMatches('player-fixture-bonny');
      expect(history.items.length).toBeGreaterThan(0);
      expect(history.items[0]?.playerId).toBe('player-fixture-bonny');
    });

    it('scenario "commit-timeout": commits result to database but drops response, subsequent retry succeeds idempotently without duplicate', async () => {
      setNetworkScenario('commit-timeout');
      const sample = createSampleResult('match-commit-timeout-1');

      // 1st attempt: Post match -> commits to store, but drops response with network error
      await expect(postMatch(sample)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });

      // Assert match WAS written to store
      const allInStore = confirmedMatchesStore.getAll();
      const committed = allInStore.find(m => m.matchId === 'match-commit-timeout-1');
      expect(committed).toBeDefined();
      expect(committed?.score).toBe(sample.score);

      // 2nd attempt (outbox retry with same matchId): must succeed 200 OK and NOT duplicate
      const retryResult = await postMatch(sample);
      expect(retryResult.matchId).toBe(sample.matchId);

      const allAfterRetry = confirmedMatchesStore.getAll();
      const matchingCount = allAfterRetry.filter(m => m.matchId === 'match-commit-timeout-1').length;
      expect(matchingCount).toBe(1);
    });

    it('scenario "temporary-outage": first 2 requests fail, 3rd request succeeds with auto-recovery', async () => {
      setNetworkScenario('temporary-outage');

      // Request 1: fails
      await expect(getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY })).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });

      // Request 2: fails
      await expect(getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY })).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });

      // Request 3: succeeds!
      const success = await getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY });
      expect(success.items.length).toBeGreaterThan(0);
    });
  });

  describe('5. Arena Decoupling and Active Combat Preservation', () => {
    it('switching network scenarios or triggering mock data reset never affects active simulation state', () => {
      const sim = createSimulation({
        configuration: DEFAULT_CONFIG,
        seed: 42,
      });

      // Step simulation for 10 frames
      for (let i = 0; i < 10; i++) {
        sim.step(NEUTRAL_INPUT);
      }

      const snapshotBefore = sim.inspect();
      const scoreBefore = snapshotBefore.score;
      const playerHealthBefore = snapshotBefore.player.health;
      const activeTimeBefore = snapshotBefore.activeTimeMs;

      expect(activeTimeBefore).toBeGreaterThan(0);
      expect(scoreBefore).toBe(0);

      // 1. Switch network scenario to offline
      setNetworkScenario('offline');

      // Step 5 more frames
      for (let i = 0; i < 5; i++) {
        sim.step(NEUTRAL_INPUT);
      }

      const snapshotDuring = sim.inspect();
      expect(snapshotDuring.activeTimeMs).toBeGreaterThan(activeTimeBefore);
      expect(snapshotDuring.player.health).toBe(playerHealthBefore);

      // 2. Trigger resetMockData during active battle
      resetMockData();

      // Step 5 more frames
      for (let i = 0; i < 5; i++) {
        sim.step(NEUTRAL_INPUT);
      }

      const snapshotAfter = sim.inspect();
      // Simulation must continue progressing steadily without reset or stall
      expect(snapshotAfter.activeTimeMs).toBeGreaterThan(snapshotDuring.activeTimeMs);
      expect(snapshotAfter.player.health).toBe(playerHealthBefore);
      expect(snapshotAfter.state).toBe('playing');
    });
  });
});
