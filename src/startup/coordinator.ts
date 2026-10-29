import type { StartupResource } from './manifest';
import { withDeadline } from './deadline';

export interface StartupState {
  readonly phase: 'loading' | 'ready' | 'failed';
  readonly total: number;
  readonly completed: number;
  readonly progress: number;
  readonly failures: readonly string[];
  readonly silent: readonly string[];
  readonly generation: number;
}

export function createStartupCoordinator(
  input: readonly StartupResource[],
  prepare: (resource: StartupResource) => Promise<unknown>,
  timeoutMs = 30_000,
) {
  const resources = [...new Map(input.map(resource => [resource.url, resource])).values()];
  const complete = new Set<string>(), silent = new Set<string>();
  const listeners = new Set<() => void>();
  let generation = 0, bootstrapReady = false, disposed = false;
  let snapshot: StartupState = { phase: 'loading', total: resources.length, completed: 0, progress: 0, failures: [], silent: [], generation };
  function publish(failures = snapshot.failures) {
    const ready = bootstrapReady && complete.size === resources.length;
    snapshot = {
      phase: failures.length ? 'failed' : ready ? 'ready' : 'loading',
      total: resources.length, completed: complete.size,
      progress: ready ? 100 : Math.min(99, Math.floor(100 * complete.size / Math.max(1, resources.length))),
      failures: [...failures], silent: [...silent], generation,
    };
    for (const listener of listeners) listener();
  }
  async function retry() {
    if (disposed) return;
    const attempt = ++generation;
    publish([]);
    await Promise.all(resources.filter(resource => !complete.has(resource.url)).map(async resource => {
      try {
        const result = await withDeadline(Promise.resolve().then(() => prepare(resource)), timeoutMs);
        if (disposed || attempt !== generation) return;
        complete.add(resource.url);
        if (resource.kind === 'audio' && result === null) silent.add(resource.url);
        publish();
      } catch {
        if (disposed || attempt !== generation) return;
        if (resource.kind === 'audio') { complete.add(resource.url); silent.add(resource.url); publish(); }
        else publish([...snapshot.failures, resource.url]);
      }
    }));
  }
  return {
    retry,
    markBootstrapReady() { if (!disposed) { bootstrapReady = true; publish(); } },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { disposed = true; generation++; listeners.clear(); },
  };
}
