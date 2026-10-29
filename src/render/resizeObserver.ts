/** One subscription group per live resource; rearm the media query after DPR changes. */
export function observeArenaResize(host: HTMLElement, resize: () => void): () => void {
  const observer = new ResizeObserver(resize);
  let query: MediaQueryList | undefined;
  let stopped = false;
  const densityChanged = () => { if (stopped) return; arm(); resize(); };
  const arm = () => {
    query?.removeEventListener('change', densityChanged);
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    query.addEventListener('change', densityChanged);
  };
  try {
    observer.observe(host);
    host.parentElement?.querySelectorAll('[data-hud-band]').forEach(band => observer.observe(band, {box: 'border-box'}));
    window.addEventListener('resize', resize); arm();
  } catch (error) {
    observer.disconnect(); window.removeEventListener('resize', resize);
    query?.removeEventListener('change', densityChanged); throw error;
  }
  return () => {
    if (stopped) return;
    stopped = true; observer.disconnect(); window.removeEventListener('resize', resize);
    query?.removeEventListener('change', densityChanged);
  };
}
