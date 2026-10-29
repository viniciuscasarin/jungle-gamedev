import { describe, expect, it, vi } from 'vitest';
import { createAssetCache } from '../src/render/assetCache';
const deferred = <T>() => { let resolve!: (v:T)=>void; let reject!: (e:Error)=>void; const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject}; };
describe('session texture leases', () => {
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
