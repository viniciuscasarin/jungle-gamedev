import { afterEach, expect, it, vi } from 'vitest';
import { observeHostingBadge } from '../src/ui/hostingBadge';

afterEach(() => vi.unstubAllGlobals());
it('tracks absent, unready, late, resized, hidden and removed badges without polling or residual callbacks', () => {
  const mutations: { callback: (records: unknown[]) => void; disconnect: ReturnType<typeof vi.fn> }[] = [];
  const sizes: { callback: () => void; disconnect: ReturnType<typeof vi.fn> }[] = [];
  const queue = new Map<number, () => void>(); let id = 0;
  const flush = () => { const work = [...queue.values()]; queue.clear(); work.forEach(fn => fn()); };
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { queue.set(++id, fn); return id; });
  vi.stubGlobal('cancelAnimationFrame', (key: number) => queue.delete(key));
  vi.stubGlobal('MutationObserver', class { disconnect = vi.fn(); observe = vi.fn(); constructor(public callback: (records: unknown[]) => void) { mutations.push(this); } });
  vi.stubGlobal('ResizeObserver', class { disconnect = vi.fn(); observe = vi.fn(); constructor(public callback: () => void) { sizes.push(this); } });
  class Frame {
    isConnected = true; matches = () => true; querySelector = () => null;
    addEventListener = vi.fn(); removeEventListener = vi.fn();
    getBoundingClientRect = () => ({ left: 352, top: 228, right: 568, bottom: 320 });
  }
  vi.stubGlobal('Element', Frame);
  let frame: Frame | null = null;
  vi.stubGlobal('document', { body: {}, querySelector: () => frame });
  const add = vi.fn(), remove = vi.fn();
  vi.stubGlobal('window', { innerWidth: 568, innerHeight: 320, addEventListener: add, removeEventListener: remove });
  const style = { display: 'block', visibility: 'visible', opacity: '1', clipPath: 'none' };
  vi.stubGlobal('getComputedStyle', () => style);
  const publish = vi.fn(), stop = observeHostingBadge(publish);
  flush(); expect(publish).toHaveBeenLastCalledWith(null); expect(queue.size).toBe(0);
  frame = new Frame(); style.clipPath = 'path("M 0 0 Z")';
  mutations[1]!.callback([{ addedNodes: [frame], removedNodes: [] }]); flush(); expect(publish).toHaveBeenCalledTimes(1);
  style.clipPath = 'inset(50%)'; mutations[0]!.callback([]); flush(); expect(publish).toHaveBeenCalledTimes(1);
  style.clipPath = 'none'; mutations[0]!.callback([]); mutations[0]!.callback([]);
  expect(queue.size).toBe(1); flush(); expect(publish).toHaveBeenLastCalledWith({ left: 352, top: 228, right: 568, bottom: 320 });
  frame.getBoundingClientRect = () => ({ left: 368, top: 240, right: 600, bottom: 340 });
  sizes[0]!.callback(); flush(); expect(publish).toHaveBeenLastCalledWith({ left: 368, top: 240, right: 568, bottom: 320 });
  style.display = 'none'; mutations[0]!.callback([]); flush(); expect(publish).toHaveBeenLastCalledWith(null);
  style.display = 'block'; mutations[0]!.callback([]); flush();
  const removed = frame; removed.isConnected = false; frame = null;
  mutations[1]!.callback([{ addedNodes: [], removedNodes: [removed] }]); flush(); expect(publish).toHaveBeenLastCalledWith(null);
  sizes[0]!.callback(); stop(); stop(); const calls = publish.mock.calls.length;
  mutations.forEach(observer => observer.callback([])); sizes[0]!.callback(); flush();
  expect(publish).toHaveBeenCalledTimes(calls); expect(queue.size).toBe(0);
  expect(remove).toHaveBeenCalledExactlyOnceWith('resize', add.mock.calls[0]![1]);
});
