import type { CompletedMatchResult } from '../domain/result';
import { validateCompletedResult } from '../domain/result';
import type { PaginatedResponse, PlayerMatchesQuery, RankingQuery } from '../data/contracts';
import { ConflictError } from '../data/contracts';
import { DETERMINISTIC_FIXTURES } from './fixtures';

export const CONFIRMED_MATCHES_KEY = 'pirate-battle.confirmed-matches.v1';

export interface ConfirmedMatchesStore {
  getAll(): readonly CompletedMatchResult[];
  getRanking(query: RankingQuery): PaginatedResponse<CompletedMatchResult>;
  getPlayerMatches(playerId: string, query?: PlayerMatchesQuery): PaginatedResponse<CompletedMatchResult>;
  addMatch(result: CompletedMatchResult): { match: CompletedMatchResult; created: boolean };
  reset(fixtures?: readonly CompletedMatchResult[]): void;
}

export function sortRanking(items: readonly CompletedMatchResult[]): CompletedMatchResult[] {
  return [...items].sort((a, b) => {
    // 1. score DESC
    if (b.score !== a.score) return b.score - a.score;
    // 2. completedAt ASC (older / earlier timestamp achieved precedence)
    const timeCompare = a.completedAt.localeCompare(b.completedAt);
    if (timeCompare !== 0) return timeCompare;
    // 3. matchId ASC (lexicographical tie-breaker)
    return a.matchId.localeCompare(b.matchId);
  });
}

export function sortPlayerMatches(items: readonly CompletedMatchResult[]): CompletedMatchResult[] {
  return [...items].sort((a, b) => {
    // completedAt DESC
    const timeCompare = b.completedAt.localeCompare(a.completedAt);
    if (timeCompare !== 0) return timeCompare;
    return b.matchId.localeCompare(a.matchId);
  });
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): PaginatedResponse<T> {
  const safePage = Math.max(1, Math.floor(page || 1));
  const safeSize = Math.max(1, Math.floor(pageSize || 10));
  const startIndex = (safePage - 1) * safeSize;
  const sliced = items.slice(startIndex, startIndex + safeSize);
  return {
    items: sliced,
    page: safePage,
    pageSize: safeSize,
    totalItems: items.length,
  };
}

export function matchesAreEqual(a: CompletedMatchResult, b: CompletedMatchResult): boolean {
  return (
    a.matchId === b.matchId &&
    a.playerId === b.playerId &&
    a.playerName === b.playerName &&
    a.completedAt === b.completedAt &&
    a.score === b.score &&
    a.activeDurationMs === b.activeDurationMs &&
    a.endReason === b.endReason &&
    a.configurationKey === b.configurationKey &&
    a.seed === b.seed
  );
}

export function createConfirmedMatchesStore(getStorage?: () => Storage | undefined): ConfirmedMatchesStore {
  let memoryFallback: CompletedMatchResult[] = [];
  let isMemoryOnly = false;

  function acquireStorage(): Storage | undefined {
    if (isMemoryOnly) return undefined;
    try {
      if (getStorage) return getStorage();
      if (typeof window !== 'undefined') return window.localStorage;
      return undefined;
    } catch {
      isMemoryOnly = true;
      return undefined;
    }
  }

  function loadMatches(): CompletedMatchResult[] {
    const storage = acquireStorage();
    if (!storage) {
      if (memoryFallback.length === 0) {
        memoryFallback = DETERMINISTIC_FIXTURES.map(validateCompletedResult);
      }
      return memoryFallback;
    }

    try {
      const raw = storage.getItem(CONFIRMED_MATCHES_KEY);
      if (raw === null) {
        // Initial seed
        const initial = DETERMINISTIC_FIXTURES.map(validateCompletedResult);
        saveMatches(initial);
        return initial;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Confirmed matches data must be an array');
      }

      const validList: CompletedMatchResult[] = [];
      for (const item of parsed) {
        try {
          validList.push(validateCompletedResult(item));
        } catch {
          // ignore corrupted single records to be defensive
        }
      }
      return validList;
    } catch {
      isMemoryOnly = true;
      if (memoryFallback.length === 0) {
        memoryFallback = DETERMINISTIC_FIXTURES.map(validateCompletedResult);
      }
      return memoryFallback;
    }
  }

  function saveMatches(items: readonly CompletedMatchResult[]): void {
    memoryFallback = [...items];
    const storage = acquireStorage();
    if (!storage) return;

    try {
      storage.setItem(CONFIRMED_MATCHES_KEY, JSON.stringify(items));
    } catch {
      // LocalStorage quota exceeded or restricted: fallback to in-memory silently
      isMemoryOnly = true;
    }
  }

  return {
    getAll(): readonly CompletedMatchResult[] {
      return loadMatches();
    },

    getRanking(query: RankingQuery): PaginatedResponse<CompletedMatchResult> {
      const all = loadMatches();
      const filtered = all.filter(m => m.configurationKey === query.configurationKey);
      const sorted = sortRanking(filtered);
      return paginate(sorted, query.page ?? 1, query.pageSize ?? 10);
    },

    getPlayerMatches(playerId: string, query?: PlayerMatchesQuery): PaginatedResponse<CompletedMatchResult> {
      const all = loadMatches();
      const filtered = all.filter(m => m.playerId === playerId);
      const sorted = sortPlayerMatches(filtered);
      return paginate(sorted, query?.page ?? 1, query?.pageSize ?? 10);
    },

    addMatch(rawResult: CompletedMatchResult): { match: CompletedMatchResult; created: boolean } {
      const validated = validateCompletedResult(rawResult);
      const all = loadMatches();
      const existing = all.find(m => m.matchId === validated.matchId);

      if (existing) {
        if (matchesAreEqual(existing, validated)) {
          return { match: existing, created: false };
        }
        throw new ConflictError('Match ID already registered with divergent payload', {
          matchId: validated.matchId,
          existing,
          divergent: validated,
        });
      }

      const updated = [...all, validated];
      saveMatches(updated);
      return { match: validated, created: true };
    },

    reset(fixtures = DETERMINISTIC_FIXTURES): void {
      const list = fixtures.map(validateCompletedResult);
      const storage = acquireStorage();
      if (storage) {
        try {
          storage.removeItem(CONFIRMED_MATCHES_KEY);
        } catch {
          // ignore
        }
      }
      saveMatches(list);
    },
  };
}

export const confirmedMatchesStore = createConfirmedMatchesStore();
