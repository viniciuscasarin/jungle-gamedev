import type { MatchSetup } from '../domain/config';
import { createSimulation } from '../simulation/engine';
import { createAccumulator } from '../simulation/accumulator';
import type { InitialCombatData, SimulationEvent, SimulationSnapshot, StepInput } from '../simulation/contracts';

export interface FrameDriver { request(callback: (timeMs: number) => void): number; cancel(id: number): void }
/** Scheduling is explicit and only starts when the owning resource mounts. */
export function createNavigationLoop(setup: MatchSetup, input: { consume(): StepInput; clear(): void }, driver: FrameDriver, present: (snapshot: SimulationSnapshot) => void, initial: InitialCombatData = {}, onEvents: (events: readonly SimulationEvent[]) => void = () => {}) {
  const simulation = createSimulation(setup, initial), accumulator = createAccumulator(setup.configuration.timing.fixedStepMs, setup.configuration.timing.maxCatchUpStepsPerFrame);
  let frame: number | undefined, baseline: number | undefined, mounted = false, destroyed = false;
  const schedule = () => { if (mounted && !destroyed && simulation.inspect().state === 'playing' && frame === undefined) frame = driver.request(tick); };
  const tick = (time: number) => {
    frame = undefined;
    if (destroyed || !mounted || simulation.inspect().state !== 'playing') return;
    if (baseline !== undefined) accumulator.advance(time - baseline, () => {
      if (destroyed || simulation.inspect().state !== 'playing') return;
      simulation.step(input.consume());
      const events = simulation.events();
      if (events.length) onEvents(events);
    });
    if (destroyed) return;
    if (simulation.inspect().state !== 'playing') reset();
    else baseline = time;
    present(simulation.inspect()); schedule();
  };
  const reset = () => { if (frame !== undefined) driver.cancel(frame); frame = undefined; baseline = undefined; accumulator.reset(); input.clear(); };
  return {
    inspect: simulation.inspect,
    neutralizeAutoSail() { if (destroyed) return; simulation.neutralizeAutoSail(); present(simulation.inspect()); },
    mount() { if (mounted || destroyed) return; mounted = true; present(simulation.inspect()); schedule(); },
    freeze() { if (!mounted || destroyed) return; reset(); simulation.freeze(); present(simulation.inspect()); },
    resume() { if (!mounted || destroyed || simulation.inspect().state !== 'paused') return; reset(); simulation.resume(); present(simulation.inspect()); schedule(); },
    destroy() { if (destroyed) return; destroyed = true; mounted = false; reset(); },
  };
}
