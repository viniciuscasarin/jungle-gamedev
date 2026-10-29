import { describe, expect, it, vi } from 'vitest';
import { createAssetCache } from '../src/render/assetCache';
const deferred = <T>() => { let resolve!: (v:T)=>void; let reject!: (e:Error)=>void; const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject}; };
describe('session texture leases', () => {
  it('releases timed-out leases and keeps a late shared texture alive through Retry', async () => {
    vi.useFakeTimers();
    try {
      const old = deferred<string>();
      const backend = { load: vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue('current'), unload: vi.fn(async () => {}) };
      const cache = createAssetCache(['a'], backend);
      const first = cache.acquire(); const failure = expect(first.ready).rejects.toThrow('timed out');
      await vi.advanceTimersByTimeAsync(30_000); await failure;
      expect(cache.inspect()).toMatchObject({ leases: 0, pending: false });
      const retry = cache.acquire(); expect((await retry.ready).get('a')).toBe('current');
      old.resolve('old'); await Promise.resolve();
      expect((await retry.ready).get('a')).toBe('current'); expect(backend.unload).not.toHaveBeenCalled();
      const closing = cache.close(); expect(backend.unload).not.toHaveBeenCalled();
      retry.release(); await closing; expect(backend.unload).toHaveBeenCalledExactlyOnceWith('a', 'current');
    } finally { vi.useRealTimers(); }
  });
  it('reports each resolved resource and replays warm progress without another load', async () => {
    const backend = { load: vi.fn(async (url: string) => url), unload: vi.fn(async () => {}) };
    const cache = createAssetCache(['a', 'b', 'a'], backend);
    const progress = vi.fn(); const stop = cache.subscribe(progress);
    const startup = cache.acquire(); await startup.ready; startup.release(); stop();
    expect(progress.mock.calls.flat()).toEqual(['a', 'b']);
    const warm = vi.fn(); cache.subscribe(warm);
    const play = cache.acquire(); await play.ready; play.release();
    expect(warm.mock.calls.flat()).toEqual(['a', 'b']); expect(backend.load).toHaveBeenCalledTimes(2);
    await cache.close();
  });
  it('shares pending work and preserves a surviving consumer and warm cache', async () => {
    const loading=deferred<string>();const backend={load:vi.fn(()=>loading.promise),unload:vi.fn(async()=>{})};
    const cache=createAssetCache(['a'],backend);const a=cache.acquire(),b=cache.acquire();
    expect(a.ready).toBe(b.ready);expect(backend.load).toHaveBeenCalledOnce();
    a.release();a.release(); loading.resolve('texture');expect((await b.ready).get('a')).toBe('texture');
    expect(backend.unload).not.toHaveBeenCalled();b.release();
    const warm=cache.acquire();expect((await warm.ready).get('a')).toBe('texture');expect(backend.load).toHaveBeenCalledOnce();
    const closing=cache.close();expect(backend.unload).not.toHaveBeenCalled();expect(()=>cache.acquire()).toThrow('closed');
    warm.release();await closing;expect(backend.unload).toHaveBeenCalledExactlyOnceWith('a','texture');expect(cache.close()).toBe(closing);
  });
  it('settles all partial loads, releases failed leases and retries only rejected work', async () => {
    const late=deferred<string>();let fail=true;
    const backend={load:vi.fn(async(url:string)=>{if(url==='a')return late.promise;if(fail)throw new Error('unavailable');return 'b';}),unload:vi.fn(async()=>{})};
    const cache=createAssetCache(['a','b'],backend),first=cache.acquire();
    const rejected=expect(first.ready).rejects.toThrow('unavailable');late.resolve('a');await rejected;
    expect(cache.inspect()).toMatchObject({leases:0,textures:1,pending:false});
    fail=false;const second=cache.acquire();expect([...(await second.ready).values()]).toEqual(['a','b']);
    expect(backend.load.mock.calls.map(c=>c[0])).toEqual(['a','b','b']);second.release();await cache.close();expect(backend.unload).toHaveBeenCalledTimes(2);
  });
  it('waits for a late successful load after the last consumer leaves', async()=>{
    const pending=deferred<string>();const unload=vi.fn(async()=>{});
    const cache=createAssetCache(['a'],{load:()=>pending.promise,unload});const lease=cache.acquire();lease.release();
    const closing=cache.close();expect(unload).not.toHaveBeenCalled();pending.resolve('late');await lease.ready;await closing;
    expect(unload).toHaveBeenCalledExactlyOnceWith('a','late');expect(cache.inspect()).toEqual({leases:0,textures:0,pending:false,closed:true});
  });
});
