export interface OrientationState { readonly coarse: boolean; readonly width: number; readonly height: number; readonly blocked: boolean }
export function orientationState(coarse: boolean, width: number, height: number): OrientationState {
  return { coarse, width, height, blocked: coarse && width <= height };
}
export function createOrientationAdapter(environment: { read(): OrientationState; listen(update: () => void): () => void }) {
  let state = environment.read();
  const listeners = new Set<() => void>();
  const update = () => {
    const next = environment.read();
    if (next.coarse === state.coarse && next.width === state.width && next.height === state.height) return;
    state = next; for (const listener of listeners) listener();
  };
  const stop = environment.listen(update);
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { stop(); listeners.clear(); },
  };
}

export interface LandscapeEnvironment {
  lock?: () => Promise<void>;
  fullscreen?: () => Promise<void>;
  isFullscreen(): boolean;
}
/** Called only from an explicit action. The effective viewport remains authoritative. */
export async function requestLandscape(environment: LandscapeEnvironment): Promise<boolean> {
  if (!environment.lock) return false;
  try { await environment.lock(); return true; }
  catch {
    if (!environment.fullscreen || environment.isFullscreen()) return false;
    try { await environment.fullscreen(); await environment.lock(); return true; }
    catch { return false; }
  }
}
