import { withDeadline } from '../startup/deadline';

export interface AssetLease<T> { readonly ready: Promise<ReadonlyMap<string, T>>; release(): void }
export interface AssetBackend<T> { load(url: string): Promise<T>; unload(url: string, value: T): Promise<void> }

/** Session owner: successful partial loads stay warm; only rejected work is retried. */
export function createAssetCache<T>(urls: readonly string[], backend: AssetBackend<T>, timeoutMs = 30_000) {
  const values = new Map<string, T>();
  const listeners = new Set<(url: string) => void>();
  const physical = new Set<Promise<T>>();
  let pending: Promise<ReadonlyMap<string, T>> | undefined;
  let leases = 0;
  let closed = false;
  let closing: Promise<void> | undefined;
  let wake: (() => void) | undefined;
  const signal = () => { wake?.(); wake = undefined; };
  function acquire(): AssetLease<T> {
    if (closed) throw new Error('Asset cache is closed.');
    leases++;
    if (!pending) {
      const work = Promise.allSettled([...new Set(urls)].filter(url => !values.has(url)).map(async url => {
        const loading = backend.load(url);
        physical.add(loading);
        // Non-cancellable Pixi work remains session-owned, including late textures.
        void loading.then(value => {
          if (!values.has(url)) values.set(url, value);
          physical.delete(loading); signal();
        }, () => { physical.delete(loading); signal(); });
        await withDeadline(loading, timeoutMs);
        for (const listener of listeners) listener(url);
      })).then(results => {
        const failed = results.find(result => result.status === 'rejected');
        if (failed?.status === 'rejected') throw failed.reason;
        return values as ReadonlyMap<string, T>;
      });
      pending = work;
      // Clear both fulfillment and rejection without creating an unhandled rejection.
      void work.then(() => { if (pending === work) pending = undefined; signal(); }, () => { if (pending === work) pending = undefined; signal(); });
    }
    let released = false;
    const release = () => { if (released) return; released = true; leases--; signal(); };
    const ready = pending;
    void ready.catch(release);
    return { ready, release };
  }
  function close(): Promise<void> {
    if (closing) return closing;
    closed = true;
    closing = (async () => {
      while (leases > 0 || pending || physical.size) await new Promise<void>(resolve => { wake = resolve; });
      const results = await Promise.allSettled([...values].map(([url, value]) => backend.unload(url, value)));
      values.clear();
      const failed = results.find(result => result.status === 'rejected');
      if (failed?.status === 'rejected') throw failed.reason;
    })();
    return closing;
  }
  return {
    acquire, close,
    subscribe(listener: (url: string) => void) {
      listeners.add(listener);
      for (const url of values.keys()) listener(url);
      return () => { listeners.delete(listener); };
    },
    inspect: () => ({ leases, textures: values.size, pending: !!pending, closed }),
  };
}
