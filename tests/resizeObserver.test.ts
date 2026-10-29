import { afterEach, expect, it, vi } from 'vitest';
import { observeArenaResize } from '../src/render/resizeObserver';
afterEach(()=>vi.unstubAllGlobals());
it('rearms isolated DPR changes and removes every observer/listener idempotently',()=>{
 const observe=vi.fn(),disconnect=vi.fn(),add=vi.fn(),remove=vi.fn();
 const queries: {addEventListener:ReturnType<typeof vi.fn>;removeEventListener:ReturnType<typeof vi.fn>}[]=[];
 vi.stubGlobal('ResizeObserver',class {observe=observe;disconnect=disconnect;});
 const matchMedia=vi.fn(()=>{const q={addEventListener:vi.fn(),removeEventListener:vi.fn()};queries.push(q);return q;});
 vi.stubGlobal('window',{devicePixelRatio:1,matchMedia,addEventListener:add,removeEventListener:remove});
 const resize=vi.fn(),host={} as HTMLElement,stop=observeArenaResize(host,resize);
 expect(observe).toHaveBeenCalledWith(host);expect(matchMedia).toHaveBeenLastCalledWith('(resolution: 1dppx)');
 window.devicePixelRatio=2;queries[0]!.addEventListener.mock.calls[0]![1]();
 expect(resize).toHaveBeenCalledOnce();expect(matchMedia).toHaveBeenLastCalledWith('(resolution: 2dppx)');expect(queries[0]!.removeEventListener).toHaveBeenCalledOnce();
 stop();stop();expect(disconnect).toHaveBeenCalledOnce();expect(remove).toHaveBeenCalledExactlyOnceWith('resize',resize);expect(queries[1]!.removeEventListener).toHaveBeenCalledOnce();
 queries[1]!.addEventListener.mock.calls[0]![1]();expect(resize).toHaveBeenCalledOnce();
});
it('cleans already installed subscriptions if media-query registration fails',()=>{
 const disconnect=vi.fn(),remove=vi.fn();vi.stubGlobal('ResizeObserver',class {observe=vi.fn();disconnect=disconnect;});
 vi.stubGlobal('window',{devicePixelRatio:1,matchMedia:()=>{throw new Error('registration');},addEventListener:vi.fn(),removeEventListener:remove});
 expect(()=>observeArenaResize({} as HTMLElement,vi.fn())).toThrow('registration');expect(disconnect).toHaveBeenCalledOnce();expect(remove).toHaveBeenCalledOnce();
});
