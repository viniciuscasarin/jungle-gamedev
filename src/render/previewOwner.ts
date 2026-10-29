export interface PreviewResource {
  mount(): void;
  resize(): void;
  resume?(): void;
  pause?(): void;
  destroy(): void;
}
export interface PreviewDependencies {
  initialize(): Promise<PreviewResource>;
  observeResize(resize: () => void): () => void;
  onState(state: 'ready' | 'failed'): void;
}

/** One owner per effect. Initialization cannot attach before cancellation is checked. */
export function createPreviewOwner(dependencies: PreviewDependencies): { dispose(): void; ready: Promise<void>; resume(): void; pause(): void } {
  let disposed = false;
  let resource: PreviewResource | undefined;
  let stopObserving: (() => void) | undefined;
  const release = (): void => {
    stopObserving?.();
    stopObserving = undefined;
    resource?.destroy();
    resource = undefined;
  };
  const ready = (async () => {
    try {
      const initialized = await dependencies.initialize();
      if (disposed) { initialized.destroy(); return; }
      resource = initialized;
      resource.mount();
      resource.resize();
      stopObserving = dependencies.observeResize(() => { if (!disposed) resource?.resize(); });
      dependencies.onState('ready');
    } catch {
      release();
      if (!disposed) dependencies.onState('failed');
    }
  })();
  return { ready, pause() { if (!disposed) resource?.pause?.(); }, resume() { if (!disposed) resource?.resume?.(); }, dispose() { if (disposed) return; disposed = true; release(); } };
}
