import type { GameConfig } from './config';
import { validateSeed } from './config';
import { immutableCopy } from './immutable';
import { configurationKey, isRecord, isText, validateConfiguration } from './validation';

export type EndReason = 'player_destroyed' | 'time_expired';

export interface CompletedMatchResult {
  readonly matchId: string;
  readonly playerId: string;
  readonly playerName: string;
  /** ISO-8601 UTC timestamp supplied by the caller, never generated here. */
  readonly completedAt: string;
  readonly score: number;
  readonly activeDurationMs: number;
  readonly endReason: EndReason;
  readonly configuration: GameConfig;
  /** Full canonical gameplay data and versions; excludes seed/identity/preferences. */
  readonly configurationKey: string;
  readonly seed: number;
}

// Validate calendar data without reading a global clock or requiring Date in the core.
function isUtcTimestamp(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/.exec(value);
  if (!match) return false;
  const [year = 0, month = 0, day = 0, hour = 24, minute = 60, second = 60] = match.slice(1).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= (days[month - 1] ?? 0) && hour < 24 && minute < 60 && second < 60;
}

/** Materialize supplied data; this does not finalize a match or derive identifiers. */
export function materializeCompletedResult(result: CompletedMatchResult): CompletedMatchResult {
  return validateCompletedResult(result);
}

export function validateCompletedResult(value: unknown): CompletedMatchResult {
  if (!isRecord(value)) throw new RangeError('Invalid result data.');
  const result = value as unknown as CompletedMatchResult;
  if (![result.matchId, result.playerId, result.playerName].every(isText)) throw new RangeError('Result identity is required.');
  if (!Number.isSafeInteger(result.score) || result.score < 0) throw new RangeError('Score must be a nonnegative integer.');
  if (!Number.isFinite(result.activeDurationMs) || result.activeDurationMs < 0) throw new RangeError('Active duration must be finite and nonnegative.');
  if (typeof result.completedAt !== 'string' || !isUtcTimestamp(result.completedAt)) throw new RangeError('Completion timestamp must be a valid ISO UTC timestamp.');
  if (result.endReason !== 'player_destroyed' && result.endReason !== 'time_expired') throw new RangeError('Unknown end reason.');
  validateSeed(result.seed);
  const configuration = validateConfiguration(result.configuration);
  if (result.activeDurationMs > configuration.options.sessionDurationMs || (result.endReason === 'time_expired' && result.activeDurationMs !== configuration.options.sessionDurationMs)) throw new RangeError('Duration does not match configuration.');
  if (result.configurationKey !== configurationKey(configuration)) throw new RangeError('Configuration key does not match historical data.');
  return immutableCopy(result);
}
