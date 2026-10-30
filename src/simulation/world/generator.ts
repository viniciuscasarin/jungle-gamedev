import { immutableCopy } from '../../domain/immutable';
import type { GeneratedRegion, ProceduralWorldDescriptor, RegionCoordinates } from './types';
import { rotatedModel } from './geometry';

export function regionAt(xUnits: number, yUnits: number, size: number): RegionCoordinates {
  if (![xUnits, yUnits, size].every(Number.isFinite) || size <= 0) throw new RangeError('Invalid region coordinates.');
  const x = Math.floor(xUnits / size), y = Math.floor(yUnits / size);
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) throw new RangeError('Region outside representable coordinates.');
  return { x: x || 0, y: y || 0 };
}
/** Hash the complete signed decimal indices, with a separate random domain. */
function regionHash(version: string, seed: number, region: RegionCoordinates): number {
  let hash = 2166136261;
  for (const char of `terrain:${version}:${seed}:${region.x}:${region.y}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x7feb352d); hash ^= hash >>> 15;
  return hash >>> 0;
}
export function generateRegion(world: ProceduralWorldDescriptor, seed: number, coordinates: RegionCoordinates): GeneratedRegion {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295 || !Number.isSafeInteger(coordinates.x) || !Number.isSafeInteger(coordinates.y)) throw new RangeError('Invalid terrain preparation.');
  const initial = regionAt(world.playerStart.xUnits, world.playerStart.yUnits, world.regionSizeUnits);
  const choices = initial.x === coordinates.x && initial.y === coordinates.y ? world.layouts.filter(l => world.initialLayoutIds.includes(l.id)) : world.layouts;
  const layout = choices[regionHash(world.generatorVersion, seed, coordinates) % choices.length];
  if (!layout) throw new RangeError('Missing approved regional layout.');
  const id = `${coordinates.x}:${coordinates.y}`;
  return immutableCopy({ id, coordinates, layoutId: layout.id, islands: layout.slots.map((slot, index) => {
    const model = world.catalog.find(m => m.id === slot.modelId);
    if (!model || !model.rotations.includes(slot.rotation)) throw new RangeError('Invalid island model.');
    return { id: `${id}:${index}`, region: coordinates, modelId: model.id, rotation: slot.rotation,
      ...rotatedModel(model, slot.rotation), origin: { xUnits: coordinates.x * world.regionSizeUnits + slot.origin.xUnits, yUnits: coordinates.y * world.regionSizeUnits + slot.origin.yUnits } };
  }) });
}
