import { expect, it, vi } from 'vitest';
import { createOrientationAdapter, orientationState, requestLandscape } from '../src/input/orientation';

it.each([
  [true, 844, 390, false], [true, 390, 844, true], [true, 400, 400, true],
  [false, 320, 844, false], [false, 1280, 900, false],
])('uses primary pointer and effective viewport: %s %s×%s', (coarse, width, height, blocked) => {
  expect(orientationState(coarse, width, height).blocked).toBe(blocked);
});
it('reevaluates returned pages and removes subscriptions on disposal', () => {
  let read = orientationState(true, 844, 390); let update!: () => void;
  const stop = vi.fn();
  const adapter = createOrientationAdapter({ read: () => read, listen: callback => { update = callback; return stop; } });
  const listener = vi.fn(); const unsubscribe = adapter.subscribe(listener);
  read = orientationState(true, 390, 844); update(); expect(adapter.getSnapshot().blocked).toBe(true);
  update(); expect(listener).toHaveBeenCalledOnce(); unsubscribe();
  adapter.dispose(); expect(stop).toHaveBeenCalledOnce();
});
it('requests fullscreen only as a fallback to an explicit lock action', async () => {
  const lock = vi.fn().mockRejectedValueOnce(new Error('Fullscreen required')).mockResolvedValueOnce(undefined);
  const fullscreen = vi.fn(async () => {});
  expect(await requestLandscape({ lock, fullscreen, isFullscreen: () => false })).toBe(true);
  expect(lock).toHaveBeenCalledTimes(2); expect(fullscreen).toHaveBeenCalledOnce();
});
it('handles missing, refused and fullscreen APIs without automatic repetition', async () => {
  expect(await requestLandscape({ isFullscreen: () => false })).toBe(false);
  const lock = vi.fn(async () => { throw new Error('Refused'); });
  const fullscreen = vi.fn(async () => { throw new Error('Refused'); });
  expect(await requestLandscape({ lock, fullscreen, isFullscreen: () => false })).toBe(false);
  expect(lock).toHaveBeenCalledOnce(); expect(fullscreen).toHaveBeenCalledOnce();
  expect(await requestLandscape({ lock, fullscreen, isFullscreen: () => true })).toBe(false);
  expect(fullscreen).toHaveBeenCalledOnce();
});
