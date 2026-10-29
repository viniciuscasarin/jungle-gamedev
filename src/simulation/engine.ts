import { createMatchSetup } from '../domain/config';
import type { MatchSetup } from '../domain/config';
import { immutableCopy } from '../domain/immutable';
import type { InitialCombatData, ProjectileSnapshot, ShipSnapshot, SimulationEvent, SimulationSnapshot, StepInput } from './contracts';
import { CONTACT_EPSILON, moveHull, sweepCircle, sweepSolid } from './collision';
import { captureCombatData, emitWeapon, PLAYER_WEAPONS, TIME_EPSILON_MS } from './combat';

import { constrainHull, createEnemyBehavior, normalizeAngle, separateHulls } from './enemies';
import { createDirector } from './director';
export { normalizeAngle } from './enemies';

export function createSimulation(preparation: MatchSetup, initialData: InitialCombatData = {}) {
  const setup = createMatchSetup(preparation.configuration, preparation.seed), c = setup.configuration;
  const initial = captureCombatData(initialData, c);
  const deadlines = { front: 0, port: 0, starboard: 0 };
  const usedIds = new Set(['player', ...(initial.enemies ?? []).map(e => e.id), ...(initial.projectiles ?? []).map(p => p.id)]);
  let projectileSequence = 0;
  const nextId = () => { let id: string; do { id = `projectile-${++projectileSequence}`; } while (usedIds.has(id)); usedIds.add(id); return id; };
  const behavior = createEnemyBehavior(c), director = createDirector(setup.seed, c, nextId);
  const autonomous = initial.mode !== 'stationary-targets';
  let currentSnapshot: SimulationSnapshot = {
    step: 0,
    activeTimeMs: 0,
    state: 'playing',
    score: 0,
    player: {
      id: 'player',
      archetype: 'player',
      position: { xUnits: c.world.playerStart.xUnits, yUnits: c.world.playerStart.yUnits },
      headingRadians: c.world.playerStart.headingRadians,
      health: c.ships.player.maxHealth,
      maxHealth: c.ships.player.maxHealth,
    },
    reservations: [],
    enemies: initial.enemies ?? [],
    projectiles: initial.projectiles ?? [],
    cooldownsMs: { front: 0, port: 0, starboard: 0 },
    autoSailEnabled: c.controls.initialAutoSail,
  };
  let currentEvents: readonly SimulationEvent[] = [];
  let cachedFrozenSnapshot: SimulationSnapshot | null = null;
  let cachedFrozenEvents: readonly SimulationEvent[] | null = null;

  return {
    inspect: () => {
      if (!cachedFrozenSnapshot) {
        cachedFrozenSnapshot = immutableCopy(currentSnapshot);
      }
      return cachedFrozenSnapshot;
    },
    events: () => {
      if (!cachedFrozenEvents) {
        cachedFrozenEvents = immutableCopy(currentEvents);
      }
      return cachedFrozenEvents;
    },
    neutralizeAutoSail() {
      if (currentSnapshot.autoSailEnabled) {
        currentSnapshot = { ...currentSnapshot, autoSailEnabled: false };
        cachedFrozenSnapshot = null;
      }
    },
    freeze() {
      if (currentSnapshot.state === 'playing') {
        currentSnapshot = { ...currentSnapshot, state: 'paused', autoSailEnabled: false };
        cachedFrozenSnapshot = null;
      }
    },
    resume() {
      if (currentSnapshot.state === 'paused') {
        currentSnapshot = { ...currentSnapshot, state: 'playing', autoSailEnabled: false };
        cachedFrozenSnapshot = null;
      }
    },
    step(input: StepInput) {
      currentEvents = [];
      cachedFrozenEvents = null;
      if (currentSnapshot.state !== 'playing') return currentSnapshot;
      if (input.pausePressed) {
        currentSnapshot = { ...currentSnapshot, state: 'paused', autoSailEnabled: false };
        cachedFrozenSnapshot = null;
        return currentSnapshot;
      }
      const step = currentSnapshot.step + 1, activeTimeMs = Math.min(c.options.sessionDurationMs, step * c.timing.fixedStepMs);
      const time = { step, activeTimeMs }, emittedEvents: SimulationEvent[] = [];
      let player = currentSnapshot.player, enemies = [...currentSnapshot.enemies], score = currentSnapshot.score;
      const damage = (ship: ShipSnapshot, amount: number, sourceId: string, cause: 'projectile' | 'contact', playerCredit: boolean) => {
        if (ship.health <= 0) return;
        const health = Math.max(0, ship.health - amount), updated = { ...ship, health };
        emittedEvents.push({ ...time, type: 'damage', targetId: ship.id, sourceId, amount, remainingHealth: health });
        if (ship.id === player.id) player = updated;
        else enemies = enemies.map(e => e.id === ship.id ? updated : e);
        if (health === 0) {
          emittedEvents.push({ ...time, type: 'destruction', entityId: ship.id, sourceId, cause });
          enemies = enemies.filter(e => e.id !== ship.id);
          if (ship.archetype !== 'player' && playerCredit) {
            score += c.rules.pointsPerPlayerEnemyDestruction;
            emittedEvents.push({ ...time, type: 'score', enemyId: ship.id, points: c.rules.pointsPerPlayerEnemyDestruction, totalScore: score });
          }
        }
      };
      const projectiles: ProjectileSnapshot[] = [];
      // Stable projectile order and immediate removal make simultaneous deaths atomic.
      for (const ball of [...currentSnapshot.projectiles].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
        const elapsed = Math.min(c.timing.fixedStepMs, ball.remainingLifetimeMs);
        const distance = ball.speedUnitsPerSecond * elapsed / 1000;
        const displacement = { x: Math.cos(ball.headingRadians) * distance, y: Math.sin(ball.headingRadians) * distance };
        let hitTime = sweepSolid(ball.position, displacement, ball.radiusUnits, c), target: ShipSnapshot | undefined;
        const candidates = ball.faction === 'player' ? enemies : player.health > 0 ? [player] : [];
        for (const ship of [...candidates].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
          const t = sweepCircle(ball.position, displacement, ship.position, ball.radiusUnits + c.ships[ship.archetype].hullRadiusUnits);
          if (t !== undefined && (hitTime === undefined || t < hitTime - CONTACT_EPSILON)) { hitTime = t; target = ship; }
        }
        if (hitTime !== undefined) { if (target) damage(target, ball.damage, ball.ownerId, 'projectile', ball.faction === 'player' && ball.ownerId === 'player'); continue; }
        const remainingLifetimeMs = ball.remainingLifetimeMs - elapsed;
        if (remainingLifetimeMs > TIME_EPSILON_MS) {
          projectiles.push({ ...ball, position: { xUnits: ball.position.xUnits + displacement.x, yUnits: ball.position.yUnits + displacement.y }, remainingLifetimeMs });
        } else {
          emittedEvents.push({ ...time, type: 'water_hit', position: { xUnits: ball.position.xUnits + displacement.x, yUnits: ball.position.yUnits + displacement.y } });
        }
      }
      const dt = c.timing.fixedStepMs / 1000;
      let heading = player.headingRadians;
      if (player.health > 0 && input.steering.kind !== 'none') {
        const dx = input.steering.kind === 'target' ? input.steering.target.xUnits - player.position.xUnits : input.steering.x;
        const dy = input.steering.kind === 'target' ? input.steering.target.yUnits - player.position.yUnits : input.steering.y;
        if (Number.isFinite(dx) && Number.isFinite(dy) && Math.hypot(dx, dy) > (input.steering.kind === 'target' ? c.controls.mouseDeadZoneUnits : 0)) {
          const difference = normalizeAngle(Math.atan2(dy, dx) - heading), limit = c.ships.player.turnSpeedRadiansPerSecond * dt;
          heading = normalizeAngle(heading + Math.max(-limit, Math.min(limit, difference)));
        }
      }
      let autoSailEnabled = player.health > 0 && (input.toggleAutoSailPressed ? !currentSnapshot.autoSailEnabled : currentSnapshot.autoSailEnabled);
      const distance = autoSailEnabled || input.movementRequested ? c.ships.player.forwardSpeedUnitsPerSecond * dt : 0;
      const position = moveHull(player.position, { x: Math.cos(heading) * distance, y: Math.sin(heading) * distance }, c);
      const contact = (enemy: ShipSnapshot) => {
        const alive=enemies.find(e=>e.id===enemy.id);
        if(player.health>0 && alive?.archetype==='chaser') {
          damage(player,c.ships.chaser.contactDamage,alive.id,'contact',false);
          damage(alive,alive.health,alive.id,'contact',false);
        }
      };
      const movedPlayer=player.health > 0 ? constrainHull(player,{...player,headingRadians:heading,position},enemies,c,contact) : player;
      player={...movedPlayer,health:player.health};
      for(const enemy of [...enemies].sort((a,b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
        if(player.health<=0)break;
        if(!enemies.some(e=>e.id===enemy.id))continue;
        const proposed=autonomous?behavior.move(enemy,player,enemies,activeTimeMs):enemy;
        const constrained=constrainHull(enemy,proposed,[player,...enemies.filter(e=>e.id!==enemy.id)],c,other=>{if(other.id===player.id)contact(enemy);});
        if(enemies.some(e=>e.id===enemy.id))enemies=enemies.map(e=>e.id===enemy.id?constrained:e);
      }
      if(player.health>0)enemies=separateHulls(player,enemies,c);
      const reason = player.health <= 0 ? 'player_destroyed' : activeTimeMs + TIME_EPSILON_MS >= c.options.sessionDurationMs ? 'time_expired' : undefined;
      if (reason) autoSailEnabled = false;
      for (const weapon of PLAYER_WEAPONS) {
        if (!reason && input.fire[weapon] && activeTimeMs + TIME_EPSILON_MS >= deadlines[weapon]) {
          const emitted = emitWeapon(player, weapon, c, nextId);
          if (emitted.length > 0 && emitted[0]) {
            projectiles.push(...emitted);
            emittedEvents.push({
              ...time,
              type: 'fire',
              shooterId: player.id,
              weapon,
              positions: emitted.map(b => b.position),
              headingRadians: emitted[0].headingRadians,
            });
          }
          deadlines[weapon] = activeTimeMs + c.weapons[weapon].cooldownMs;
        }
      }
      let reservations=currentSnapshot.reservations;
      if(autonomous && !reason) {
        for(const enemy of enemies)if(behavior.canFire(enemy,player,activeTimeMs)) {
          const emitted=emitWeapon(enemy,'shooter',c,nextId);
          if(emitted.length && emitted[0]){
            projectiles.push(...emitted);
            behavior.recordShot(enemy,activeTimeMs);
            emittedEvents.push({
              ...time,
              type: 'fire',
              shooterId: enemy.id,
              weapon: 'shooter',
              positions: emitted.map(b => b.position),
              headingRadians: emitted[0].headingRadians,
            });
          }
        }
        const directed=director(activeTimeMs,player,enemies,reservations);enemies=directed.enemies;reservations=directed.reservations;
      }
      if(reason)reservations=[];
      behavior.prune(enemies);
      const cooldown = (weapon: typeof PLAYER_WEAPONS[number]) => Math.max(0, deadlines[weapon] - activeTimeMs) < TIME_EPSILON_MS ? 0 : Math.max(0, deadlines[weapon] - activeTimeMs);
      if (reason) emittedEvents.push({ ...time, type: 'ended', reason, score });
      currentEvents = emittedEvents;
      currentSnapshot = {
        ...currentSnapshot,
        state: reason ? 'completed' : 'playing',
        step,
        activeTimeMs,
        autoSailEnabled,
        player,
        enemies,
        projectiles,
        reservations,
        score,
        cooldownsMs: { front: cooldown('front'), port: cooldown('port'), starboard: cooldown('starboard') },
      };
      cachedFrozenSnapshot = null;
      return currentSnapshot;
    },
  };
}
