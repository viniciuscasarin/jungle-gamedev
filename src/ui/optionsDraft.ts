import { DEFAULT_CONFIG, OPTION_METADATA } from '../domain/config';
import type { GameOptions } from '../domain/config';
import { validateOptions } from '../domain/validation';

export const OPTION_KEYS = ['sessionDurationMs', 'enemySpawnIntervalMs'] as const;
export type OptionsDraft = Record<keyof GameOptions, string>;
export const optionHelp = (key: keyof GameOptions) => {
  const rule = OPTION_METADATA[key];
  return `${rule.min / 1000}–${rule.max / 1000} seconds, in steps of ${rule.step / 1000} second${rule.step === 1000 ? '' : 's'}.`;
};
export function optionsDraft(options: GameOptions = DEFAULT_CONFIG.options): OptionsDraft {
  return { sessionDurationMs: String(options.sessionDurationMs / 1000), enemySpawnIntervalMs: String(options.enemySpawnIntervalMs / 1000) };
}

/** Preserve text while editing; the domain remains the authority for bounds/steps. */
export function validateDraft(draft: OptionsDraft): { options?: GameOptions; errors: Partial<OptionsDraft> } {
  const errors: Partial<OptionsDraft> = {};
  const candidate = { ...DEFAULT_CONFIG.options };
  for (const key of OPTION_KEYS) {
    const text = draft[key].trim();
    const value = /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text) ? Number(text) * 1000 : NaN;
    try { validateOptions({ ...DEFAULT_CONFIG.options, [key]: value }); candidate[key] = value; }
    catch { errors[key] = `Enter ${optionHelp(key)}`; }
  }
  return Object.keys(errors).length ? { errors } : { options: validateOptions(candidate), errors };
}

/** The guard is shared by the native submit handler and pure boundary tests. */
export function saveDraft(draft: OptionsDraft, writer: (options: GameOptions) => boolean): boolean {
  const { options } = validateDraft(draft);
  if (!options) return false;
  try { return writer(options); } catch { return false; }
}
