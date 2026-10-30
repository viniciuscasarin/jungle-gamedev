import type { Terrain } from './world/terrain';
import type { Navigator } from './navigation';
import { createHullIndex } from './hullIndex';
import type { GameConfig } from '../domain/config';
import type { ShipSnapshot, WorldPoint } from './contracts';
import { CONTACT_EPSILON, hullIsValid, moveHull, sweepCircle } from './collision';
import { distanceBetween, findRoute, segmentIsSafe } from './navigation';
import { TIME_EPSILON_MS } from './combat';

export function normalizeAngle(angle: number): number {
  const wrapped=((angle+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  return wrapped<=-Math.PI?Math.PI:wrapped;
}
export function lineOfSight(ship: ShipSnapshot, target: ShipSnapshot, c: GameConfig, terrain?: Terrain): boolean {
  return segmentIsSafe(ship.position,target.position,c.projectiles.radiusUnits,c,terrain);
}
interface Intent { mode: 'hold'|'approach'|'retreat'; route: readonly WorldPoint[]; plannedAt: number; destination: WorldPoint; deadline?: number }
export function createEnemyBehavior(c: GameConfig, terrain?: Terrain, navigation?: Navigator) {
  const states=new Map<string,Intent>();
  return {
    prune(enemies: readonly ShipSnapshot[]) {const live=new Set(enemies.map(e=>e.id));for(const id of states.keys())if(!live.has(id))states.delete(id);},
    move(ship: ShipSnapshot,player: ShipSnapshot,enemies: readonly ShipSnapshot[],time: number): ShipSnapshot {
      const d=distanceBetween(ship.position,player.position), stats=c.ships[ship.archetype];
      let state=states.get(ship.id);if(!state){state={mode:'hold',route:[],plannedAt:-Infinity,destination:player.position};states.set(ship.id,state);}
      let destination=player.position, moving=true;
      if (ship.archetype === 'shooter' && d > c.shooter.preferredDistanceUnits + c.shooter.hysteresisUnits) state.mode = 'approach';
      if(ship.archetype==='shooter' && d <= c.shooter.preferredDistanceUnits + c.shooter.hysteresisUnits && segmentIsSafe(ship.position,player.position,stats.hullRadiusUnits+c.navigation.clearanceUnits,c,terrain)) {
        const preferred=c.shooter.preferredDistanceUnits;
        if(state.mode==='approach' && d<=preferred || state.mode==='retreat' && d>=preferred)state.mode='hold';
        if(d>preferred+c.shooter.hysteresisUnits)state.mode='approach';
        if(d<preferred-c.shooter.hysteresisUnits)state.mode='retreat';
        moving=state.mode!=='hold';
        if(state.mode==='retreat') {
          const away=d>CONTACT_EPSILON?{x:(ship.position.xUnits-player.position.xUnits)/d,y:(ship.position.yUnits-player.position.yUnits)/d}:{x:1,y:0};
          destination={xUnits:player.position.xUnits+away.x*preferred,yUnits:player.position.yUnits+away.y*preferred};
          if(!hullIsValid(destination,c,stats.hullRadiusUnits+c.navigation.clearanceUnits,terrain)) {
            // Choose a reachable lateral water destination when the ideal retreat is on land.
            const choices=[-Math.PI/2,Math.PI/2,Math.PI].map(a=>({xUnits:ship.position.xUnits+(away.x*Math.cos(a)-away.y*Math.sin(a))*preferred,yUnits:ship.position.yUnits+(away.x*Math.sin(a)+away.y*Math.cos(a))*preferred}));
            destination=choices.find(p=>hullIsValid(p,c,stats.hullRadiusUnits+c.navigation.clearanceUnits,terrain)) ?? ship.position;
          }
        }
      }
      let target=player.position;
      if(moving) {
        if(time-state.plannedAt+c.timing.fixedStepMs*0.01>=c.navigation.replanMs || !state.route.length || distanceBetween(destination,state.destination)>c.navigation.waypointSpacingUnits) {
          state.route=navigation ? navigation.findRoute(ship.position,destination,stats.hullRadiusUnits) : findRoute(ship.position,destination,stats.hullRadiusUnits,c);state.destination=destination;state.plannedAt=time;
        }
        while(state.route.length>1 && distanceBetween(ship.position,state.route[0]!)<c.navigation.waypointSpacingUnits/2 && segmentIsSafe(ship.position,state.route[1]!,stats.hullRadiusUnits,c,terrain))state.route=state.route.slice(1);
        const waypoint=state.route[0];
        if(waypoint && segmentIsSafe(ship.position,waypoint,stats.hullRadiusUnits,c,terrain))target=waypoint;else moving=false;
      }
      let dx=target.xUnits-ship.position.xUnits,dy=target.yUnits-ship.position.yUnits;
      if(moving) for(const other of enemies) {
        if(other.id===ship.id)continue;
        const separation=stats.hullRadiusUnits+c.ships[other.archetype].hullRadiusUnits+c.navigation.waypointSpacingUnits;
        if (Math.abs(ship.position.xUnits-other.position.xUnits) >= separation || Math.abs(ship.position.yUnits-other.position.yUnits) >= separation) continue;
        const gap=distanceBetween(ship.position,other.position);
        if(gap>CONTACT_EPSILON && gap<separation) {const force=(separation-gap)/gap;dx+=(ship.position.xUnits-other.position.xUnits)*force;dy+=(ship.position.yUnits-other.position.yUnits)*force;}
      }
      const desired=Math.atan2(dy,dx),error=normalizeAngle(desired-ship.headingRadians),limit=stats.turnSpeedRadiansPerSecond*c.timing.fixedStepMs/1000;
      const headingRadians=normalizeAngle(ship.headingRadians+Math.max(-limit,Math.min(limit,error)));
      const distance=moving?Math.min(Math.hypot(dx,dy),stats.forwardSpeedUnitsPerSecond*c.timing.fixedStepMs/1000)*Math.max(0,Math.cos(error)):0;
      return {...ship,headingRadians,position:moveHull(ship.position,{x:Math.cos(headingRadians)*distance,y:Math.sin(headingRadians)*distance},c,stats.hullRadiusUnits,terrain)};
    },
    canFire(ship: ShipSnapshot,player: ShipSnapshot,time: number): boolean {
      const state=states.get(ship.id);if(!state || ship.archetype!=='shooter')return false;
      if(distanceBetween(ship.position,player.position)>c.shooter.attackRangeUnits+CONTACT_EPSILON){delete state.deadline;return false;}
      if(state.deadline===undefined)state.deadline=time+c.weapons.shooter.cooldownMs;
      const aim=Math.atan2(player.position.yUnits-ship.position.yUnits,player.position.xUnits-ship.position.xUnits);
      if(time+TIME_EPSILON_MS<state.deadline || Math.abs(normalizeAngle(aim-ship.headingRadians))>c.shooter.aimToleranceRadians+CONTACT_EPSILON || !lineOfSight(ship,player,c,terrain))return false;
      return true;
    },
    recordShot(ship: ShipSnapshot,time: number) {
      const state=states.get(ship.id);
      if(state && ship.archetype==='shooter')state.deadline=time+c.weapons.shooter.cooldownMs;
    },
  };
}

/** Swept hull barrier; the player is never displaced by an enemy correction. */
export function constrainHull(before: ShipSnapshot, proposed: ShipSnapshot, others: readonly ShipSnapshot[], c: GameConfig, contact: (other: ShipSnapshot)=>void, terrain?: Terrain): ShipSnapshot {
  const r=c.ships[before.archetype].hullRadiusUnits;
  let displacement={x:proposed.position.xUnits-before.position.xUnits,y:proposed.position.yUnits-before.position.yUnits};
  let position=before.position;
  for(let iteration=0;iteration<3;iteration++) {
    let earliest=1,hit: ShipSnapshot|undefined;
    for(const other of others) {
      const combined=r+c.ships[other.archetype].hullRadiusUnits;
      const t=sweepCircle(position,displacement,other.position,combined);
      if(t===0 && distanceBetween(position,other.position)>=combined-CONTACT_EPSILON && (position.xUnits-other.position.xUnits)*displacement.x+(position.yUnits-other.position.yUnits)*displacement.y>=-CONTACT_EPSILON) {contact(other);continue;}
      if(t!==undefined && t<=earliest){earliest=t;hit=other;}
    }
    if(!hit){position=moveHull(position,displacement,c,r,terrain);break;}
    contact(hit);
    const length=Math.hypot(displacement.x,displacement.y),travel=Math.max(0,earliest-(length?c.navigation.separationMarginUnits/length:0));
    position=moveHull(position,{x:displacement.x*travel,y:displacement.y*travel},c,r,terrain);
    const dx=position.xUnits-hit.position.xUnits,dy=position.yUnits-hit.position.yUnits,d=Math.hypot(dx,dy);
    if(d<=CONTACT_EPSILON)break;
    const normal={x:dx/d,y:dy/d};displacement={x:displacement.x*(1-earliest),y:displacement.y*(1-earliest)};
    const dot=displacement.x*normal.x+displacement.y*normal.y;
    if(dot<0)displacement={x:displacement.x-dot*normal.x,y:displacement.y-dot*normal.y};else break;
  }
  return {...proposed,position};
}
export function separateHulls(player: ShipSnapshot,enemies: readonly ShipSnapshot[],c: GameConfig, terrain?: Terrain): ShipSnapshot[] {
  const result=[...enemies].sort((a,b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const index = createHullIndex([player, ...result]), maxRadius = Math.max(...Object.values(c.ships).map(s => s.hullRadiusUnits));
  for(let i=0;i<result.length;i++) {
    const ship=result[i]!,r=c.ships[ship.archetype].hullRadiusUnits;
    const neighbors = index.near(ship.position, r + maxRadius, ship.id);
    if (!neighbors.length) continue;
    const others = neighbors.every(other => distanceBetween(ship.position,other.position)>=r+c.ships[other.archetype].hullRadiusUnits-CONTACT_EPSILON) ? neighbors : index.near(ship.position, c.navigation.separationIterations * (r + c.navigation.separationMarginUnits) + r + maxRadius, ship.id);
    if(others.every(other=>distanceBetween(ship.position,other.position)>=r+c.ships[other.archetype].hullRadiusUnits-CONTACT_EPSILON))continue;
    // Bounded deterministic search repairs malformed coincident preparations too.
    let found: WorldPoint|undefined;
    for(let ring=1;ring<=c.navigation.separationIterations && !found;ring++)for(let angle=0;angle<16;angle++) {
      const a=angle*Math.PI/8,travel=ring*(r+c.navigation.separationMarginUnits);
      const p={xUnits:ship.position.xUnits+Math.cos(a)*travel,yUnits:ship.position.yUnits+Math.sin(a)*travel};
      if(others.every(other=>{
        const combined=r+c.ships[other.archetype].hullRadiusUnits;
        if(distanceBetween(p,other.position)<=combined+c.navigation.separationMarginUnits)return false;
        return distanceBetween(ship.position,other.position)<combined ? distanceBetween(p,other.position)>distanceBetween(ship.position,other.position) : sweepCircle(ship.position,{x:p.xUnits-ship.position.xUnits,y:p.yUnits-ship.position.yUnits},other.position,combined)===undefined;
      }) && segmentIsSafe(ship.position,p,r,c,terrain)){found=p;break;}
    }
    if(found) { result[i]={...ship,position:found}; index.update(result[i]!); }
  }
  return result;
}
