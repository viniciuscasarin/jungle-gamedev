import type { Terrain } from './world/terrain';
import type { GameConfig } from '../domain/config';
import { immutableCopy } from '../domain/immutable';
import type { InitialCombatData, PlayerWeapon, ProjectileSnapshot, ShipSnapshot } from './contracts';
import { hullIsValid, sweepSolid } from './collision';

export type { PlayerWeapon } from './contracts';
export const PLAYER_WEAPONS: readonly PlayerWeapon[] = ['front', 'port', 'starboard'];
export const TIME_EPSILON_MS = 1e-7;

export function captureCombatData(data: InitialCombatData, c: GameConfig, terrain?: Terrain): InitialCombatData {
  if (data.mode !== undefined && data.mode !== 'normal' && data.mode !== 'stationary-targets') throw new RangeError('Invalid simulation mode.');
  const ids = new Set(['player']);
  const id = (value: string) => { if (typeof value !== 'string' || !value.trim() || ids.has(value)) throw new RangeError('Combat IDs must be unique and nonempty.'); ids.add(value); };
  const finite = (...values: number[]) => { if (!values.every(Number.isFinite)) throw new RangeError('Combat numbers must be finite.'); };
  for (const ship of data.enemies ?? []) {
    id(ship.id);
    if (ship.archetype !== 'chaser' && ship.archetype !== 'shooter') throw new RangeError('Invalid enemy archetype.');
    finite(ship.position.xUnits, ship.position.yUnits, ship.headingRadians, ship.health, ship.maxHealth);
    const stats = c.ships[ship.archetype];
    if (ship.maxHealth !== stats.maxHealth || ship.health <= 0 || ship.health > ship.maxHealth || !hullIsValid(ship.position, c, stats.hullRadiusUnits, terrain)) throw new RangeError('Invalid enemy preparation.');
  }
  for (const ball of data.projectiles ?? []) {
    id(ball.id);
    finite(ball.position.xUnits, ball.position.yUnits, ball.headingRadians, ball.damage, ball.radiusUnits, ball.speedUnitsPerSecond, ball.remainingLifetimeMs);
    if (!ball.ownerId.trim() || !['player', 'enemy'].includes(ball.faction) || (ball.faction === 'player') !== (ball.ownerId === 'player') || ball.damage <= 0 || ball.radiusUnits <= 0 || ball.speedUnitsPerSecond <= 0 || ball.remainingLifetimeMs <= 0 || !hullIsValid(ball.position, c, ball.radiusUnits, terrain)) throw new RangeError('Invalid projectile preparation.');
  }
  return immutableCopy(data);
}

export function emitWeapon(ship: ShipSnapshot, weapon: PlayerWeapon | 'shooter', c: GameConfig, nextId: () => string, terrain?: Terrain): ProjectileSnapshot[] {
  const settings = c.weapons[weapon], radius = c.projectiles.radiusUnits;
  const f = { x: Math.cos(ship.headingRadians), y: Math.sin(ship.headingRadians) };
  const direction = weapon === 'front' || weapon === 'shooter' ? f : weapon === 'port' ? { x: f.y, y: -f.x } : { x: -f.y, y: f.x };
  const balls: ProjectileSnapshot[] = [];
  for (let index = 0; index < settings.projectileCount; index++) {
    const longitudinal = weapon === 'port' || weapon === 'starboard' ? (index - 1) * c.weapons[weapon].longitudinalSpacingUnits : 0;
    const origin = { xUnits: ship.position.xUnits + longitudinal * f.x, yUnits: ship.position.yUnits + longitudinal * f.y };
    const distance = Math.sqrt((c.ships[ship.archetype].hullRadiusUnits + radius + c.projectiles.muzzleClearanceUnits) ** 2 - longitudinal ** 2);
    const displacement = { x: direction.x * distance, y: direction.y * distance };
    const position = { xUnits: origin.xUnits + displacement.x, yUnits: origin.yUnits + displacement.y };
    const id = nextId();
    if (sweepSolid(origin, displacement, radius, c, terrain) !== undefined || !hullIsValid(position, c, radius, terrain)) continue;
    balls.push({ id, ownerId: ship.id, faction: ship.archetype === 'player' ? 'player' : 'enemy', damage: settings.damage, speedUnitsPerSecond: settings.projectileSpeedUnitsPerSecond, radiusUnits: radius, position, headingRadians: Math.atan2(direction.y, direction.x), remainingLifetimeMs: settings.projectileLifetimeMs });
  }
  return balls;
}

/** The URL adapter selects these data before creation; all rules remain unchanged. */
export function diagnosticTargets(c: GameConfig): InitialCombatData {
  return immutableCopy({ mode: 'stationary-targets', enemies: ([['front-target', 'chaser', 480, 145], ['port-target', 'shooter', 350, 270], ['starboard-target', 'shooter', 610, 270]] as const).map(([id, archetype, xUnits, yUnits]) => ({ id, archetype, position: { xUnits, yUnits }, headingRadians: Math.PI / 2, health: c.ships[archetype].maxHealth, maxHealth: c.ships[archetype].maxHealth })) });
}
