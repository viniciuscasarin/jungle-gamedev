import { describe, expect, it } from 'vitest';
import { AUDIO_KEYS, createLocalAdapter, type LocalStore } from '../src/storage/local';

function createMemoryStore(initial: Record<string, string> = {}): LocalStore {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, val) => map.set(key, val),
  };
}

describe('local storage adapter - soundMuted', () => {
  it('defaults soundMuted to false when key is absent', () => {
    const store = createMemoryStore();
    const adapter = createLocalAdapter(() => store);
    expect(adapter.readSoundMuted()).toBe(false);
  });

  it('persists and restores soundMuted boolean', () => {
    const store = createMemoryStore();
    const adapter = createLocalAdapter(() => store);

    expect(adapter.saveSoundMuted(true)).toBe(true);
    expect(adapter.readSoundMuted()).toBe(true);
    expect(JSON.parse(store.getItem(AUDIO_KEYS.soundMuted)!)).toEqual({
      version: 1,
      data: true,
    });

    expect(adapter.saveSoundMuted(false)).toBe(true);
    expect(adapter.readSoundMuted()).toBe(false);
  });

  it('falls back safely to false on corrupted JSON or invalid data', () => {
    const store = createMemoryStore({
      [AUDIO_KEYS.soundMuted]: 'not-json',
    });
    const adapter = createLocalAdapter(() => store);
    expect(adapter.readSoundMuted()).toBe(false);

    store.setItem(AUDIO_KEYS.soundMuted, JSON.stringify({ version: 1, data: 'not-a-boolean' }));
    expect(adapter.readSoundMuted()).toBe(false);
  });

  it('handles throwing storage gracefully', () => {
    const throwingStore: LocalStore = {
      getItem: () => { throw new Error('SecurityError: LocalStorage is disabled'); },
      setItem: () => { throw new Error('QuotaExceededError'); },
    };
    const adapter = createLocalAdapter(() => throwingStore);
    expect(adapter.readSoundMuted()).toBe(false);
    expect(adapter.saveSoundMuted(true)).toBe(false);
  });
});
