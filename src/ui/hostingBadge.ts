/** Observed Netlify integration, not a provider API. Never inspect iframe content. */
const selector = 'iframe#nl-badge-frame';
export interface BadgeOccupancy { left: number; top: number; right: number; bottom: number }

export function observeHostingBadge(publish: (value: BadgeOccupancy | null) => void): () => void {
  let frame: Element | null = null, pending: number | undefined, stopped = false;
  let previous = '';
  const measure = () => {
    pending = undefined;
    if (stopped) return;
    let value: BadgeOccupancy | null = null;
    if (frame?.isConnected) {
      const style = getComputedStyle(frame), rect = frame.getBoundingClientRect();
      // Netlify currently starts with path("M0 0Z") until its ready message.
      const emptyClip = /^path\(["']M\s*0[ ,]+0\s*Z["']\)$/i.test(style.clipPath) || /^inset\(\s*(?:50%|100%)\s*\)$/.test(style.clipPath);
      if (!emptyClip && style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse' && Number(style.opacity) !== 0) {
        const left = Math.max(0, rect.left), top = Math.max(0, rect.top);
        const right = Math.min(window.innerWidth, rect.right), bottom = Math.min(window.innerHeight, rect.bottom);
        if (right > left && bottom > top) value = { left, top, right, bottom };
      }
    }
    const key = JSON.stringify(value);
    if (key !== previous) { previous = key; publish(value); }
  };
  const schedule = () => { if (!stopped && pending === undefined) pending = requestAnimationFrame(measure); };
  const geometry = new ResizeObserver(schedule);
  const attributes = new MutationObserver(schedule);
  const find = () => {
    const next = document.querySelector(selector);
    if (next !== frame) {
      geometry.disconnect(); attributes.disconnect(); frame?.removeEventListener('load', schedule);
      frame = next;
      if (frame) {
        geometry.observe(frame);
        attributes.observe(frame, { attributes: true, attributeFilter: ['style', 'class', 'hidden', 'id'] });
        frame.addEventListener('load', schedule);
      }
    }
    schedule();
  };
  const presence = new MutationObserver(records => {
    if (frame && (!frame.isConnected || !frame.matches(selector))) { find(); return; }
    if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element && (node.matches(selector) || node.querySelector(selector))))) find();
  });
  presence.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', schedule);
  find();
  return () => {
    if (stopped) return;
    stopped = true;
    presence.disconnect(); attributes.disconnect(); geometry.disconnect();
    frame?.removeEventListener('load', schedule);
    window.removeEventListener('resize', schedule);
    if (pending !== undefined) cancelAnimationFrame(pending);
  };
}
