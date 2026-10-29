import { expect, it, vi } from 'vitest';
import { createImagePreparation } from '../src/startup/images';

it('shares image preparation, awaits decode and retains the successful image', async () => {
  let decoded!: () => void;
  const image = { src: '', onload: null, onerror: null, decode: vi.fn(() => new Promise<void>(resolve => { decoded = resolve; })) };
  const make = vi.fn(() => image as unknown as HTMLImageElement);
  const preparation = createImagePreparation(make);
  const a = preparation.prepare('logo'), b = preparation.prepare('logo');
  expect(a).toBe(b);
  (image.onload as unknown as () => void)();
  let ready = false; void a.then(() => { ready = true; });
  await Promise.resolve(); expect(ready).toBe(false);
  decoded(); await a; await preparation.prepare('logo'); expect(make).toHaveBeenCalledOnce();
});

it('cleans up a timed-out image and retries with a new image', async () => {
  vi.useFakeTimers();
  try {
    const make = vi.fn(() => ({ src: '', onload: null, onerror: null } as unknown as HTMLImageElement));
    const preparation = createImagePreparation(make);
    const first = preparation.prepare('image'); const failure = expect(first).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(30_000); await failure;
    expect(make.mock.results[0]!.value.onload).toBeNull();
    const retry = preparation.prepare('image'); make.mock.results[1]!.value.onload!(new Event('load'));
    await retry; expect(make).toHaveBeenCalledTimes(2);
  } finally { vi.useRealTimers(); }
});
