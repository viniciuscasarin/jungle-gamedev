import type { AssetLease } from './assetCache';
import type { PreviewResource } from './previewOwner';
interface AttemptDependencies<T> {
  acquire(): AssetLease<T>;
  initialize(textures: ReadonlyMap<string, T>): Promise<PreviewResource>;
  fail: boolean;
  minimumMs?: number;
}
/** Cancellation releases participation immediately; the owner destroys late resources. */
export function createLoadingAttempt<T>(dependencies: AttemptDependencies<T>) {
  let disposed = false;
  let lease: AssetLease<T> | undefined;
  let initializing = false;
  let holdsResource = false;
  const release = () => { const current = lease; lease = undefined; current?.release(); };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finishDelay: (() => void) | undefined;
  const delay = new Promise<void>(resolve => {
    finishDelay = resolve; timer = setTimeout(resolve, dependencies.minimumMs ?? 300);
  });
  const initialize = async (): Promise<PreviewResource> => {
    try {
      // Before acquire, so the demonstration works even with a warm cache.
      if (dependencies.fail) throw new Error('Demonstration asset failure.');
      if (disposed) throw new Error('Attempt cancelled.');
      lease = dependencies.acquire();
      const textures = await lease.ready;
      if (disposed) throw new Error('Attempt cancelled.');
      initializing = true;
      const resource = await dependencies.initialize(textures);
      initializing = false;
      holdsResource = true;
      await delay;
      let destroyed = false;
      return { mount: paused => resource.mount(paused), resize: () => resource.resize(), pause: () => { if (!destroyed) resource.pause?.(); }, resume: () => { if (!destroyed) resource.resume?.(); }, destroy() {
        if (destroyed) return;
        destroyed = true;
        try { resource.destroy(); } finally { holdsResource = false; release(); }
      } };
    } catch (error) { initializing = false; release(); await delay; throw error; }
  };
  return { initialize, dispose() {
    if (disposed) return;
    disposed = true;
    if (timer !== undefined) clearTimeout(timer);
    finishDelay?.();
    // An in-flight graphics init still borrows textures. Its late resource must
    // be destroyed by the owner before final cache shutdown may unload them.
    if (!initializing && !holdsResource) release();
  } };
}
