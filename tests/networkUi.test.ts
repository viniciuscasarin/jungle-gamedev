import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { NetworkScenarioPanel } from '../src/ui/screens/NetworkScenarioPanel';
import { MainMenu } from '../src/ui/screens/MainMenu';
import {
  NETWORK_SCENARIOS,
  setNetworkScenario,
  clearNetworkScenario,
  getScenarioDefinition,
  resetTransientScenarioState,
} from '../src/mocks/scenarios';
import { QueryClient } from '@tanstack/react-query';

describe('Network Diagnostics & Scenario Panel UI Integration', () => {
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

  beforeEach(() => {
    // @ts-expect-error global window mocking
    globalThis.window = fakeWindow;
    (globalThis as unknown as { localStorage: typeof fakeLocalStorage }).localStorage = fakeLocalStorage;
    clearNetworkScenario();
    resetTransientScenarioState();
    storageMap.clear();
    fakeWindow.location.search = '';
  });

  afterEach(() => {
    clearNetworkScenario();
    resetTransientScenarioState();
    // @ts-expect-error cleanup
    delete globalThis.window;
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    vi.restoreAllMocks();
  });

  it('renders expandable <details> panel with accessible summary and description', () => {
    const html = renderToString(createElement(NetworkScenarioPanel));

    expect(html).toContain('details class="network-scenario-panel"');
    expect(html).toContain('summary class="network-scenario-summary"');
    expect(html).toContain('Network Diagnostics &amp; Scenarios');
    expect(html).toContain('label for="network-scenario-select"');
    expect(html).toContain('Active Scenario:');
    expect(html).toContain('select id="network-scenario-select"');
  });

  it('renders all 12 regulatory scenarios in the select element', () => {
    const html = renderToString(createElement(NetworkScenarioPanel));

    for (const scenario of NETWORK_SCENARIOS) {
      expect(html).toContain(`value="${scenario.id}"`);
      expect(html).toContain(scenario.name.replace(/&/g, '&amp;'));
    }
  });

  it('displays the active scenario badge and description', () => {
    setNetworkScenario('empty');
    const def = getScenarioDefinition('empty');

    const html = renderToString(createElement(NetworkScenarioPanel));
    expect(html).toContain('class="network-scenario-badge"');
    expect(html).toContain('>empty<');
    expect(html).toContain(def.description);
  });

  it('hides "Restore Default Scenario" button when scenario is default, and displays it otherwise', () => {
    // 1. Default scenario
    setNetworkScenario('default');
    const defaultHtml = renderToString(createElement(NetworkScenarioPanel));
    expect(defaultHtml).toContain('Reset Mock Data');
    expect(defaultHtml).not.toContain('Restore Default Scenario');

    // 2. Non-default scenario
    setNetworkScenario('slow-jitter');
    const jitterHtml = renderToString(createElement(NetworkScenarioPanel));
    expect(jitterHtml).toContain('Reset Mock Data');
    expect(jitterHtml).toContain('Restore Default Scenario');
  });

  it('provides accessible role="status" and aria-live="polite" feedback container', () => {
    const html = renderToString(createElement(NetworkScenarioPanel));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('class="network-scenario-status"');
  });

  it('renders seamlessly inside MainMenu below LeaderboardTabs', () => {
    const playRef = { current: null };
    const optionsRef = { current: null };
    const qClient = new QueryClient();

    const html = renderToString(
      createElement(MainMenu, {
        playRef,
        optionsButtonRef: optionsRef,
        onStart: vi.fn(),
        onOptions: vi.fn(),
        onLastResult: vi.fn(),
        lastResult: null,
        client: qClient,
      }),
    );

    // MainMenu controls
    expect(html).toContain('Play');
    expect(html).toContain('Options');
    // LeaderboardTabs
    expect(html).toContain('Rankings and History');
    expect(html).toContain('Ranking');
    expect(html).toContain('Match History');
    // NetworkScenarioPanel
    expect(html).toContain('Network Diagnostics &amp; Scenarios');
    expect(html).toContain('Reset Mock Data');
  });
});
