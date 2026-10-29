export interface Point { readonly x: number; readonly y: number }
export interface Insets { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number }
export type Viewport = { readonly renderable: false } | {
  readonly renderable: true; readonly scale: number; readonly offsetX: number; readonly offsetY: number;
  readonly availableWidth: number; readonly availableHeight: number;
};
export const RESERVED_INSETS: Insets = { top: 48, right: 0, bottom: 88, left: 0 };

/** Screen coordinates are CSS pixels relative to the host, independent of DPR. */
export function fitViewport(width: number, height: number, worldWidth: number, worldHeight: number, insets: Insets = RESERVED_INSETS): Viewport {
  const values = [width, height, worldWidth, worldHeight, ...Object.values(insets)];
  if (values.some(value => !Number.isFinite(value) || value < 0) || worldWidth === 0 || worldHeight === 0) return { renderable: false };
  const availableWidth = width - insets.left - insets.right;
  const availableHeight = height - insets.top - insets.bottom;
  if (availableWidth <= 0 || availableHeight <= 0) return { renderable: false };
  const scale = Math.min(availableWidth / worldWidth, availableHeight / worldHeight);
  return { renderable: true, scale, availableWidth, availableHeight, offsetX: insets.left + (availableWidth - worldWidth * scale) / 2, offsetY: insets.top + (availableHeight - worldHeight * scale) / 2 };
}
export function worldToScreen(point: Point, viewport: Extract<Viewport, { renderable: true }>): Point {
  return { x: viewport.offsetX + point.x * viewport.scale, y: viewport.offsetY + point.y * viewport.scale };
}
export function screenToWorld(point: Point, viewport: Extract<Viewport, { renderable: true }>): Point {
  return { x: (point.x - viewport.offsetX) / viewport.scale, y: (point.y - viewport.offsetY) / viewport.scale };
}
