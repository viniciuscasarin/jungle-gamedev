import type { GameOptions } from '../domain/config';
import type { PlayerIdentity } from '../domain/session';
import { validateCompletedResult } from '../domain/result';
import type { CompletedMatchResult } from '../domain/result';
import { isRecord, isText, validateOptions } from '../domain/validation';

export const LOCAL_KEYS = Object.defineProperties(
  {
    options: 'pirate-battle.options.v1',
    identity: 'pirate-battle.identity.v1',
    result: 'pirate-battle.last-result.v1',
  },
  {
    outbox: {
      value: 'pirate-battle.outbox.v1',
      enumerable: false,
      writable: false,
      configurable: false,
    },
  }
) as {
  readonly options: 'pirate-battle.options.v1';
  readonly identity: 'pirate-battle.identity.v1';
  readonly result: 'pirate-battle.last-result.v1';
  readonly outbox: 'pirate-battle.outbox.v1';
};

export const AUDIO_KEYS = {
  soundMuted: 'pirate-battle.sound-muted.v1',
} as const;

export interface LocalStore { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface ReadValue<T> { value?: T; notice?: string }

/** Acquire storage inside the try: browsers may throw even from the localStorage getter. */
export function createLocalAdapter(acquire: () => LocalStore) {
  function read<T>(key: string, validate: (value: unknown) => T, fallback: string): ReadValue<T> {
    try {
      const raw = acquire().getItem(key);
      if (raw === null) return {};
      const envelope: unknown = JSON.parse(raw);
      if (!isRecord(envelope) || envelope.version !== 1 || !Object.hasOwn(envelope, 'data')) throw new RangeError('Unknown storage format.');
      return { value: validate(envelope.data) };
    } catch { return { notice: fallback }; }
  }
  function write(key: string, data: unknown): boolean {
    try { acquire().setItem(key, JSON.stringify({ version: 1, data })); return true; } catch { return false; }
  }
  return {
    readOptions: () => read(LOCAL_KEYS.options, validateOptions, 'Saved settings could not be read. Default settings will be used.'),
    readIdentity: () => read(LOCAL_KEYS.identity, (value): PlayerIdentity => {
      if (!isRecord(value) || !isText(value.playerId) || !isText(value.playerName)) throw new RangeError('Invalid player identity.');
      return { playerId: value.playerId, playerName: value.playerName };
    }, 'Local identity could not be read. A new captain is available for this visit.'),
    readResult: () => read(LOCAL_KEYS.result, validateCompletedResult, 'Last Result could not be recovered from this device.'),
    readSoundMuted: (): boolean => {
      const result = read(AUDIO_KEYS.soundMuted, (value): boolean => {
        if (typeof value !== 'boolean') throw new RangeError('Invalid soundMuted preference.');
        return value;
      }, 'Sound mute preference could not be read.');
      return result.value ?? false;
    },
    saveOptions: (value: GameOptions) => write(LOCAL_KEYS.options, validateOptions(value)),
    saveIdentity: (value: PlayerIdentity) => write(LOCAL_KEYS.identity, value),
    saveResult: (value: CompletedMatchResult) => write(LOCAL_KEYS.result, validateCompletedResult(value)),
    saveSoundMuted: (value: boolean) => write(AUDIO_KEYS.soundMuted, Boolean(value)),
  };
}
