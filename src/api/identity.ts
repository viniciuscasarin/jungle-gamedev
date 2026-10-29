import type { PlayerIdentity } from '../domain/session';
import { LOCAL_KEYS, createLocalAdapter } from '../storage/local';

export function getOrGenerateIdentity(storage?: Storage): PlayerIdentity {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) {
    const fallbackId = crypto.randomUUID();
    return {
      playerId: fallbackId,
      playerName: `Captain-${fallbackId.slice(0, 4).toUpperCase()}`,
    };
  }

  const adapter = createLocalAdapter(() => store);
  const existing = adapter.readIdentity();
  if (existing.value) {
    return existing.value;
  }

  const newId = crypto.randomUUID();
  const identity: PlayerIdentity = {
    playerId: newId,
    playerName: `Captain-${newId.slice(0, 4).toUpperCase()}`,
  };

  adapter.saveIdentity(identity);
  return identity;
}

export { LOCAL_KEYS };
