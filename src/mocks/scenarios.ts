import type { QueryClient } from '@tanstack/react-query';
import { confirmedMatchesStore } from './store';

export type NetworkScenarioId =
  | 'default'
  | 'empty'
  | 'multi-page'
  | 'slow-jitter'
  | 'out-of-order'
  | 'timeout'
  | 'offline'
  | 'error-4xx'
  | 'error-5xx'
  | 'isolated-tab-failure'
  | 'commit-timeout'
  | 'temporary-outage';

export interface NetworkScenarioDefinition {
  readonly id: NetworkScenarioId;
  readonly name: string;
  readonly description: string;
}

export const NETWORK_SCENARIO_STORAGE_KEY = 'pirate-battle.network-scenario.v1';

export const NETWORK_SCENARIOS: readonly NetworkScenarioDefinition[] = [
  {
    id: 'default',
    name: 'Default (Nominal)',
    description: 'Standard 200 OK responses with canonical fixtures and nominal 0–50ms latency.',
  },
  {
    id: 'empty',
    name: 'Empty Lists',
    description: 'Returns empty datasets (items: [], totalItems: 0) for ranking and player match history.',
  },
  {
    id: 'multi-page',
    name: 'Multiple Pages',
    description: 'Expanded deterministic dataset (35+ matches) across 4 pages to test pagination controls.',
  },
  {
    id: 'slow-jitter',
    name: 'Slow Latency with Jitter',
    description: 'Success responses delayed by variable 1,500ms–2,500ms latency to test loading states.',
  },
  {
    id: 'out-of-order',
    name: 'Out-of-Order Responses',
    description: 'Alternating fast/slow response latency to verify AbortSignal cancellation and race resilience.',
  },
  {
    id: 'timeout',
    name: 'Request Timeout',
    description: 'Deliberately exceeds client timeout threshold (>30s) to trigger timeout errors and retries.',
  },
  {
    id: 'offline',
    name: 'Offline / Disconnected',
    description: 'Immediate network transport failure (network error) emulating airplane mode.',
  },
  {
    id: 'error-4xx',
    name: 'Client Error (400)',
    description: 'Returns 400 Bad Request to verify that permanent errors cease outbox retries immediately.',
  },
  {
    id: 'error-5xx',
    name: 'Server Error (500)',
    description: 'Returns 500 Internal Server Error to exercise exponential backoff and transient retries.',
  },
  {
    id: 'isolated-tab-failure',
    name: 'Isolated Tab Failure',
    description: 'Fails ranking endpoint with 500 while player match history succeeds with 200 OK.',
  },
  {
    id: 'commit-timeout',
    name: 'Timeout After Commit',
    description: 'Match is saved to database but network response is dropped; subsequent retry succeeds idempotently.',
  },
  {
    id: 'temporary-outage',
    name: 'Temporary Outage & Recovery',
    description: 'First 2 requests fail with connection error; 3rd request onward recovers with success.',
  },
];

export function isNetworkScenarioId(value: unknown): value is NetworkScenarioId {
  return typeof value === 'string' && NETWORK_SCENARIOS.some(s => s.id === value);
}

export function getScenarioDefinition(id: NetworkScenarioId): NetworkScenarioDefinition {
  const found = NETWORK_SCENARIOS.find(s => s.id === id);
  return found ?? NETWORK_SCENARIOS[0]!;
}

function getSafeStorage(): Storage | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage?: Storage }).localStorage;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function getSafeWindow(): (Window & typeof globalThis) | undefined {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    return (globalThis as unknown as { window?: Window & typeof globalThis }).window;
  }
  return undefined;
}

let inMemoryScenarioOverride: NetworkScenarioId | undefined;

// Cascading resolution: URL Query > LocalStorage > Window Memory Override > In-Memory Fallback > Default
export function getNetworkScenario(requestUrl?: string): NetworkScenarioId {
  // 1. Explicit request URL query parameter
  if (requestUrl) {
    try {
      const parsedUrl = new URL(requestUrl, 'http://localhost');
      const param = parsedUrl.searchParams.get('networkScenario');
      if (param) {
        if (param === 'outage') return 'offline';
        if (isNetworkScenarioId(param)) return param;
      }
    } catch {
      // ignore
    }
  }

  // 1b. Browser Window URL parameter (?networkScenario=...)
  const win = getSafeWindow();
  if (win?.location?.search) {
    try {
      const params = new URLSearchParams(win.location.search);
      const param = params.get('networkScenario');
      if (param) {
        if (param === 'outage') return 'offline';
        if (isNetworkScenarioId(param)) return param;
      }
    } catch {
      // ignore
    }
  }

  // 2. LocalStorage persistence (pirate-battle.network-scenario.v1)
  const storage = getSafeStorage();
  if (storage) {
    try {
      const stored = storage.getItem(NETWORK_SCENARIO_STORAGE_KEY);
      if (stored && isNetworkScenarioId(stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
  }

  // 2b. Backward compatibility for legacy test flag
  if (win && 'sessionStorage' in win) {
    try {
      if (win.sessionStorage?.getItem('pirate-battle.mock-network-outage') === 'true') {
        return 'offline';
      }
    } catch {
      // ignore
    }
  }

  // 3. Window Memory Override (window.__pbNetworkScenario)
  if (win) {
    const memory = (win as unknown as { __pbNetworkScenario?: unknown }).__pbNetworkScenario;
    if (memory) {
      if (memory === 'outage') return 'offline';
      if (isNetworkScenarioId(memory)) return memory;
    }
  }
  if (typeof globalThis !== 'undefined') {
    const memory = (globalThis as unknown as { __pbNetworkScenario?: unknown }).__pbNetworkScenario;
    if (memory) {
      if (memory === 'outage') return 'offline';
      if (isNetworkScenarioId(memory)) return memory;
    }
  }

  // 4. In-memory fallback
  if (inMemoryScenarioOverride && isNetworkScenarioId(inMemoryScenarioOverride)) {
    return inMemoryScenarioOverride;
  }

  // 5. Default fallback
  return 'default';
}

type ScenarioListener = (scenario: NetworkScenarioId) => void;
type ResetListener = () => void;

const scenarioListeners = new Set<ScenarioListener>();
const resetListeners = new Set<ResetListener>();

let storageListenerBound = false;
function ensureStorageListener() {
  if (storageListenerBound) return;
  const win = getSafeWindow();
  if (!win || typeof win.addEventListener !== 'function') return;
  storageListenerBound = true;
  win.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === NETWORK_SCENARIO_STORAGE_KEY) {
      const current = getNetworkScenario();
      notifyScenarioChange(current);
    }
  });
}

export function onScenarioChange(callback: ScenarioListener): () => void {
  ensureStorageListener();
  scenarioListeners.add(callback);
  return () => {
    scenarioListeners.delete(callback);
  };
}

export function onMockDataReset(callback: ResetListener): () => void {
  resetListeners.add(callback);
  return () => {
    resetListeners.delete(callback);
  };
}

function notifyScenarioChange(scenario: NetworkScenarioId) {
  for (const listener of scenarioListeners) {
    try {
      listener(scenario);
    } catch {
      // protect against listener errors
    }
  }
}

function notifyMockDataReset() {
  for (const listener of resetListeners) {
    try {
      listener();
    } catch {
      // protect against listener errors
    }
  }
}

export function setNetworkScenario(id: NetworkScenarioId): void {
  inMemoryScenarioOverride = id === 'default' ? undefined : id;
  const storage = getSafeStorage();
  if (storage) {
    try {
      if (id === 'default') {
        storage.removeItem(NETWORK_SCENARIO_STORAGE_KEY);
      } else {
        storage.setItem(NETWORK_SCENARIO_STORAGE_KEY, id);
      }
    } catch {
      // ignore
    }
  }
  // Reset transient counters when switching scenario
  resetTransientScenarioState();
  notifyScenarioChange(id);
}

export function clearNetworkScenario(): void {
  setNetworkScenario('default');
}

// Transient Scenario States
let temporaryOutageCounter = 0;
let outOfOrderCounter = 0;
const commitTimeoutDroppedMatches = new Set<string>();

export function resetTransientScenarioState(): void {
  temporaryOutageCounter = 0;
  outOfOrderCounter = 0;
  commitTimeoutDroppedMatches.clear();
}

export function handleTemporaryOutage(): { shouldFail: boolean; attempt: number } {
  temporaryOutageCounter++;
  return {
    shouldFail: temporaryOutageCounter <= 2,
    attempt: temporaryOutageCounter,
  };
}

export function shouldDropCommitTimeout(matchId: string): boolean {
  if (commitTimeoutDroppedMatches.has(matchId)) {
    return false; // Already dropped on initial commit; retry should now succeed
  }
  commitTimeoutDroppedMatches.add(matchId);
  return true; // First attempt: drop HTTP response
}

// Delays & Latency Configuration
export interface ScenarioDelayConfig {
  slowJitterMinMs: number;
  slowJitterMaxMs: number;
  outOfOrderSlowMs: number;
  outOfOrderFastMs: number;
  timeoutMs: number;
  nominalDelayMs: number;
}

export const DEFAULT_SCENARIO_DELAYS: ScenarioDelayConfig = {
  slowJitterMinMs: 1500,
  slowJitterMaxMs: 2500,
  outOfOrderSlowMs: 1500,
  outOfOrderFastMs: 150,
  timeoutMs: 35000,
  nominalDelayMs: 20,
};

let currentDelays: ScenarioDelayConfig = { ...DEFAULT_SCENARIO_DELAYS };

export function configureScenarioDelays(overrides?: Partial<ScenarioDelayConfig>): void {
  if (!overrides) {
    currentDelays = { ...DEFAULT_SCENARIO_DELAYS };
  } else {
    currentDelays = { ...currentDelays, ...overrides };
  }
}

export function getScenarioDelays(): ScenarioDelayConfig {
  return currentDelays;
}

export function getSlowJitterDelay(): number {
  const { slowJitterMinMs, slowJitterMaxMs } = currentDelays;
  if (slowJitterMaxMs <= slowJitterMinMs) return slowJitterMinMs;
  return Math.floor(slowJitterMinMs + Math.random() * (slowJitterMaxMs - slowJitterMinMs + 1));
}

export function getOutOfOrderDelay(): number {
  outOfOrderCounter++;
  const isOdd = outOfOrderCounter % 2 !== 0;
  return isOdd ? currentDelays.outOfOrderSlowMs : currentDelays.outOfOrderFastMs;
}

export const waitDelay = async (ms: number): Promise<void> => {
  if (ms <= 0) return;
  await new Promise(resolve => setTimeout(resolve, ms));
};

// Strict Reset Policy: restores ONLY confirmed matches fixtures and resets transient state.
// Inconditionally preserves options, identity, last-result, outbox, and sound-muted.
export function resetMockData(queryClient?: QueryClient): void {
  confirmedMatchesStore.reset();
  resetTransientScenarioState();

  if (queryClient) {
    try {
      void queryClient.invalidateQueries({ queryKey: ['ranking'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch {
      // ignore
    }
  }

  notifyMockDataReset();
}
