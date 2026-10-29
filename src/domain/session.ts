import { createMatchSetup } from './config';
import type { GameConfig, MatchSetup } from './config';
import { immutableCopy } from './immutable';
import { materializeCompletedResult } from './result';
import type { CompletedMatchResult } from './result';
import { configurationKey, isText } from './validation';
import type { SimulationEvent } from '../simulation/contracts';

export interface PlayerIdentity { readonly playerId: string; readonly playerName: string }
export interface SessionPreparation { readonly matchId: string; readonly identity: PlayerIdentity; readonly setup: MatchSetup }
export function prepareSession(matchId: string, identity: PlayerIdentity, configuration: GameConfig, seed: number): SessionPreparation {
  if (![matchId, identity.playerId, identity.playerName].every(isText)) throw new RangeError('Session identity is required.');
  return immutableCopy({ matchId, identity, setup: createMatchSetup(configuration, seed) });
}

/** One latch per logical preparation. Retry uses the same latch; disposal rejects stale callbacks. */
export function createSessionCompletion(preparation: SessionPreparation, utcNow: () => string, save: (result: CompletedMatchResult) => boolean) {
  let disposed = false, completed: { result: CompletedMatchResult; saved: boolean } | undefined;
  return {
    complete(event: Extract<SimulationEvent, { type: 'ended' }>) {
      if (disposed) return;
      if (completed) return completed;
      const result = materializeCompletedResult({ matchId: preparation.matchId, ...preparation.identity, completedAt: utcNow(), score: event.score, activeDurationMs: event.activeTimeMs, endReason: event.reason, configuration: preparation.setup.configuration, configurationKey: configurationKey(preparation.setup.configuration), seed: preparation.setup.seed });
      completed = { result, saved: save(result) };
      return completed;
    },
    dispose() { disposed = true; },
  };
}
