import { createOrientationAdapter, orientationState, requestLandscape } from './orientation';

const pointer = typeof window === 'undefined' ? undefined : window.matchMedia('(pointer: coarse)');
export const orientation = createOrientationAdapter({
  read: () => typeof window === 'undefined' ? orientationState(false, 0, 0) : orientationState(pointer!.matches, window.visualViewport?.width ?? window.innerWidth, window.visualViewport?.height ?? window.innerHeight),
  listen(update) {
    if (typeof window === 'undefined') return () => {};
    const targets: [EventTarget, string][] = [
      [window, 'resize'], [window, 'orientationchange'], [window, 'pageshow'],
      [document, 'visibilitychange'], [document, 'fullscreenchange'], [pointer!, 'change'],
    ];
    if (window.visualViewport) targets.push([window.visualViewport, 'resize']);
    for (const [target, event] of targets) target.addEventListener(event, update);
    return () => { for (const [target, event] of targets) target.removeEventListener(event, update); };
  },
});

export function enterLandscape(): Promise<boolean> {
  const screenOrientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
  return requestLandscape({
    ...(screenOrientation?.lock ? { lock: () => screenOrientation.lock!('landscape') } : {}),
    ...(document.fullscreenEnabled && document.documentElement.requestFullscreen ? { fullscreen: () => document.documentElement.requestFullscreen() } : {}),
    isFullscreen: () => !!document.fullscreenElement,
  });
}
if (import.meta.hot) import.meta.hot.dispose(() => orientation.dispose());
