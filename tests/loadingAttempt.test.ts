import { afterEach, expect, it, vi } from 'vitest';
import { createLoadingAttempt } from '../src/render/loadingAttempt';
import { createPreviewOwner } from '../src/render/previewOwner';
afterEach(()=>vi.useRealTimers());
const fixture=()=>({acquire:vi.fn(()=>({ready:Promise.resolve(new Map<string,string>()),release:vi.fn()})),initialize:vi.fn(async()=>({mount:vi.fn(),resize:vi.fn(),destroy:vi.fn()})),fail:false});
it('propagates Resume through loading and owner wrappers only while owned',async()=>{
  vi.useFakeTimers();const resume=vi.fn(),destroy=vi.fn();
  const attempt=createLoadingAttempt({fail:false,acquire:()=>({ready:Promise.resolve(new Map()),release:vi.fn()}),initialize:async()=>({mount:vi.fn(),resize:vi.fn(),resume,destroy})});
  const owner=createPreviewOwner({initialize:attempt.initialize,observeResize:()=>()=>{},onState:vi.fn()});
  owner.resume();expect(resume).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(300);await owner.ready;
  owner.resume();expect(resume).toHaveBeenCalledOnce();owner.dispose();attempt.dispose();owner.resume();expect(resume).toHaveBeenCalledOnce();expect(destroy).toHaveBeenCalledOnce();
});
it('delays readiness at least 300ms and disposes its timer and lease',async()=>{
  vi.useFakeTimers();const f=fixture();const attempt=createLoadingAttempt(f);let ready=false;
  const result=attempt.initialize().then(r=>{ready=true;return r;});await vi.advanceTimersByTimeAsync(299);expect(ready).toBe(false);
  await vi.advanceTimersByTimeAsync(1);expect(ready).toBe(true);(await result).destroy();attempt.dispose();attempt.dispose();expect(f.acquire.mock.results[0]!.value.release).toHaveBeenCalledOnce();
});
it('fails before even querying a warm cache, then permits normal retry',async()=>{
  vi.useFakeTimers();const f=fixture();const bad=createLoadingAttempt({...f,fail:true});const rejected=expect(bad.initialize()).rejects.toThrow('Demonstration');
  await vi.advanceTimersByTimeAsync(300);await rejected;expect(f.acquire).not.toHaveBeenCalled();bad.dispose();
  const retry=createLoadingAttempt(f);const next=retry.initialize();await vi.advanceTimersByTimeAsync(300);await next;expect(f.initialize).toHaveBeenCalledOnce();retry.dispose();
});
it('leaves the menu current when an obsolete attempt resolves and a new generation succeeds',async()=>{
  vi.useFakeTimers();let resolve!:(m:ReadonlyMap<string,string>)=>void;const pending=new Promise<ReadonlyMap<string,string>>(yes=>{resolve=yes;});
  const release=vi.fn();const oldInit=vi.fn();const old=createLoadingAttempt({fail:false,acquire:()=>({ready:pending,release}),initialize:oldInit});
  const staleState=vi.fn();const owner=createPreviewOwner({initialize:old.initialize,observeResize:()=>()=>{},onState:staleState});owner.dispose();old.dispose();
  const f=fixture();const current=createLoadingAttempt(f);const state=vi.fn();const active=createPreviewOwner({initialize:current.initialize,observeResize:()=>()=>{},onState:state});
  resolve(new Map());await owner.ready;await vi.advanceTimersByTimeAsync(300);await active.ready;
  expect(staleState).not.toHaveBeenCalled();expect(oldInit).not.toHaveBeenCalled();expect(release).toHaveBeenCalledOnce();expect(state).toHaveBeenCalledExactlyOnceWith('ready');active.dispose();current.dispose();
});
it('retains its lease until a graphics initializer finishing after disposal is destroyed',async()=>{
  vi.useFakeTimers();let resolve!:(r:{mount:()=>void;resize:()=>void;destroy:()=>void})=>void;
  const pending=new Promise<{mount:()=>void;resize:()=>void;destroy:()=>void}>(yes=>{resolve=yes;});const release=vi.fn(),destroy=vi.fn();
  const attempt=createLoadingAttempt({fail:false,acquire:()=>({ready:Promise.resolve(new Map()),release}),initialize:()=>pending});
  const state=vi.fn();const owner=createPreviewOwner({initialize:attempt.initialize,observeResize:()=>()=>{},onState:state});
  await vi.advanceTimersByTimeAsync(0);owner.dispose();attempt.dispose();expect(release).not.toHaveBeenCalled();
  const mount=vi.fn();resolve({mount,resize:vi.fn(),destroy});await owner.ready;
  expect(mount).not.toHaveBeenCalled();expect(destroy).toHaveBeenCalledOnce();expect(release).toHaveBeenCalledOnce();expect(state).not.toHaveBeenCalled();
});
