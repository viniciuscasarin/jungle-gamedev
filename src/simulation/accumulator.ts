/** Millisecond tolerance only compensates floating-point step-boundary rounding. */
export const TIME_EPSILON_MS = 1e-8;
export function createAccumulator(fixedStepMs: number, maxSteps: number) {
  let remainder = 0;
  return {
    reset() { remainder = 0; },
    inspect: () => remainder,
    advance(deltaMs: number, step: () => void): number {
      if (!Number.isFinite(deltaMs) || deltaMs < 0) return 0;
      const total = remainder + deltaMs;
      const whole = Math.floor((total + TIME_EPSILON_MS) / fixedStepMs);
      const count = Math.min(maxSteps, whole);
      remainder = Math.max(0, total - whole * fixedStepMs);
      for (let i = 0; i < count; i++) step();
      return count;
    },
  };
}
