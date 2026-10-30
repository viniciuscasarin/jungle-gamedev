import { validateConfiguration } from '../domain/validation';
import { HISTORICAL_FINITE_CONFIG } from '../domain/historicalFiniteConfig';
import { createGameConfig } from '../domain/config';
import type { GameConfig, GameOptions } from '../domain/config';
import { prepareSession } from '../domain/session';
import type { PlayerIdentity } from '../domain/session';
import { immutableCopy } from '../domain/immutable';
import type { InitialCombatData } from '../simulation/contracts';
import { diagnosticTargets } from '../simulation/combat';

export function preparePlay(options: GameOptions | undefined, identity: PlayerIdentity, query: URLSearchParams, factories: { id(): string; seed(): number }) {
  const current = createGameConfig(options);
  let configuration: GameConfig = current;
  const scenario = query.get('combatScenario');
  if (scenario === 'island') configuration = immutableCopy({ ...HISTORICAL_FINITE_CONFIG, options: configuration.options, world: { ...HISTORICAL_FINITE_CONFIG.world, playerStart: { xUnits: 350, yUnits: 155, headingRadians: Math.PI } } });
  if (query.get('configScenario') === 'custom') configuration = immutableCopy({ ...current, world: { ...current.world, playerStart: { xUnits: 600, yUnits: 300, headingRadians: 0 } }, ships: { ...configuration.ships, player: { ...configuration.ships.player, hullRadiusUnits: 22 } } });
  const initial: InitialCombatData = scenario === 'targets' ? diagnosticTargets(configuration) : scenario === 'empty' ? { mode: 'stationary-targets' } : scenario === 'island' ? { enemies: [{ id: 'island-shooter', archetype: 'shooter', position: { xUnits: 85, yUnits: 155 }, headingRadians: 0, health: configuration.ships.shooter.maxHealth, maxHealth: configuration.ships.shooter.maxHealth }] } : {};
  const requestedSeed = query.get('seed'), parsedSeed = requestedSeed === null ? NaN : Number(requestedSeed);
  const seed = Number.isInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 4294967295 ? parsedSeed : factories.seed();
  return immutableCopy({ preparation: prepareSession(factories.id(), identity, validateConfiguration(configuration), seed), initial });
}
