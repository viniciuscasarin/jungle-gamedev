export interface AssetLease<T> { readonly ready: Promise<ReadonlyMap<string, T>>; release(): void }
export interface AssetBackend<T> { load(url: string): Promise<T>; unload(url: string, value: T): Promise<void> }

/** Session owner: successful partial loads stay warm; only rejected work is retried. */
export function createAssetCache<T>(urls: readonly string[], backend: AssetBackend<T>) {
  const values = new Map<string, T>();
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
      const work = Promise.allSettled(urls.filter(url => !values.has(url)).map(async url => {
        const value = await backend.load(url);
        values.set(url, value);
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
      while (leases > 0 || pending) await new Promise<void>(resolve => { wake = resolve; });
      const results = await Promise.allSettled([...values].map(([url, value]) => backend.unload(url, value)));
      values.clear();
      const failed = results.find(result => result.status === 'rejected');
      if (failed?.status === 'rejected') throw failed.reason;
    })();
    return closing;
  }
  return { acquire, close, inspect: () => ({ leases, textures: values.size, pending: !!pending, closed }) };
}
