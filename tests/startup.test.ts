import { afterEach, expect, it, vi } from 'vitest';
import { createStartupCoordinator } from '../src/startup/coordinator';
const deferred = () => { let resolve!: (value?: unknown) => void; let reject!: () => void; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
afterEach(() => vi.useRealTimers());

it('counts deduplicated out-of-order successes, retries missing work and gates 100 on bootstrap', async () => {
  const a = deferred(), b = deferred(); let fail = true;
  const prepare = vi.fn((r: { url: string }) => r.url === 'a' ? a.promise : fail ? b.promise : Promise.resolve());
  const startup = createStartupCoordinator([{ url: 'a', kind: 'image' }, { url: 'b', kind: 'texture' }, { url: 'a', kind: 'image' }], prepare);
  const running = startup.retry(); await Promise.resolve();
  b.reject(); a.resolve(); await running;
  expect(startup.getSnapshot()).toMatchObject({ phase: 'failed', completed: 1, total: 2, progress: 50 });
  fail = false; await startup.retry();
  expect(prepare.mock.calls.map(([r]) => r.url)).toEqual(['a', 'b', 'b']);
  expect(startup.getSnapshot()).toMatchObject({ phase: 'loading', progress: 99 });
  startup.markBootstrapReady(); expect(startup.getSnapshot()).toMatchObject({ phase: 'ready', progress: 100 });
});

it('times out visual work, accepts silent audio, and ignores an obsolete completion after Retry', async () => {
  vi.useFakeTimers(); const old = deferred(); let attempt = 0;
  const startup = createStartupCoordinator([{ url: 'visual', kind: 'image' }, { url: 'sound', kind: 'audio' }], r => r.kind === 'audio' || attempt === 0 ? old.promise : Promise.resolve());
  startup.markBootstrapReady(); const first = startup.retry(); await vi.advanceTimersByTimeAsync(30_000); await first;
  expect(startup.getSnapshot()).toMatchObject({ phase: 'failed', progress: 50, silent: ['sound'], failures: ['visual'] });
  attempt++; await startup.retry(); const ready = startup.getSnapshot();
  old.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(startup.getSnapshot()).toBe(ready); expect(ready.progress).toBe(100);
});
