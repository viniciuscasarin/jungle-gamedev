import { NEUTRAL_INPUT } from '../simulation/contracts';
import type { StepInput, WorldPoint, SteeringIntent } from '../simulation/contracts';
import type { Viewport } from '../render/viewport';
import { screenToWorld } from '../render/viewport';

export function pointerTarget(clientX: number, clientY: number, origin: { left: number; top: number }, viewport: Viewport, width: number, height: number): WorldPoint | undefined {
  if (!viewport.renderable || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
  const point = screenToWorld({ x: clientX - origin.left, y: clientY - origin.top }, viewport);
  return { xUnits: Math.max(0, Math.min(width, point.x)), yUnits: Math.max(0, Math.min(height, point.y)) };
}
export function createInputBuffer() {
  let target: WorldPoint | undefined, held = false, edges = 0, pause = false, moving = false;
  let direction: Extract<SteeringIntent, {kind: 'direction'}> | undefined, joypad: number | undefined;
  const pauseHeld = new Set<string>();
  const fire = { front: new Set<string>(), port: new Set<string>(), starboard: new Set<string>() };
  const pulses = new Set<keyof typeof fire>();
  const weapon = (code: string) => code === 'KeyQ' ? 'front' : code === 'KeyW' ? 'port' : code === 'KeyE' ? 'starboard' : undefined;
  return {
    point(value: WorldPoint) { target = { ...value }; direction = undefined; },
    toggle() { edges++; },
    pulse(key: keyof typeof fire) { pulses.add(key); },
    attack(key: keyof typeof fire, id: number, active: boolean) { if (active) fire[key].add(`pointer:${id}`); else fire[key].delete(`pointer:${id}`); },
    joyStart(id: number) { if (joypad !== undefined) return false; joypad = id; return true; },
    joyMove(id: number, value: {x: number; y: number} | undefined) { if (joypad !== id) return; moving = !!value; if (value) { direction = {kind: 'direction', ...value}; target = undefined; } },
    joyEnd(id: number) { if (joypad === id) { joypad = undefined; moving = false; } },
    down(repeat: boolean, code = 'KeyR') { const attack = weapon(code); if (attack) { if (!repeat) fire[attack].add('keyboard'); } else if (code === 'KeyR' && !repeat && !held) { held = true; edges++; } else if (['Escape', 'KeyP'].includes(code) && !repeat && !pauseHeld.has(code)) { pauseHeld.add(code); pause = true; } },
    up(code = 'KeyR') { pauseHeld.delete(code); const attack = weapon(code); if (attack) fire[attack].delete('keyboard'); else if (code === 'KeyR') held = false; },
    clear() { target = undefined; direction = undefined; joypad = undefined; moving = false; held = false; edges = 0; pause = false; pauseHeld.clear(); pulses.clear(); for (const sources of Object.values(fire)) sources.clear(); },
    inspect: () => target ? Object.freeze({ ...target }) : undefined,
    sources: () => ({joypad: joypad ?? null, moving, direction: direction ? {...direction} : null, fire: Object.fromEntries(Object.entries(fire).map(([key, values]) => [key, [...values]]))}),
    consume(): StepInput {
      const toggle = edges > 0; if (toggle) edges--;
      const pausePressed = pause; pause = false;
      const firing = {front: fire.front.size > 0 || pulses.has('front'), port: fire.port.size > 0 || pulses.has('port'), starboard: fire.starboard.size > 0 || pulses.has('starboard')}; pulses.clear();
      return { ...NEUTRAL_INPUT, movementRequested: moving, fire: firing, steering: direction ? {...direction} : target ? { kind: 'target', target: { ...target } } : { kind: 'none' }, toggleAutoSailPressed: toggle, pausePressed };
    },
  };
}
export function acceptsGameKey(event: KeyboardEvent, host: HTMLElement): boolean {
  const target = event.target;
  return ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'Escape', 'KeyP'].includes(event.code) && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && target instanceof HTMLElement && host.contains(target) && host.contains(document.activeElement) && !!target.closest('.arena-host, [data-control]') && !target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]');
}
