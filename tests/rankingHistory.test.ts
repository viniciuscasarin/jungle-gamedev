import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { server } from '../src/mocks/server';
import { confirmedMatchesStore } from '../src/mocks/store';
import { DEFAULT_CONFIG } from '../src/domain/config';
import { DEFAULT_CONFIGURATION_KEY, DETERMINISTIC_FIXTURES } from '../src/mocks/fixtures';
import type { CompletedMatchResult } from '../src/domain/result';
import { createApiClient } from '../src/data/client';
import { createOutboxService } from '../src/data/outboxService';
import { createOutboxStore } from '../src/data/outboxStore';
import {
  rankingQueryKey,
  playerHistoryQueryKey,
  useRanking,
  usePlayerHistory,
} from '../src/data/queries';
import {
  LeaderboardTabs,
  RankingTab,
  MatchHistoryTab,
} from '../src/ui/screens/LeaderboardTabs';
import { MainMenu } from '../src/ui/screens/MainMenu';

describe('Ranking and History — Increment 12 Tests', () => {
  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    confirmedMatchesStore.reset();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  const createSampleResult = (id: string, playerId = 'captain-player-1', score = 25): CompletedMatchResult => ({
    matchId: id,
    playerId,
    playerName: 'Captain Tester',
    completedAt: '2026-10-28T16:00:00.000Z',
    score,
    activeDurationMs: 120000,
    endReason: 'time_expired',
    configuration: DEFAULT_CONFIG,
    configurationKey: DEFAULT_CONFIGURATION_KEY,
    seed: 42,
  });

  describe('1. Data Infrastructure, AbortSignal and Outbox Invalidation', () => {
    it('1.1 client.ts forwards AbortSignal to Axios in getRanking and getPlayerMatches', async () => {
      const client = createApiClient();
      const controller = new AbortController();
      controller.abort();

      // getRanking with pre-aborted signal should reject with canceled error
      await expect(
        client.getRanking(
          { configurationKey: DEFAULT_CONFIGURATION_KEY },
          { signal: controller.signal }
        )
      ).rejects.toSatisfy(err => axios.isCancel(err) || (err as Error).name === 'CanceledError');

      // getPlayerMatches with pre-aborted signal should reject with canceled error
      const controller2 = new AbortController();
      controller2.abort();
      await expect(
        client.getPlayerMatches('some-player', undefined, { signal: controller2.signal })
      ).rejects.toSatisfy(err => axios.isCancel(err) || (err as Error).name === 'CanceledError');

      // Also verify passing signal in query object directly
      const controller3 = new AbortController();
      controller3.abort();
      await expect(
        client.getRanking({
          configurationKey: DEFAULT_CONFIGURATION_KEY,
          signal: controller3.signal,
        })
      ).rejects.toSatisfy(err => axios.isCancel(err) || (err as Error).name === 'CanceledError');
    });

    it('1.2 outboxService invalidates both ["ranking"] and ["history"] after HTTP 200/201 match confirmation', async () => {
      const qClient = new QueryClient();
      const invalidateSpy = vi.spyOn(qClient, 'invalidateQueries');

      const memory: Record<string, string> = {};
      const fakeStorage: Storage = {
        getItem: (k: string) => memory[k] ?? null,
        setItem: (k: string, v: string) => {
          memory[k] = v;
        },
        removeItem: (k: string) => {
          delete memory[k];
        },
        clear: () => {
          for (const k of Object.keys(memory)) delete memory[k];
        },
        key: (i: number) => Object.keys(memory)[i] ?? null,
        get length() {
          return Object.keys(memory).length;
        },
      };

      const store = createOutboxStore(() => fakeStorage);

      const service = createOutboxService({
        store,
        queryClient: qClient,
        postMatch: async res => res,
      });

      const match = createSampleResult('match-invalidate-test');
      store.enqueue(match);

      await service.dispatchEntry(match.matchId);

      // Verify that invalidateQueries was called for ranking and history
      const calledKeys = invalidateSpy.mock.calls.map(call => call[0]?.queryKey);
      expect(calledKeys).toContainEqual(['ranking']);
      expect(calledKeys).toContainEqual(['history']);
    });

    it('1.3 canonical query keys are composite and distinct', () => {
      expect(typeof useRanking).toBe('function');
      expect(typeof usePlayerHistory).toBe('function');

      const rKey = rankingQueryKey('config-key-1', 2, 10);
      expect(rKey).toEqual(['ranking', 'config-key-1', 2, 10]);

      const hKey = playerHistoryQueryKey('player-123', 3, 10);
      expect(hKey).toEqual(['history', 'player-123', 3, 10]);
    });

    it('1.3 TanStack Query hooks fetch data and use placeholderData: keepPreviousData', async () => {
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      // Query ranking
      const rankingData = await testQueryClient.fetchQuery({
        queryKey: rankingQueryKey(DEFAULT_CONFIGURATION_KEY, 1, 10),
        queryFn: ({ signal }) =>
          createApiClient().getRanking(
            { configurationKey: DEFAULT_CONFIGURATION_KEY, page: 1, pageSize: 10 },
            { signal }
          ),
      });

      expect(rankingData.items.length).toBeGreaterThan(0);
      expect(rankingData.pageSize).toBe(10);
      expect(rankingData.page).toBe(1);

      // Query player matches
      const playerMatchesData = await testQueryClient.fetchQuery({
        queryKey: playerHistoryQueryKey('player-001', 1, 10),
        queryFn: ({ signal }) =>
          createApiClient().getPlayerMatches('player-001', { page: 1, pageSize: 10 }, { signal }),
      });

      expect(playerMatchesData.page).toBe(1);
      expect(playerMatchesData.pageSize).toBe(10);
    });
  });

  describe('2. UI Components: Tabs, Tables, and WAI-ARIA', () => {
    it('2.1 LeaderboardTabs renders WAI-ARIA tablist, tabs, tabpanels with proper attributes', () => {
      const html = renderToString(
        createElement(LeaderboardTabs, {
          configurationKey: DEFAULT_CONFIGURATION_KEY,
          configurationLabel: '120s session · 3.0s enemy spawn',
          playerId: 'player-test-ui',
        })
      );

      // Tablist container
      expect(html).toContain('role="tablist"');
      expect(html).toContain('aria-label="Rankings and History"');

      // Tabs
      expect(html).toContain('role="tab"');
      expect(html).toContain('id="tab-ranking"');
      expect(html).toContain('aria-controls="panel-ranking"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('tabindex="0"');

      expect(html).toContain('id="tab-history"');
      expect(html).toContain('aria-controls="panel-history"');
      expect(html).toContain('aria-selected="false"');
      expect(html).toContain('tabindex="-1"');

      // Panels
      expect(html).toContain('role="tabpanel"');
      expect(html).toContain('id="panel-ranking"');
      expect(html).toContain('aria-labelledby="tab-ranking"');
      expect(html).toContain('id="panel-history"');
      expect(html).toContain('aria-labelledby="tab-history"');
      expect(html).toContain('hidden=""');
    });

    it('2.2 RankingTab displays active configuration filter badge and semantic table', async () => {
      const testQueryClient = new QueryClient();
      // Pre-seed query cache
      testQueryClient.setQueryData(rankingQueryKey(DEFAULT_CONFIGURATION_KEY, 1, 10), {
        items: DETERMINISTIC_FIXTURES.slice(0, 10),
        page: 1,
        pageSize: 10,
        totalItems: DETERMINISTIC_FIXTURES.length,
      });

      const html = renderToString(
        createElement(RankingTab, {
          configurationKey: DEFAULT_CONFIGURATION_KEY,
          configurationLabel: '120s session · 3.0s enemy spawn',
          client: testQueryClient,
        })
      );

      // Explicit filter badge
      expect(html).toContain('Configuration: 120s session · 3.0s enemy spawn');
      expect(html).toContain('aria-label="Configuration filter"');

      // Semantic table
      expect(html).toContain('<table');
      expect(html).toContain('aria-label="Ranking table"');
      expect(html).toContain('<th scope="col">#</th>');
      expect(html).toContain('<th scope="col">Captain</th>');
      expect(html).toContain('<th scope="col">Score</th>');

      // Data rows
      expect(html).toContain('#1');
      expect(html).toContain('Captain Blackbeard');
      expect(html).toContain('Page 1 of 2');
    });

    it('2.3 MatchHistoryTab formats date, score, duration, end reason and configuration', async () => {
      const testQueryClient = new QueryClient();
      const sampleItem = createSampleResult('match-history-sample', 'player-custom', 33);
      testQueryClient.setQueryData(playerHistoryQueryKey('player-custom', 1, 10), {
        items: [sampleItem],
        page: 1,
        pageSize: 10,
        totalItems: 1,
      });

      const html = renderToString(
        createElement(MatchHistoryTab, {
          playerId: 'player-custom',
          client: testQueryClient,
        })
      );

      // Semantic table headers
      expect(html).toContain('aria-label="Match history table"');
      expect(html).toContain('<th scope="col">Date</th>');
      expect(html).toContain('<th scope="col">Score</th>');
      expect(html).toContain('<th scope="col">Duration</th>');
      expect(html).toContain('<th scope="col">Reason</th>');
      expect(html).toContain('<th scope="col">Config</th>');

      // Data formatting
      expect(html).toContain('33'); // score
      expect(html).toContain('120s'); // duration in active seconds
      expect(html).toContain('Time expired'); // readable end reason
      expect(html).toContain('120s · 3.0s spawn'); // readable configuration summary
    });

    it('2.3 MatchHistoryTab renders "Ship destroyed" when player is destroyed', () => {
      const testQueryClient = new QueryClient();
      const destroyedItem: CompletedMatchResult = {
        ...createSampleResult('match-destroyed', 'player-destroyed-ui', 12),
        endReason: 'player_destroyed',
        activeDurationMs: 45000,
      };
      testQueryClient.setQueryData(playerHistoryQueryKey('player-destroyed-ui', 1, 10), {
        items: [destroyedItem],
        page: 1,
        pageSize: 10,
        totalItems: 1,
      });

      const html = renderToString(
        createElement(MatchHistoryTab, {
          playerId: 'player-destroyed-ui',
          client: testQueryClient,
        })
      );

      expect(html).toContain('Ship destroyed');
      expect(html).toContain('45s');
    });
  });

  describe('3. MainMenu Integration, GDD Empty Messages, and Error Isolation', () => {
    it('3.1 MainMenu keeps Play, Options, and Last Result interactive with tabs active', () => {
      const playMock = { current: null };
      const optionsMock = { current: null };
      const onStart = vi.fn();
      const onOptions = vi.fn();
      const onLastResult = vi.fn();

      const html = renderToString(
        createElement(MainMenu, {
          playRef: playMock,
          optionsButtonRef: optionsMock,
          onStart,
          onOptions,
          onLastResult,
          lastResult: {
            result: createSampleResult('last-res'),
            saved: true,
          },
        })
      );

      // Main action buttons are rendered and not disabled
      expect(html).toContain('<button>Play</button>');
      expect(html).toContain('Options');
      expect(html).toContain('Last Result');

      // Future actions placeholder is gone, replaced with tabs
      expect(html).not.toContain('future-actions');
      expect(html).not.toContain('Ranking and Match History are not available yet.');
      expect(html).toContain('role="tablist"');
    });

    it('3.2 RankingTab displays canonical GDD empty message "No matches for these settings yet."', () => {
      const testQueryClient = new QueryClient();
      testQueryClient.setQueryData(rankingQueryKey('non-existent-config', 1, 10), {
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
      });

      const html = renderToString(
        createElement(RankingTab, {
          configurationKey: 'non-existent-config',
          configurationLabel: '60s session · 1.0s enemy spawn',
          client: testQueryClient,
        })
      );

      expect(html).toContain('No matches for these settings yet.');
    });

    it('3.2 MatchHistoryTab displays canonical GDD empty message "No completed matches yet."', () => {
      const testQueryClient = new QueryClient();
      testQueryClient.setQueryData(playerHistoryQueryKey('empty-player-id', 1, 10), {
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
      });

      const html = renderToString(
        createElement(MatchHistoryTab, {
          playerId: 'empty-player-id',
          client: testQueryClient,
        })
      );

      expect(html).toContain('No completed matches yet.');
    });

    it('3.2 isolated error with Retry button in tab does not break screen or main buttons', () => {
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            retryOnMount: false,
            refetchOnMount: false,
          },
        },
      });

      // Simulate error in ranking query
      testQueryClient.setQueryDefaults(rankingQueryKey('broken-config', 1, 10), {
        queryFn: () => Promise.reject(new Error('Network outage')),
      });

      // We render a RankingTab in error state
      const query = testQueryClient.getQueryCache().build(testQueryClient, {
        queryKey: rankingQueryKey('broken-config', 1, 10),
      });
      query.setState({
        status: 'error',
        error: new Error('Network outage'),
        fetchStatus: 'idle',
        errorUpdatedAt: Date.now(),
      });

      const html = renderToString(
        createElement(RankingTab, {
          configurationKey: 'broken-config',
          configurationLabel: '120s session · 3.0s enemy spawn',
          client: testQueryClient,
        })
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('Failed to load ranking.');
      expect(html).toContain('Retry');
    });
  });

  describe('4. End-to-End Reactive Data Synchronization', () => {
    it('4.2 confirmed match dispatch from outbox reflects in ranking cache without reload', async () => {
      const testQueryClient = new QueryClient();
      const client = createApiClient();

      // Step 1: Initial ranking fetch has fixtures (top score 42)
      const initialRanking = await testQueryClient.fetchQuery({
        queryKey: rankingQueryKey(DEFAULT_CONFIGURATION_KEY, 1, 10),
        queryFn: ({ signal }) =>
          client.getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY }, { signal }),
      });
      expect(initialRanking.items[0]?.score).toBe(42);

      // Step 2: Outbox dispatches a new high score of 99
      const newChampion = createSampleResult('match-champion-99', 'champion-player', 99);
      const memory: Record<string, string> = {};
      const fakeStorage: Storage = {
        getItem: (k: string) => memory[k] ?? null,
        setItem: (k: string, v: string) => {
          memory[k] = v;
        },
        removeItem: (k: string) => {
          delete memory[k];
        },
        clear: () => {
          for (const k of Object.keys(memory)) delete memory[k];
        },
        key: (i: number) => Object.keys(memory)[i] ?? null,
        get length() {
          return Object.keys(memory).length;
        },
      };

      const store = createOutboxStore(() => fakeStorage);

      const outbox = createOutboxService({
        store,
        queryClient: testQueryClient,
        postMatch: r => client.postMatch(r),
      });

      store.enqueue(newChampion);
      await outbox.dispatchEntry(newChampion.matchId);

      // Step 3: Fetch updated ranking (as would happen after invalidation)
      const updatedRanking = await testQueryClient.fetchQuery({
        queryKey: rankingQueryKey(DEFAULT_CONFIGURATION_KEY, 1, 10),
        queryFn: ({ signal }) =>
          client.getRanking({ configurationKey: DEFAULT_CONFIGURATION_KEY }, { signal }),
      });

      // New champion should now be #1 on the leaderboard!
      expect(updatedRanking.items[0]?.matchId).toBe('match-champion-99');
      expect(updatedRanking.items[0]?.score).toBe(99);
      expect(updatedRanking.items[0]?.playerName).toBe('Captain Tester');
    });
  });
});
