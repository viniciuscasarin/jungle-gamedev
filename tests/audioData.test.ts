import { expect, it, vi } from 'vitest';
import { createAudioData } from '../src/audio/audioData';

it('aborts a stalled transfer at 30 seconds and preserves the silent fallback', async () => {
  vi.useFakeTimers();
  try {
    let signal: AbortSignal | undefined;
    const transfer = vi.fn((_url, options) => { signal = options?.signal as AbortSignal; return new Promise<Response>(() => {}); });
    const data = createAudioData(transfer);
    const ready = data.load('audio');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await ready).toBeNull(); expect(signal?.aborted).toBe(true);
    expect(await data.load('audio')).toBeNull(); expect(transfer).toHaveBeenCalledOnce();
  } finally { vi.useRealTimers(); }
});
