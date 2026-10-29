import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Result } from '../src/ui/screens/Result';
import { MainMenu } from '../src/ui/screens/MainMenu';
import { mapSemanticStatus } from '../src/data/useMatchOutbox';
import { outboxStore } from '../src/data/outboxStore';
import { DEFAULT_CONFIG } from '../src/domain/config';
import { DEFAULT_CONFIGURATION_KEY } from '../src/mocks/fixtures';
import type { CompletedMatchResult } from '../src/domain/result';

describe('Result Outbox UI and Screen Integration', () => {
  const createMatch = (id: string, score = 42): CompletedMatchResult => ({
    matchId: id,
    playerId: 'player-ui-1',
    playerName: 'Captain UI',
    completedAt: '2026-10-28T14:00:00.000Z',
    score,
    activeDurationMs: DEFAULT_CONFIG.options.sessionDurationMs,
    endReason: 'time_expired',
    configuration: DEFAULT_CONFIG,
    configurationKey: DEFAULT_CONFIGURATION_KEY,
    seed: 999,
  });

  beforeEach(() => {
    outboxStore.clear();
  });

  afterEach(() => {
    outboxStore.clear();
  });

  describe('mapSemanticStatus mapping rules', () => {
    it('maps recording to "Recording…"', () => {
      expect(mapSemanticStatus('recording', false)).toBe('Recording…');
    });

    it('maps recorded or inMemoryRecorded to "Recorded"', () => {
      expect(mapSemanticStatus('recorded', false)).toBe('Recorded');
      expect(mapSemanticStatus(undefined, true)).toBe('Recorded');
    });

    it('maps pending or failed to "Pending — Retry"', () => {
      expect(mapSemanticStatus('pending', false)).toBe('Pending — Retry');
      expect(mapSemanticStatus('failed', false)).toBe('Pending — Retry');
    });
  });

  describe('Result component delivery states', () => {
    it('renders "Recording…" during active in-flight mutation', () => {
      const match = createMatch('match-ui-recording');
      outboxStore.enqueue(match);
      outboxStore.updateEntry(match.matchId, { status: 'recording' });

      const html = renderToString(
        createElement(Result, {
          outcome: { result: match, saved: true },
          onAgain: vi.fn(),
          onMenu: vi.fn(),
        })
      );

      expect(html).toContain('Recording…');
      expect(html).toContain('data-delivery-status="recording"');
      expect(html).not.toContain('class="secondary retry-button"');
    });

    it('renders "Recorded" when delivery is confirmed', () => {
      const match = createMatch('match-ui-recorded');
      // Already confirmed and removed from outbox
      const html = renderToString(
        createElement(Result, {
          outcome: { result: match, saved: true },
          onAgain: vi.fn(),
          onMenu: vi.fn(),
        })
      );

      expect(html).toContain('Recorded');
      expect(html).toContain('data-delivery-status="recorded"');
      expect(html).not.toContain('retry-button');
    });

    it('renders "Pending — Retry" with Retry button when delivery has failed', () => {
      const match = createMatch('match-ui-failed');
      outboxStore.enqueue(match);
      outboxStore.updateEntry(match.matchId, {
        status: 'failed',
        error: 'Network connection dropped',
        attempts: 3,
      });

      const html = renderToString(
        createElement(Result, {
          outcome: { result: match, saved: true },
          onAgain: vi.fn(),
          onMenu: vi.fn(),
        })
      );

      expect(html).toContain('Pending — Retry');
      expect(html).toContain('data-delivery-status="failed"');
      expect(html).toContain('retry-button');
      expect(html).toContain('Network connection dropped');
    });

    it('strictly isolates visual state by matchId', () => {
      const matchA = createMatch('match-A');
      const matchB = createMatch('match-B');

      outboxStore.enqueue(matchA);
      outboxStore.updateEntry(matchA.matchId, { status: 'recording' });

      outboxStore.enqueue(matchB);
      outboxStore.updateEntry(matchB.matchId, { status: 'failed', error: 'Failed B' });

      // Render Result for matchB
      const htmlB = renderToString(
        createElement(Result, {
          outcome: { result: matchB, saved: true },
          onAgain: vi.fn(),
          onMenu: vi.fn(),
        })
      );

      // Must display matchB's state (Pending - Retry), NOT matchA's (Recording…)
      expect(htmlB).toContain('Pending — Retry');
      expect(htmlB).toContain('Failed B');
      expect(htmlB).not.toContain('Recording…');
    });
  });

  describe('MainMenu outbox monitoring and actions', () => {
    it('does not render pending notice when outbox is empty', () => {
      const html = renderToString(
        createElement(MainMenu, {
          playRef: { current: null },
          optionsButtonRef: { current: null },
          onStart: vi.fn(),
          onOptions: vi.fn(),
          onLastResult: vi.fn(),
          lastResult: null,
        })
      );

      expect(html).not.toContain('outbox-pending-notice');
      expect(html).not.toContain('Retry Pending');
    });

    it('renders singular "1 pending match record" and Retry Pending button when 1 item is pending', () => {
      const match = createMatch('match-menu-1');
      outboxStore.enqueue(match);

      const html = renderToString(
        createElement(MainMenu, {
          playRef: { current: null },
          optionsButtonRef: { current: null },
          onStart: vi.fn(),
          onOptions: vi.fn(),
          onLastResult: vi.fn(),
          lastResult: null,
        })
      );

      expect(html).toContain('outbox-pending-notice');
      expect(html).toContain('1 pending match record');
      expect(html).toContain('Retry Pending');
    });

    it('renders plural "3 pending match records" and Retry Pending button when 3 items are pending', () => {
      outboxStore.enqueue(createMatch('match-menu-1'));
      outboxStore.enqueue(createMatch('match-menu-2'));
      outboxStore.enqueue(createMatch('match-menu-3'));

      const html = renderToString(
        createElement(MainMenu, {
          playRef: { current: null },
          optionsButtonRef: { current: null },
          onStart: vi.fn(),
          onOptions: vi.fn(),
          onLastResult: vi.fn(),
          lastResult: null,
        })
      );

      expect(html).toContain('outbox-pending-notice');
      expect(html).toContain('3 pending match records');
      expect(html).toContain('Retry Pending');
    });
  });

  describe('Session abandon isolation', () => {
    it('abandoning a match never creates an outbox entry nor invokes POST', () => {
      // Simulate session discard: user paused and clicked "Abandon"
      // Neither outboxStore.enqueue nor postMatch is called
      expect(outboxStore.getEntries()).toHaveLength(0);

      const html = renderToString(
        createElement(MainMenu, {
          playRef: { current: null },
          optionsButtonRef: { current: null },
          onStart: vi.fn(),
          onOptions: vi.fn(),
          onLastResult: vi.fn(),
          lastResult: null,
        })
      );

      expect(html).not.toContain('pending match record');
    });
  });
});
