import type { createInputBuffer } from './desktop';
export type InputMode = 'desktop' | 'touch';
export function joypadDirection(x: number, y: number, radius: number, deadZone = 0.15) {
  if (![x, y, radius, deadZone].every(Number.isFinite) || radius <= 0 || deadZone < 0) return;
  const length = Math.hypot(x, y);
  if (length <= radius * deadZone) return;
  return { x: x / length, y: y / length };
}
/** Native capture belongs to the original control; each release removes one source. */
export function createTouchAdapter(input: ReturnType<typeof createInputBuffer>, enabled: () => boolean, selectMode: (mode: InputMode) => void, deadZone = 0.15) {
  const contacts = new Map<number, {element: HTMLElement; control: string}>();
  const move = (event: PointerEvent) => {
    const contact = contacts.get(event.pointerId);
    if (!contact || contact.control !== 'joypad') return;
    const rect = contact.element.getBoundingClientRect();
    input.joyMove(event.pointerId, joypadDirection(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2, Math.min(rect.width, rect.height) / 2, deadZone));
  };
  const end = (event: PointerEvent, validUp: boolean) => {
    const contact = contacts.get(event.pointerId); if (!contact) return;
    contacts.delete(event.pointerId);
    const {element, control} = contact;
    if (control === 'joypad') input.joyEnd(event.pointerId);
    else if (control === 'R') {
      const r = element.getBoundingClientRect();
      if (validUp && enabled() && event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) input.toggle();
    } else input.attack(control as 'front' | 'port' | 'starboard', event.pointerId, false);
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  };
  return {
    down(event: PointerEvent, element: HTMLElement, control: string) {
      if (!enabled() || event.pointerType !== 'touch') return;
      selectMode('touch');
      if (contacts.has(event.pointerId)) return;
      if (control === 'joypad' && !input.joyStart(event.pointerId)) {
        // Touch implicitly captures the original child (for example the thumb).
        // An unowned extra finger must not retain that native capture.
        const target = event.target as HTMLElement | null;
        if (target?.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
        event.preventDefault(); return;
      }
      contacts.set(event.pointerId, {element, control});
      element.setPointerCapture(event.pointerId); event.preventDefault();
      if (control !== 'joypad' && control !== 'R') input.attack(control as 'front' | 'port' | 'starboard', event.pointerId, true);
      move(event);
    },
    move,
    up: (event: PointerEvent) => end(event, true),
    cancel: (event: PointerEvent) => end(event, false),
    clear() { for (const [pointerId, {element}] of contacts) { contacts.delete(pointerId); if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId); } input.clear(); },
    inspect: () => [...contacts].map(([id, c]) => ({id, control: c.control, captured: c.element.hasPointerCapture(id)})),
  };
}
