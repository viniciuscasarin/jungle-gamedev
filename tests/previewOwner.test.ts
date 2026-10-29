import { describe, expect, it, vi } from 'vitest';
import { createPreviewOwner } from '../src/render/previewOwner';
import type { PreviewResource } from '../src/render/previewOwner';

function deferred() {
  let resolve!: (resource: PreviewResource) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<PreviewResource>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture() {
  const init = deferred();
  const resource = { mount: vi.fn(), resize: vi.fn(), pause: vi.fn(), resume: vi.fn(), destroy: vi.fn() };
  const stop = vi.fn();
  let resize: (() => void) | undefined;
  const observeResize = vi.fn((callback: () => void) => { resize = callback; return stop; });
  const onState = vi.fn();
  const owner = createPreviewOwner({ initialize: () => init.promise, observeResize, onState });
  return { init, resource, stop, observeResize, onState, owner, resize: () => resize?.() };
}
describe('async preview ownership', () => {
  it('mounts once, resizes and releases subscriptions and resource exactly once', async () => {
    const f = fixture();
    f.init.resolve(f.resource);
    await f.owner.ready;
    expect(f.resource.mount).toHaveBeenCalledOnce();
    expect(f.onState).toHaveBeenCalledWith('ready');
    f.resize();
    expect(f.resource.resize).toHaveBeenCalledTimes(2);
    f.owner.dispose(); f.owner.dispose(); f.resize();
    expect(f.stop).toHaveBeenCalledOnce();
    expect(f.resource.destroy).toHaveBeenCalledOnce();
    expect(f.resource.resize).toHaveBeenCalledTimes(2);
  });
  it('discards late resolution without mounting or subscribing', async () => {
    const f = fixture();
    f.owner.dispose();
    f.init.resolve(f.resource);
    await f.owner.ready;
    expect(f.resource.destroy).toHaveBeenCalledOnce();
    expect(f.resource.mount).not.toHaveBeenCalled();
    expect(f.observeResize).not.toHaveBeenCalled();
    expect(f.onState).not.toHaveBeenCalled();
  });
  it('reports rejection without an unhandled promise and ignores rejection after disposal', async () => {
    const f = fixture();
    f.init.reject(new Error('No graphics'));
    await f.owner.ready;
    expect(f.onState).toHaveBeenCalledWith('failed');
    f.owner.dispose();
    const late = fixture();
    late.owner.dispose(); late.init.reject(new Error('Late failure'));
    await late.owner.ready;
    expect(late.onState).not.toHaveBeenCalled();
  });
  it.each(['mount', 'resize', 'observe'] as const)('cleans resources if %s fails', async (stage) => {
    const f = fixture();
    const fail = () => { throw new Error('Preview setup failed'); };
    if (stage === 'observe') f.observeResize.mockImplementation(fail);
    else f.resource[stage].mockImplementation(fail);
    f.init.resolve(f.resource);
    await f.owner.ready;
    expect(f.resource.destroy).toHaveBeenCalledOnce();
    expect(f.onState).toHaveBeenCalledWith('failed');
    f.owner.dispose();
    expect(f.resource.destroy).toHaveBeenCalledOnce();
  });
  it('supports the Strict Mode setup/cleanup/setup sequence with pending initialization', async () => {
    const old = fixture(); old.owner.dispose();
    const current = fixture();
    current.init.resolve(current.resource); await current.owner.ready;
    old.init.resolve(old.resource); await old.owner.ready;
    expect(old.resource.mount).not.toHaveBeenCalled();
    expect(old.resource.destroy).toHaveBeenCalledOnce();
    expect(current.resource.mount).toHaveBeenCalledOnce();
    expect(current.resource.destroy).not.toHaveBeenCalled();
    current.owner.dispose();
    expect(current.stop).toHaveBeenCalledOnce();
  });
  it('routes pause and resume only to the current mounted resource, ignoring loading and disposed generations', async () => {
    const old = fixture();
    old.owner.pause(); old.owner.resume();
    expect(old.resource.pause).not.toHaveBeenCalled();
    expect(old.resource.resume).not.toHaveBeenCalled();
    old.owner.dispose(); old.init.resolve(old.resource); await old.owner.ready;
    old.owner.pause(); old.owner.resume();
    expect(old.resource.pause).not.toHaveBeenCalled();
    expect(old.resource.resume).not.toHaveBeenCalled();
    const current = fixture(); current.init.resolve(current.resource); await current.owner.ready;
    current.owner.pause(); current.owner.resume();
    expect(current.resource.pause).toHaveBeenCalledOnce();
    expect(current.resource.resume).toHaveBeenCalledOnce();
    expect(current.resource.mount).toHaveBeenCalledOnce();
    expect(current.observeResize).toHaveBeenCalledOnce();
    current.owner.dispose(); current.owner.pause(); current.owner.resume();
    expect(current.resource.pause).toHaveBeenCalledOnce();
    expect(current.resource.resume).toHaveBeenCalledOnce();
    expect(current.resource.destroy).toHaveBeenCalledOnce();
  });
});
