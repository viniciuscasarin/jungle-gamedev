import { expect, it } from 'vitest';
import { createMatchSetup } from '../src/domain/config';
import { HISTORICAL_FINITE_CONFIG as c } from '../src/domain/historicalFiniteConfig';
import type { HistoricalFiniteConfig as GameConfig } from '../src/domain/historicalFiniteConfig';
import { createSimulation } from '../src/simulation/engine';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import type { ShipSnapshot } from '../src/simulation/contracts';
import { distanceBetween, findRoute, segmentIsSafe } from '../src/simulation/navigation';
import { hullIsValid } from '../src/simulation/collision';
import { createEnemyBehavior, constrainHull, lineOfSight, normalizeAngle, separateHulls } from '../src/simulation/enemies';
import { createDirector, createRandom, spawnIsSafe } from '../src/simulation/director';
import { emitWeapon } from '../src/simulation/combat';
import { DEFAULT_CONFIG as ocean } from '../src/domain/config';
import { createTerrain } from '../src/simulation/world/terrain';
import { createNavigator } from '../src/simulation/navigation';
const ship=(id:string,archetype:'player'|'chaser'|'shooter',xUnits:number,yUnits:number,headingRadians=0):ShipSnapshot=>({id,archetype,position:{xUnits,yUnits},headingRadians,health:c.ships[archetype].maxHealth,maxHealth:c.ships[archetype].maxHealth});
const run=(sim:ReturnType<typeof createSimulation>,steps:number)=>{for(let i=0;i<steps;i++)sim.step(NEUTRAL_INPUT);return sim.inspect();};
const empty:GameConfig={...c,world:{...c.world,islands:[]}};

it('reserves and revalidates the full annulus around a distant signed player with independent terrain RNG', () => {
  const terrain = createTerrain(ocean, 0), navigation = createNavigator(ocean, terrain);
  const player = ship('player', 'player', -3000, 40), a = createDirector(0, ocean, (() => { let n = 0; return () => `a-${n++}`; })(), terrain, navigation);
  const reservation = a(3000, player, [], []).reservations;
  expect(reservation).toHaveLength(1);
  const distance = distanceBetween(reservation[0]!.position, player.position);
  expect(distance).toBeGreaterThanOrEqual(240); expect(distance).toBeLessThanOrEqual(520);
  for (let n = 0; n < 20; n++) terrain.region(n, -20);
  expect(a(3599, player, [], reservation).reservations).toEqual(reservation);
  const materialized = a(3600, player, [], reservation);
  expect(materialized.enemies[0]).toMatchObject({ archetype: 'chaser', position: reservation[0]!.position });
  const second = a(6000, player, materialized.enemies, []).reservations;
  expect(second[0]!.archetype).toBe('shooter');
  const canceled = a(6600, { ...player, position: { xUnits: 5000, yUnits: 40 } }, materialized.enemies, second);
  expect(canceled.reservations).toEqual([]); expect(canceled.enemies).toEqual(materialized.enemies);
  expect(a(9000, player, materialized.enemies, []).reservations[0]!.archetype).toBe('shooter');
  navigation.dispose(); terrain.dispose();
});

it('pursues across a changed player region and conserves an offscreen enemy through renderer queries', () => {
  const terrain = createTerrain(ocean, 0), nav = createNavigator(ocean, terrain), behavior = createEnemyBehavior(ocean, terrain, nav);
  let chaser = ship('traveler', 'chaser', -1240, 40);
  let player = ship('player', 'player', 40, 40);
  const before = distanceBetween(chaser.position, player.position);
  for (let n = 0; n < 600; n++) chaser = behavior.move(chaser, player, [chaser], n * ocean.timing.fixedStepMs);
  expect(distanceBetween(chaser.position, player.position)).toBeLessThan(before - 500);
  player = { ...player, position: { xUnits: 1320, yUnits: 40 } };
  const changed = distanceBetween(chaser.position, player.position);
  for (let n = 600; n < 1200; n++) chaser = behavior.move(chaser, player, [chaser], n * ocean.timing.fixedStepMs);
  expect(distanceBetween(chaser.position, player.position)).toBeLessThan(changed - 500);
  const initial = { enemies: [ship('hidden-shooter', 'shooter', -2500, 40)] };
  const a = createSimulation(createMatchSetup(ocean, 0), initial), b = createSimulation(createMatchSetup(ocean, 0), initial);
  for (let n = 0; n < 360; n++) {
    a.terrain.region(n % 20, -5); a.inspect();
    a.step(NEUTRAL_INPUT); b.step(NEUTRAL_INPUT); expect(a.events()).toEqual(b.events());
  }
  expect(a.inspect()).toEqual(b.inspect());
  expect(a.inspect().enemies.find(e => e.id === 'hidden-shooter')).toMatchObject({ health: 60 });
  expect(a.inspect().enemies.find(e => e.id === 'hidden-shooter')!.position).not.toEqual(initial.enemies[0]!.position);
  a.dispose(); b.dispose(); nav.dispose(); terrain.dispose();
});

it('makes actual steering progress around all three procedural families from both sides', () => {
  const terrain = createTerrain(ocean, 0), nav = createNavigator(ocean, terrain), families = new Set<string>();
  for (let x = -10; x < 10 && families.size < 3; x++) for (const island of terrain.region(x, -2).islands) {
    if (families.has(island.modelId)) continue; families.add(island.modelId);
    for (const reverse of [false, true]) {
      const left = island.origin.xUnits - 40, right = island.origin.xUnits + island.widthUnits + 40, y = island.origin.yUnits + island.heightUnits / 2;
      const player = ship('player', 'player', reverse ? left : right, y);
      let enemy = ship('routing', 'chaser', reverse ? right : left, y, reverse ? Math.PI : 0);
      const behavior = createEnemyBehavior(ocean, terrain, nav);
      for (let n = 0; n < 1200; n++) {
        enemy = behavior.move(enemy, player, [enemy], (n + 1) * ocean.timing.fixedStepMs);
        expect(hullIsValid(enemy.position, ocean, 16, terrain)).toBe(true);
      }
      expect(distanceBetween(enemy.position, player.position)).toBeLessThan(80);
    }
  }
  expect(families.size).toBe(3); nav.dispose(); terrain.dispose();
});

it('keeps normal AI/director with captured initial data and explicitly isolates stationary targets',()=>{
  const data={enemies:[ship('enemy','chaser',480,100)]},sim=createSimulation(createMatchSetup(c,0),data),old=sim.inspect();
  data.enemies[0]=ship('changed','chaser',700,100);run(sim,30);
  expect(sim.inspect().enemies[0]!.position).not.toEqual(old.enemies[0]!.position);expect(old.enemies[0]!.position.yUnits).toBe(100);
  const stationary=createSimulation(createMatchSetup(c,0),{...data,mode:'stationary-targets'});const before=stationary.inspect();run(stationary,400);expect(stationary.inspect().enemies).toEqual(before.enemies);expect(stationary.inspect().reservations).toEqual([]);
});
it.each([16,18])('routes radius %s safely around both sides of both islands with real endpoints',radius=>{
  for(const island of c.world.islands)for(const yOffset of [25,95]) {
    const start={xUnits:island.origin.xUnits-45,yUnits:island.origin.yUnits+yOffset},end={xUnits:island.origin.xUnits+205,yUnits:island.origin.yUnits+yOffset};
    for(const [from,to] of [[start,end],[end,start]]) {
      const route=findRoute(from!,to!,radius,c);expect(route.length).toBeGreaterThan(1);let previous=from!;
      for(const p of route){expect(segmentIsSafe(previous,p,radius,c)).toBe(true);previous=p;}
      expect(route.at(-1)).toEqual(to);expect(findRoute(from!,to!,radius,c)).toEqual(route);
    }
  }
  expect(findRoute({xUnits:210,yUnits:150},{xUnits:480,yUnits:270},radius,c)).toEqual([]);
  const barrier:GameConfig={...empty,world:{...empty.world,islands:[{...c.world.islands[0]!,origin:{xUnits:450,yUnits:0},solidOutline:[{xUnits:0,yUnits:0},{xUnits:60,yUnits:0},{xUnits:60,yUnits:540},{xUnits:0,yUnits:540}]}]}};
  expect(findRoute({xUnits:100,yUnits:100},{xUnits:800,yUnits:100},radius,barrier)).toEqual([]);
});
it.each(['chaser','shooter'] as const)('%s makes bounded progress around each island from either side',archetype=>{
  for(const island of c.world.islands)for(const reverse of [false,true]) {
    const left=ship('enemy',archetype,island.origin.xUnits-45,island.origin.yUnits+60),right=ship('player','player',island.origin.xUnits+205,island.origin.yUnits+60);
    let enemy=reverse?{...left,position:right.position}:left;const player=reverse?{...right,position:left.position}:right;
    const behavior=createEnemyBehavior(c);let seenLOS=false,min=Infinity;
    for(let i=1;i<=700;i++) {
      const next=behavior.move(enemy,player,[enemy],i*c.timing.fixedStepMs);
      expect(hullIsValid(next.position,c,c.ships[archetype].hullRadiusUnits)).toBe(true);
      expect(distanceBetween(next.position,enemy.position)).toBeLessThanOrEqual(c.ships[archetype].forwardSpeedUnitsPerSecond/60+1e-6);
      expect(Math.abs(normalizeAngle(next.headingRadians-enemy.headingRadians))).toBeLessThanOrEqual(c.ships[archetype].turnSpeedRadiansPerSecond/60+1e-6);
      enemy=next;seenLOS ||= lineOfSight(enemy,player,c);min=Math.min(min,distanceBetween(enemy.position,player.position));
    }
    expect(seenLOS,JSON.stringify({enemy,player,min,route:findRoute(enemy.position,player.position,c.ships[archetype].hullRadiusUnits,c)})).toBe(true);expect(min).toBeLessThan(archetype==='chaser'?40:270);
  }
});
it('holds the band, retains approach/retreat to preferred distance, tracks current target',()=>{
  const player=ship('player','player',480,270);
  for(const [distance,kind] of [[240,'hold'],[280,'approach'],[200,'retreat']] as const) {
    let enemy=ship('s','shooter',480+distance,270,kind==='retreat'?0:Math.PI);const original=enemy;const behavior=createEnemyBehavior(empty);
    for(let i=1;i<=60;i++)enemy=behavior.move(enemy,player,[enemy],i*empty.timing.fixedStepMs);
    const end=distanceBetween(enemy.position,player.position);
    if(kind==='hold')expect(enemy.position).toEqual(original.position);else if(kind==='approach')expect(end).toBeLessThan(250);else expect(end).toBeGreaterThan(230);
  }
  const behavior=createEnemyBehavior(empty),enemy=ship('c','chaser',480,100,Math.PI/2);
  expect(behavior.move(enemy,{...player,position:{xUnits:700,yUnits:100}},[enemy],100).headingRadians).toBeLessThan(enemy.headingRadians);
});
it('requires full first/reentry cooldown, waits for LOS/aim without restarting, emits real provenance',()=>{
  const player=ship('player','player',480,270),enemy=ship('s','shooter',720,270,Math.PI),behavior=createEnemyBehavior(empty);
  behavior.move(enemy,player,[enemy],0);expect(behavior.canFire(enemy,player,0)).toBe(false);expect(behavior.canFire(enemy,player,1499.999)).toBe(false);expect(behavior.canFire(enemy,player,1500)).toBe(true);
  expect(behavior.canFire({...enemy,position:{xUnits:781,yUnits:270}},player,2000)).toBe(false);
  expect(behavior.canFire(enemy,player,2500)).toBe(false);expect(behavior.canFire({...enemy,headingRadians:0},player,4000)).toBe(false);expect(behavior.canFire(enemy,player,4000)).toBe(true);
  const tolerance=createEnemyBehavior(empty);tolerance.move(enemy,player,[enemy],0);tolerance.canFire(enemy,player,0);
  expect(tolerance.canFire({...enemy,headingRadians:Math.PI+c.shooter.aimToleranceRadians+0.0001},player,1500)).toBe(false);
  expect(tolerance.canFire({...enemy,headingRadians:Math.PI+c.shooter.aimToleranceRadians},player,1500)).toBe(true);
  const blocked=ship('s','shooter',85,155),protectedPlayer=ship('player','player',350,155),los=createEnemyBehavior(c);los.move(blocked,protectedPlayer,[blocked],0);los.canFire(blocked,protectedPlayer,0);
  expect(los.canFire(blocked,protectedPlayer,1500)).toBe(false);expect(los.canFire({...blocked,position:{xUnits:350,yUnits:50},headingRadians:Math.PI/2},protectedPlayer,1500)).toBe(true);
  const balls=emitWeapon(enemy,'shooter',c,()=> 'ball');expect(balls[0]).toMatchObject({ownerId:'s',faction:'enemy',damage:10,speedUnitsPerSecond:260,remainingLifetimeMs:1500});
  expect(emitWeapon(ship('s','shooter',18,270,Math.PI),'shooter',c,()=> 'blocked')).toEqual([]);
});
it('preserves a ready Shooter cooldown when the angled muzzle is blocked, then reloads only after a real shot',()=>{
  const player=ship('player','player',335.73108780270854,20.155976232377725);
  const enemy=ship('s','shooter',114,112,6.065019150680292),behavior=createEnemyBehavior(c);
  behavior.move(enemy,player,[enemy],0);
  expect(lineOfSight(enemy,player,c)).toBe(true);
  expect(behavior.canFire(enemy,player,0)).toBe(false);
  expect(behavior.canFire(enemy,player,1500)).toBe(true);
  expect(emitWeapon(enemy,'shooter',c,()=> 'blocked')).toEqual([]);
  // A subsequent safe current heading can fire immediately, without another 1500ms.
  const aligned={...enemy,headingRadians:Math.atan2(player.position.yUnits-enemy.position.yUnits,player.position.xUnits-enemy.position.xUnits)};
  expect(behavior.canFire(aligned,player,1500+c.timing.fixedStepMs)).toBe(true);
  expect(emitWeapon(aligned,'shooter',c,()=> 'fired')).toHaveLength(1);
  behavior.recordShot(aligned,1500+c.timing.fixedStepMs);
  expect(behavior.canFire(aligned,player,3000)).toBe(false);
  expect(behavior.canFire(aligned,player,3000+c.timing.fixedStepMs)).toBe(true);
  const sim=createSimulation(createMatchSetup(empty,0),{enemies:[ship('s','shooter',720,270,Math.PI)]});
  run(sim,91);expect(sim.inspect().projectiles).toHaveLength(1);
  run(sim,1);expect(sim.inspect().projectiles).toHaveLength(1);
  run(sim,88);expect(sim.inspect().projectiles).toHaveLength(0);
  sim.step(NEUTRAL_INPUT);expect(sim.inspect().projectiles).toHaveLength(1);
  expect(sim.inspect().projectiles[0]!.remainingLifetimeMs).toBe(1500);
});
it('sweeps chaser contact once and existing lethal balls prevent all later actions',()=>{
  const enemy=ship('c','chaser',480,234,Math.PI/2),sim=createSimulation(createMatchSetup(c,0),{enemies:[enemy]});run(sim,2);expect(sim.inspect()).toMatchObject({player:{health:75},enemies:[],score:0});run(sim,10);expect(sim.inspect().player.health).toBe(75);
  const saved=createSimulation(createMatchSetup(c,0),{enemies:[enemy],projectiles:[{id:'shot',ownerId:'player',faction:'player',damage:40,speedUnitsPerSecond:420,radiusUnits:5,position:{xUnits:480,yUnits:240},headingRadians:-Math.PI/2,remainingLifetimeMs:1200}]});saved.step(NEUTRAL_INPUT);expect(saved.inspect()).toMatchObject({player:{health:100},score:1,enemies:[]});
});
it('separates coincident groups and constrains frontal/oblique hulls near shores/edges without pushing player',()=>{
  const touchingPlayer=ship('player','player',480,270),touchingShooter=ship('s','shooter',516,270);
  expect(constrainHull(touchingPlayer,{...touchingPlayer,position:{xUnits:475,yUnits:270}},[touchingShooter],empty,()=>{}).position.xUnits).toBe(475);
  for(const p of [{xUnits:480,yUnits:270},{xUnits:315,yUnits:155},{xUnits:18,yUnits:270}]) {
    const player={...ship('player','player',0,0),position:p};const enemies=['a','b','c'].map(id=>({...ship(id,'shooter',0,0),position:p}));
    const separated=separateHulls(player,enemies,c);expect(player.position).toEqual(p);
    for(const e of separated){expect(hullIsValid(e.position,c,18)).toBe(true);for(const other of [player,...separated.filter(o=>o.id!==e.id)])expect(distanceBetween(e.position,other.position)).toBeGreaterThanOrEqual(36-1e-6);}
    for(const dy of [0,10]) {const moving=ship('moving','player',480,270),blocker=ship('blocker','shooter',525,270);const result=constrainHull(moving,{...moving,position:{xUnits:580,yUnits:270+dy}},[blocker],empty,()=>{});expect(distanceBetween(result.position,blocker.position)).toBeGreaterThanOrEqual(36-1e-6);}
  }
});
it('runs absolute 3/3.6/6/6.6s cadence, immutable reservations, IDs, seeds and freeze',()=>{
  const a=createSimulation(createMatchSetup(c,0)),b=createSimulation(createMatchSetup(c,0)),different=createSimulation(createMatchSetup(c,1));run(a,179);expect(a.inspect().reservations).toEqual([]);
  a.step(NEUTRAL_INPUT);const reserved=a.inspect();expect(reserved.reservations).toHaveLength(1);expect(reserved.reservations[0]).toMatchObject({archetype:'chaser',createdAtMs:3000,materializeAtMs:3600});expect(Object.isFrozen(reserved.reservations[0]!.position)).toBe(true);
  expect(spawnIsSafe(reserved.reservations[0]!.position,'chaser',reserved.player,[],[],c)).toBe(true);
  a.freeze();const frozen=a.inspect();run(a,500);expect(a.inspect()).toBe(frozen);a.resume();run(a,35);expect(a.inspect().enemies).toHaveLength(0);a.step(NEUTRAL_INPUT);expect(a.inspect().enemies[0]!.archetype).toBe('chaser');
  run(a,144);expect(a.inspect().reservations[0]!.archetype).toBe('shooter');run(a,36);expect(a.inspect().enemies.map(e=>e.archetype)).toEqual(['chaser','shooter']);
  run(b,396);run(different,396);expect(a.inspect()).toEqual(b.inspect());expect(a.inspect().enemies.map(e=>e.position)).not.toEqual(different.inspect().enemies.map(e=>e.position));expect(reserved.reservations).toHaveLength(1);
  const ids=[...a.inspect().enemies,...a.inspect().projectiles,...a.inspect().reservations].map(e=>e.id);expect(new Set(ids).size).toBe(ids.length);
  const random=createRandom(0),same=createRandom(0);expect(Array.from({length:10},()=>random())).toEqual(Array.from({length:10},()=>same()));
});
it('cancels unsafe reserves, keeps pending archetype, skips failures with no backlog/cap',()=>{
  const player=ship('player','player',480,270);let id=0;const director=createDirector(0,c,()=>String(++id));const first=director(3000,player,[],[]);const reservation=first.reservations[0]!;
  expect(director(3600,{...player,position:reservation.position},[],first.reservations).enemies).toEqual([]);
  const second=director(6000,player,[],[]);expect(second.reservations[0]!.archetype).toBe('chaser');
  expect(director(6100,{...player,health:0},[],second.reservations)).toEqual({enemies:[],reservations:[]});
  const blocked=ship('blocker','shooter',second.reservations[0]!.position.xUnits,second.reservations[0]!.position.yUnits);expect(director(6600,player,[blocked],second.reservations).enemies).toEqual([blocked]);
  const impossible:GameConfig={...c,spawn:{...c.spawn,minimumPlayerDistanceUnits:2000}};let draws=0;const failed=createDirector(0,impossible,()=>String(++draws));expect(failed(3000,player,[],[]).reservations).toEqual([]);expect(failed(5999,player,[],[]).reservations).toEqual([]);expect(draws).toBe(0);
  const many=createDirector(4,empty,()=>String(++id));let ships:ShipSnapshot[]=[],res=first.reservations.slice(0,0);
  for(let t=3000;t<=60000;t+=3000){const opportunity=many(t,player,ships,res);const materialized=many(t+600,player,opportunity.enemies,opportunity.reservations);ships=materialized.enemies;res=materialized.reservations;}
  expect(ships.length).toBeGreaterThan(10);
  const dead=createSimulation(createMatchSetup(c,0),{projectiles:[{id:'death',ownerId:'gone',faction:'enemy',damage:100,radiusUnits:5,speedUnitsPerSecond:10,position:player.position,headingRadians:0,remainingLifetimeMs:100}]});run(dead,500);expect(dead.inspect()).toMatchObject({player:{health:0},enemies:[],reservations:[]});
});

it('freezes a partially loaded Shooter deadline without adding a new wait on resume',()=>{
  const sim=createSimulation(createMatchSetup(empty,0),{enemies:[ship('s','shooter',720,270,Math.PI)]});
  run(sim,45);expect(sim.inspect().projectiles).toHaveLength(0);sim.freeze();const paused=sim.inspect();run(sim,500);expect(sim.inspect()).toBe(paused);
  sim.resume();run(sim,45);expect(sim.inspect().projectiles).toHaveLength(0);sim.step(NEUTRAL_INPUT);expect(sim.inspect().projectiles[0]).toMatchObject({faction:'enemy',ownerId:'s',remainingLifetimeMs:1500});
});
it('consumes a rejected RNG sample exactly as a later canceled reservation, without replacement backlog',()=>{
  const config:GameConfig={...empty,director:{candidateAttempts:1}},player=ship('player','player',480,270);let id=0;
  const canceled=createDirector(0,config,()=>String(++id)),rejected=createDirector(0,config,()=>String(++id));
  const first=canceled(3000,player,[],[]),unsafePlayer={...player,position:first.reservations[0]!.position};
  expect(rejected(3000,unsafePlayer,[],[]).reservations).toEqual([]);
  expect(canceled(3600,unsafePlayer,[],first.reservations).reservations).toEqual([]);
  expect(rejected(5999,player,[],[]).reservations).toEqual([]);
  const a=canceled(6000,player,[],[]),b=rejected(6000,player,[],[]);
  expect(a.reservations[0]!.position).toEqual(b.reservations[0]!.position);expect(a.reservations[0]!.position).not.toEqual(first.reservations[0]!.position);
  expect(a.reservations[0]!.archetype).toBe('chaser');expect(b.reservations[0]!.archetype).toBe('chaser');
});
it('preserves scenario validity and separated hulls in sustained moving player/groups at coast and boundary',()=>{
  for(const position of [{xUnits:315,yUnits:155},{xUnits:18,yUnits:270},{xUnits:480,yUnits:270}]) {
    const config:GameConfig={...c,world:{...c.world,playerStart:{...position,headingRadians:0}}};
    const sim=createSimulation(createMatchSetup(config,0),{enemies:[ship('a','shooter',position.xUnits,position.yUnits),ship('b','shooter',position.xUnits,position.yUnits),ship('c','shooter',position.xUnits,position.yUnits)]});
    for(let i=0;i<150;i++) {
      const snapshot=sim.step({...NEUTRAL_INPUT,toggleAutoSailPressed:i===0,steering:{kind:'target',target:{xUnits:600,yUnits:270}}});
      const ships=[snapshot.player,...snapshot.enemies];
      for(const entity of ships) {
        expect(hullIsValid(entity.position,config,c.ships[entity.archetype].hullRadiusUnits)).toBe(true);
        for(const other of ships.filter(e=>e.id!==entity.id))expect(distanceBetween(entity.position,other.position)).toBeGreaterThanOrEqual(c.ships[entity.archetype].hullRadiusUnits+c.ships[other.archetype].hullRadiusUnits-1e-6);
      }
    }
  }
});
