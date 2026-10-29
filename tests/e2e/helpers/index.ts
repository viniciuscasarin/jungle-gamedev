import type { Page } from '@playwright/test';

export const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
`;

export const DETERMINISTIC_SEED = 424242;

/**
 * Injects CSS to disable transitions and animations for deterministic visual checks.
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
}

/**
 * Resets local and session storage.
 */
export async function resetStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore in sandboxed environments
    }
  });
}

/**
 * Builds a deterministic URL with seed and optional scenarios.
 */
export function buildDeterministicUrl(
  path = '/',
  params: Record<string, string | number | boolean> = { seed: DETERMINISTIC_SEED }
): string {
  const url = new URL(path, 'http://127.0.0.1:4173');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return `${url.pathname}${url.search}`;
}

/**
 * Prepares the page with deterministic seed, cleans storage, and disables CSS animations.
 */
export async function setupDeterministicPage(
  page: Page,
  options: {
    path?: string;
    seed?: number;
    combatScenario?: string;
    params?: Record<string, string | number | boolean>;
    disableCssAnimations?: boolean;
  } = {}
): Promise<string> {
  const {
    path = '/',
    seed = DETERMINISTIC_SEED,
    combatScenario,
    params = {},
    disableCssAnimations = true,
  } = options;

  const queryParams: Record<string, string | number | boolean> = {
    seed,
    ...params,
  };
  if (combatScenario) {
    queryParams.combatScenario = combatScenario;
  }

  const targetUrl = buildDeterministicUrl(path, queryParams);
  await page.goto(targetUrl);
  await resetStorage(page);

  if (disableCssAnimations) {
    await disableAnimations(page);
  }

  return targetUrl;
}
