import { isProceduralWorld } from '../domain/config';
import type { Terrain } from './world/terrain';
import type { Navigator } from './navigation';
import type { GameConfig } from '../domain/config';
import type { ShipSnapshot, SpawnReservation, WorldPoint } from './contracts';
import { hullIsValid } from './collision';
import { distanceBetween, findRoute } from './navigation';
import { TIME_EPSILON_MS } from './combat';

/** Mulberry32: uint32 state, including zero. Terrain never consumes this stream. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (state + 0x6d2b79f5) >>> 0; let value=state; value=Math.imul(value ^ value >>> 15,value | 1);value ^= value + Math.imul(value ^ value >>> 7,value | 61);return ((value ^ value >>> 14) >>> 0) / 4294967296; };
}
export function spawnIsSafe(position: WorldPoint, archetype: 'chaser'|'shooter', player: ShipSnapshot, enemies: readonly ShipSnapshot[], reservations: readonly SpawnReservation[], c: GameConfig, terrain?: Terrain, navigation?: Navigator): boolean {
  const r=c.ships[archetype].hullRadiusUnits;
  return hullIsValid(position,c,r+c.navigation.clearanceUnits,terrain)
    && distanceBetween(position,player.position) + TIME_EPSILON_MS >= c.spawn.minimumPlayerDistanceUnits
    && [player,...enemies].every(ship => distanceBetween(position,ship.position) > r+c.ships[ship.archetype].hullRadiusUnits+c.navigation.separationMarginUnits)
    && reservations.every(reservation => distanceBetween(position,reservation.position) > r+c.ships[reservation.archetype].hullRadiusUnits+c.navigation.separationMarginUnits)
    && (!('maximumPlayerDistanceUnits' in c.spawn) || distanceBetween(position,player.position) <= c.spawn.maximumPlayerDistanceUnits + TIME_EPSILON_MS)
    && (navigation ? navigation.findRoute(position,player.position,r) : findRoute(position,player.position,r,c)).length > 0;
}
export function createDirector(seed: number,c: GameConfig,nextId: () => string, terrain?: Terrain, navigation?: Navigator) {
  const random=createRandom(seed); let nextOpportunity=c.options.enemySpawnIntervalMs, sequence=0;
  return (time: number, player: ShipSnapshot, enemies: readonly ShipSnapshot[], previous: readonly SpawnReservation[]) => {
    let ships=[...enemies]; const reservations: SpawnReservation[]=[];
    if(player.health<=0) return {enemies:ships,reservations};
    for(const reservation of previous) {
      if(time+TIME_EPSILON_MS<reservation.materializeAtMs) {reservations.push(reservation);continue;}
      if(!spawnIsSafe(reservation.position,reservation.archetype,player,ships,previous.filter(r=>r.id!==reservation.id),c,terrain,navigation))continue;
      const stats=c.ships[reservation.archetype];
      ships=[...ships,{id:nextId(),archetype:reservation.archetype,position:reservation.position,headingRadians:Math.atan2(player.position.yUnits-reservation.position.yUnits,player.position.xUnits-reservation.position.xUnits),health:stats.maxHealth,maxHealth:stats.maxHealth}];sequence++;
    }
    if(time+TIME_EPSILON_MS>=nextOpportunity) {
      // Absolute cadence. Missed opportunities are discarded, never queued.
      do {nextOpportunity+=c.options.enemySpawnIntervalMs;} while(time+TIME_EPSILON_MS>=nextOpportunity);
      const archetype=c.spawn.archetypeSequence[sequence%c.spawn.archetypeSequence.length]!;
      const inset=c.ships[archetype].hullRadiusUnits+c.navigation.clearanceUnits*2;
      const finiteWorld = !isProceduralWorld(c.world) ? c.world : undefined;
      const width=(finiteWorld?.widthUnits ?? 0)-2*inset,height=(finiteWorld?.heightUnits ?? 0)-2*inset;
      for(let attempt=0;attempt<c.director.candidateAttempts;attempt++) {
        const sample = random(), t=sample*2*(width+height);
        const angle = sample * Math.PI * 2;
        const radius = c.spawn.minimumPlayerDistanceUnits + (finiteWorld ? 0 : random()) * (('maximumPlayerDistanceUnits' in c.spawn ? c.spawn.maximumPlayerDistanceUnits : 520) - c.spawn.minimumPlayerDistanceUnits);
        const position=!finiteWorld ? { xUnits: player.position.xUnits + Math.cos(angle)*radius, yUnits: player.position.yUnits + Math.sin(angle)*radius } : t<width?{xUnits:inset+t,yUnits:inset}:t<width+height?{xUnits:inset+width,yUnits:inset+t-width}:t<2*width+height?{xUnits:inset+2*width+height-t,yUnits:inset+height}:{xUnits:inset,yUnits:inset+2*(width+height)-t};
        if(spawnIsSafe(position,archetype,player,ships,reservations,c,terrain,navigation)) {reservations.push({id:nextId(),archetype,position,createdAtMs:time,materializeAtMs:time+c.spawn.telegraphMs});break;}
      }
    }
    return {enemies:ships,reservations};
  };
}
