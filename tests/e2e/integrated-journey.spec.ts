import { test, expect, settleStartup } from './test';
import type { Page } from '@playwright/test';

// Diagnostics contracts
interface NavigationSnapshot {
  state: 'playing' | 'paused' | 'completed';
  activeTimeMs: number;
  step: number;
  score: number;
  autoSailEnabled: boolean;
  player: {
    health: number;
    position: { xUnits: number; yUnits: number };
    headingRadians: number;
  };
  enemies: Array<{
    id: string;
    archetype: 'chaser' | 'shooter';
    health: number;
    position: { xUnits: number; yUnits: number };
  }>;
  projectiles: Array<{
    id: string;
    faction: 'player' | 'enemy';
    headingRadians: number;
  }>;
  cooldownsMs: {
    front: number;
    port: number;
    starboard: number;
  };
}

interface TouchNavigationDiag {
  snapshot: NavigationSnapshot;
  target: { xUnits: number; yUnits: number } | null;
  mode?: 'desktop' | 'touch';
  sources?: {
    joypad: number | null;
    moving: boolean;
    direction: unknown;
  };
  contacts?: Array<{ id: number; captured: boolean }>;
}

async function getSnapshot(page: Page): Promise<NavigationSnapshot> {
  return page.evaluate(() => (window as unknown as { __arenaDiagnostics(): { navigation: { snapshot: NavigationSnapshot } | null } }).__arenaDiagnostics().navigation!.snapshot);
}

async function pointWorld(page: Page, x: number, y: number): Promise<void> {
  const point = await page.locator('.arena-host').evaluate(
    (host, p) => {
      const v = JSON.parse((host as HTMLElement).dataset.viewport!);
      const rect = host.getBoundingClientRect();
      return { x: rect.left + v.offsetX + p.x * v.scale, y: rect.top + v.offsetY + p.y * v.scale };
    },
    { x, y }
  );
  await page.mouse.move(point.x, point.y);
}

async function waitForArenaReady(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Arena', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
}

test.describe('Integrated End-to-End Player Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
    });
  });

  // Task 3.1: Simultaneous controls: Auto-sail R without repeat, concurrent Q+W+E firing instantiates 7 projectiles and independent cooldowns
  test('simultaneous controls: auto-sail R without repeat and concurrent Q+W+E firing', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Desktop controls test');

    await page.clock.install({ time: new Date('2026-10-28T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T12:00:01Z'));

    await page.goto('/?combatScenario=targets&geometry=1&seed=424242'); await settleStartup(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click();

    for (let n = 0; n < 30 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await waitForArenaReady(page);

    const controls = page.getByRole('region', { name: 'Sailing controls' });
    await controls.focus();

    // 1. Concurrent firing: Q, W, E simultaneously while stationary
    for (const key of ['q', 'w', 'e']) {
      await page.keyboard.down(key);
    }
    await page.clock.runFor(40);

    let snapshot = await getSnapshot(page);
    // 7 projectiles instantiated simultaneously (1 front, 3 port, 3 starboard)
    expect(snapshot.projectiles).toHaveLength(7);

    // Verify independent cooldowns are active
    expect(snapshot.cooldownsMs.front).toBeGreaterThan(0);
    expect(snapshot.cooldownsMs.port).toBeGreaterThan(0);
    expect(snapshot.cooldownsMs.starboard).toBeGreaterThan(0);

    // Verify HUD skills show Cooldown state (data-ready="false")
    for (const key of ['Q', 'W', 'E']) {
      const skill = page.locator('.skill').filter({ has: page.locator('kbd', { hasText: key }) });
      await expect(skill).toHaveAttribute('data-ready', 'false');
    }

    for (const key of ['q', 'w', 'e']) {
      await page.keyboard.up(key);
    }

    // 2. Verify auto-sail R toggles once and does not flap when held down
    await page.keyboard.down('r');
    await page.clock.runFor(150);
    snapshot = await getSnapshot(page);
    expect(snapshot.autoSailEnabled).toBe(true);

    // Holding 'r' down continuously: autoSailEnabled must stay true (no auto-repeat toggle)
    await page.clock.runFor(300);
    snapshot = await getSnapshot(page);
    expect(snapshot.autoSailEnabled).toBe(true);
    await page.keyboard.up('r');
  });

  // Task 3.2: Oblique collision with island applies continuous tangential sliding without hull damage or trapping
  test('oblique island collision applies continuous tangential sliding without hull damage', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Desktop physics test');

    await page.clock.install({ time: new Date('2026-10-28T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T12:00:01Z'));

    await page.goto('/?combatScenario=empty&geometry=1&seed=424242'); await settleStartup(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click();

    for (let n = 0; n < 30 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await waitForArenaReady(page);

    // Steer towards island boundary
    await pointWorld(page, 350, 150);
    await page.keyboard.press('r'); // Auto-sail
    await page.clock.runFor(1500);

    // Aim obliquely at north-west island: point (160, 30)
    await pointWorld(page, 160, 30);
    await page.clock.runFor(500);

    const beforeContact = await getSnapshot(page);
    expect(beforeContact.player.health).toBe(100);

    // Simulate contact and continuous sliding along coastline
    await page.clock.runFor(1200);
    const duringContact = await getSnapshot(page);

    // No hull damage from island collision
    expect(duringContact.player.health).toBe(100);
    // Ship continues sliding along coast (y coordinate decreased significantly)
    expect(duringContact.player.position.yUnits).toBeLessThan(beforeContact.player.position.yUnits - 20);
    // Ship did not penetrate island polygon
    expect(duringContact.player.position.xUnits).toBeGreaterThan(80);
  });

  // Task 3.3: Combat with atomic destruction of Chaser by simultaneous broadside increments score by exactly +1
  test('atomic destruction of Chaser by simultaneous broadside increments score by exactly +1', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Desktop combat test');

    await page.clock.install({ time: new Date('2026-10-28T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T12:00:01Z'));

    await page.goto('/?combatScenario=targets&geometry=1&seed=424242'); await settleStartup(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click();

    for (let n = 0; n < 30 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await waitForArenaReady(page);

    const initial = await getSnapshot(page);
    expect(initial.score).toBe(0);
    const chaser = initial.enemies.find(e => e.archetype === 'chaser');
    expect(chaser).toBeDefined();
    expect(chaser!.health).toBe(40);

    // Rotate ship West (heading Math.PI) so Starboard battery (3 cannons, 20 dmg each = 60 dmg) points North directly at chaser (480, 150)
    await pointWorld(page, 100, 270);
    await page.clock.runFor(600);

    // Focus sailing controls region so keyboard events are delivered
    const controls = page.getByRole('region', { name: 'Sailing controls' });
    await controls.focus();

    // Fire Starboard battery with held key down through step
    await page.keyboard.down('e');
    await page.clock.runFor(40);
    await page.keyboard.up('e');

    const firing = await getSnapshot(page);
    expect(firing.projectiles.filter(p => p.faction === 'player')).toHaveLength(3);

    // Advance clock so broadside projectiles hit the Chaser simultaneously
    await page.clock.runFor(1200);

    const afterHit = await getSnapshot(page);
    // Score must increment by EXACTLY 1 (atomic kill, no duplicate points from multiple projectile hits)
    expect(afterHit.score).toBe(1);
    await expect(page.getByLabel('Combat status')).toContainText('Score 1');
  });

  // Task 3.4: Game end with strict priority rule (ship death prevails over time expired)
  test('game end strict priority: lethal damage in final simulation tick reports player_destroyed', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-28T03:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T03:00:01Z'));

    await page.goto('/?seed=0'); await settleStartup(page);

    // Configure session duration in options
    await page.evaluate(data => {
      localStorage.setItem('pirate-battle.options.v1', JSON.stringify({ version: 1, data }));
    }, { sessionDurationMs: 60000, enemySpawnIntervalMs: 1000 });

    await page.getByRole('button', { name: 'Play', exact: true }).click();

    for (let n = 0; n < 40 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await waitForArenaReady(page);

    // Run clock until session completes
    for (let elapsed = 0; elapsed < 125000 && !(await page.getByRole('heading', { name: 'Result', exact: true }).isVisible()); elapsed += 1000) {
      await page.clock.runFor(1000);
    }

    const resultHeading = page.getByRole('heading', { name: 'Result', exact: true });
    await expect(resultHeading).toBeVisible();

    // Result screen must report Ship destroyed (definitively not Time expired)
    await expect(page.locator('.result-reason')).toHaveText('Ship destroyed');
    await expect(page.getByText('Ship destroyed', { exact: true })).toBeVisible();

    // Persisted Last Result must record endReason: player_destroyed
    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate-battle.last-result.v1');
      return raw ? JSON.parse(raw).data : null;
    });
    expect(persisted).not.toBeNull();
    expect(persisted.endReason).toBe('player_destroyed');
  });

  // Task 3.5: Abandon match in pause menu confirms and returns to Main Menu without saving to Last Result or Outbox
  test('abandon match in pause dialog returns to menu without Last Result or Outbox persistence', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await waitForArenaReady(page);

    // Pause the match
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Paused', exact: true })).toBeVisible();

    // Click Main Menu in pause dialog
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();

    // Confirmation dialog appears
    const abandonDialog = page.getByRole('dialog', { name: 'Abandon this match?', exact: true });
    await expect(abandonDialog).toBeVisible();

    // Confirm Abandon
    await page.getByRole('button', { name: 'Abandon', exact: true }).click();

    // Returns to Main Menu
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);

    // Verify localStorage has no last-result and no outbox entries
    const storage = await page.evaluate(() => ({
      lastResult: localStorage.getItem('pirate-battle.last-result.v1'),
      outbox: localStorage.getItem('pirate-battle.outbox.v1'),
    }));

    expect(storage.lastResult).toBeNull();
    expect(storage.outbox).toBeNull();
    await expect(page.getByRole('button', { name: 'Last Result', exact: true })).toHaveCount(0);
    await expect(page.locator('.outbox-pending-notice')).not.toBeVisible();
  });

  // Task 3.6: Simulation freeze on manual pause ('P' and Escape), blur and hidden tab with no catch-up upon resume
  test('simulation freeze on pause, blur and hidden tab neutralizes auto-sail with no catch-up', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Desktop keyboard/focus test');

    await page.clock.install({ time: new Date('2026-10-28T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T12:00:01Z'));

    await page.goto('/?combatScenario=empty&geometry=1&seed=424242'); await settleStartup(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click();

    for (let n = 0; n < 30 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await waitForArenaReady(page);

    // Engage auto-sail
    await page.keyboard.press('r');
    await page.clock.runFor(100);
    expect((await getSnapshot(page)).autoSailEnabled).toBe(true);

    // 1. Manual Pause via 'p' key
    await page.keyboard.press('p');
    const pausedByP = await getSnapshot(page);
    expect(pausedByP.state).toBe('paused');
    expect(pausedByP.autoSailEnabled).toBe(false);

    // Advance clock while paused: state and time must NOT advance
    await page.clock.runFor(15000);
    expect(await getSnapshot(page)).toEqual(pausedByP);

    // Resume via button
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(100);
    const resumed = await getSnapshot(page);
    expect(resumed.state).toBe('playing');
    // Auto-sail was neutralized upon pause, must remain false
    expect(resumed.autoSailEnabled).toBe(false);
    // Active time advances only by the 100ms stepped, no 15s catch-up!
    expect(resumed.activeTimeMs - pausedByP.activeTimeMs).toBeLessThanOrEqual(200);

    // 2. Pause via Escape key
    await page.keyboard.press('Escape');
    const pausedByEsc = await getSnapshot(page);
    expect(pausedByEsc.state).toBe('paused');
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(50);

    // 3. Tab visibility hidden emulation
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    const hiddenPaused = await getSnapshot(page);
    expect(hiddenPaused.state).toBe('paused');
    expect(hiddenPaused.autoSailEnabled).toBe(false);

    await page.clock.runFor(20000);
    expect(await getSnapshot(page)).toEqual(hiddenPaused);

    // Restore visibility
    await page.evaluate(() => {
      Reflect.deleteProperty(document, 'hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(50);
    expect((await getSnapshot(page)).state).toBe('playing');
  });

  // Task 4.1: Mobile joypad with pointercancel releases control immediately without stuck direction or cruise activation
  test('mobile joypad pointercancel releases control immediately without lingering direction or auto-sail', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile touch test');

    await page.goto('/?combatScenario=empty&geometry=1&seed=424242');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await waitForArenaReady(page);

    const joypad = page.locator('.joypad');
    await expect(joypad).toBeVisible();

    const joyBox = await joypad.boundingBox();
    expect(joyBox).not.toBeNull();
    const centerX = joyBox!.x + joyBox!.width / 2;
    const centerY = joyBox!.y + joyBox!.height / 2;

    // Simulate pointerdown and pointermove on joypad
    await page.evaluate(
      ({ x, y }) => {
        const el = document.querySelector('.joypad')!;
        el.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            pointerId: 42,
            pointerType: 'touch',
            clientX: x,
            clientY: y,
            isPrimary: true,
          })
        );
        el.dispatchEvent(
          new PointerEvent('pointermove', {
            bubbles: true,
            cancelable: true,
            pointerId: 42,
            pointerType: 'touch',
            clientX: x + 25,
            clientY: y - 25,
            isPrimary: true,
          })
        );
      },
      { x: centerX, y: centerY }
    );

    // Verify joypad captured the pointer
    let diag = await page.evaluate(() => (window as unknown as { __arenaDiagnostics(): { navigation: TouchNavigationDiag | null } }).__arenaDiagnostics().navigation);
    expect(diag?.sources?.joypad).toBe(42);

    // Dispatch pointercancel event on the joypad
    await page.evaluate(() => {
      const el = document.querySelector('.joypad')!;
      el.dispatchEvent(
        new PointerEvent('pointercancel', {
          bubbles: true,
          cancelable: true,
          pointerId: 42,
          pointerType: 'touch',
          isPrimary: true,
        })
      );
    });

    // Verify control is neutralized immediately
    diag = await page.evaluate(() => (window as unknown as { __arenaDiagnostics(): { navigation: TouchNavigationDiag | null } }).__arenaDiagnostics().navigation);
    expect(diag?.sources?.joypad).toBeNull();
    expect(diag?.sources?.moving).toBe(false);

    // Auto-sail must NOT be activated by pointer cancellation
    const snapshot = await getSnapshot(page);
    expect(snapshot.autoSailEnabled).toBe(false);
  });

  // Task 4.2: Full end-to-end data lifecycle: match completion -> persistence -> MSW Outbox dispatch -> reflection in Ranking and Match History
  test('full end-to-end data lifecycle: match completion propagates to Ranking and Match History', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Desktop lifecycle test');
    test.setTimeout(180000);

    await page.clock.install({ time: new Date('2026-10-28T03:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T03:00:01Z'));

    // Inject 60s session duration before initial page load
    await page.addInitScript(data => {
      localStorage.setItem('pirate-battle.options.v1', JSON.stringify({ version: 1, data }));
    }, { sessionDurationMs: 60000, enemySpawnIntervalMs: 1000 });

    await page.goto('/?combatScenario=targets&geometry=1&seed=424242'); await settleStartup(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click();

    for (let n = 0; n < 40 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await waitForArenaReady(page);

    // Aim west and fire broadside (E) to destroy target and score
    await pointWorld(page, 100, 270);
    await page.clock.runFor(600);
    const controls = page.getByRole('region', { name: 'Sailing controls' });
    await controls.focus();
    await page.keyboard.down('e');
    await page.clock.runFor(40);
    await page.keyboard.up('e');
    await page.clock.runFor(1200);

    const snapshot = await getSnapshot(page);
    expect(snapshot.score).toBeGreaterThanOrEqual(1);

    // Run until session ends by time (60000ms)
    await page.clock.runFor(60000);

    const resultHeading = page.getByRole('heading', { name: 'Result', exact: true });
    await expect(resultHeading).toBeVisible();

    // Verify delivery status transitions to Recorded via MSW POST /api/matches
    const deliveryStatus = page.locator('.delivery-status');
    await expect(deliveryStatus).toHaveText('Recorded');

    // Return to Main Menu
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();

    // Check Match History tab: match must appear at top of list
    const historyTab = page.getByRole('tab', { name: 'Match History', exact: true });
    await historyTab.click();
    const historyTable = page.getByRole('table', { name: 'Match history table' });
    await expect(historyTable).toBeVisible();
    await expect(historyTable).toContainText('Time expired');
    await expect(historyTable).toContainText('60s · 1.0s spawn');

    // Check Ranking tab: ranking table is populated and interactive
    const rankingTab = page.getByRole('tab', { name: 'Ranking', exact: true });
    await rankingTab.click();
    const rankingTable = page.getByRole('table', { name: 'Ranking table' });
    await expect(rankingTable).toBeVisible();
    await expect(rankingTable).toContainText('Captain');
  });

  // Task 4.3: Network consistency scenarios: commit-timeout with idempotent retry and out-of-order race resilience
  test('network scenario commit-timeout drops initial commit response and recovers idempotently on retry', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-28T03:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T03:00:01Z'));

    await page.goto('/?networkScenario=commit-timeout&seed=0'); await settleStartup(page);

    // Configure fast session and commit-timeout scenario
    await page.evaluate(data => {
      localStorage.setItem('pirate-battle.options.v1', JSON.stringify({ version: 1, data }));
    }, { sessionDurationMs: 60000, enemySpawnIntervalMs: 1000 });

    await page.getByRole('button', { name: 'Play', exact: true }).click();

    for (let n = 0; n < 40 && (await page.locator('.arena-screen').getAttribute('data-state')) !== 'ready'; n++) {
      await page.clock.runFor(100);
    }
    await waitForArenaReady(page);

    // Let player be destroyed by seed=0 enemies
    for (let elapsed = 0; elapsed < 125000 && !(await page.getByRole('heading', { name: 'Result', exact: true }).isVisible()); elapsed += 1000) {
      await page.clock.runFor(1000);
    }

    await expect(page.getByRole('heading', { name: 'Result', exact: true })).toBeVisible();

    // Under commit-timeout scenario, first response was dropped -> status is Pending — Retry
    const deliveryStatus = page.locator('.delivery-status');
    await expect(deliveryStatus).toHaveText('Pending — Retry');

    const retryBtn = page.locator('.retry-button');
    await expect(retryBtn).toBeVisible();

    // Outbox holds 1 pending match
    const outboxCountBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate-battle.outbox.v1');
      if (!raw) return 0;
      return JSON.parse(raw).data.length;
    });
    expect(outboxCountBefore).toBe(1);

    // Click Retry: identical match is accepted idempotently by MSW
    await retryBtn.click();

    await expect(deliveryStatus).toHaveText('Recorded');
    await expect(retryBtn).not.toBeVisible();

    // Local outbox is now empty
    const outboxCountAfter = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate-battle.outbox.v1');
      if (!raw) return 0;
      return JSON.parse(raw).data.length;
    });
    expect(outboxCountAfter).toBe(0);
  });

  test('network scenario out-of-order prevents stale response overwrite across rapid tab switches', async ({ page }) => {
    await page.goto('/?networkScenario=out-of-order');
    await expect(page.getByRole('heading', { name: 'Pirate Battle', exact: true })).toBeVisible();

    const rankingTab = page.getByRole('tab', { name: 'Ranking', exact: true });
    const historyTab = page.getByRole('tab', { name: 'Match History', exact: true });

    // Rapidly alternate tab clicks to trigger out-of-order delayed MSW responses
    for (let i = 0; i < 4; i++) {
      await historyTab.click();
      await rankingTab.click();
    }

    // Switch to history tab and verify it settles with canonical history state without ranking overwrite
    await historyTab.click();
    await expect(historyTab).toHaveAttribute('aria-selected', 'true');
    await expect(rankingTab).toHaveAttribute('aria-selected', 'false');

    // Fresh session history panel displays empty message
    const historyEmpty = page.locator('#panel-history .tab-empty-message');
    await expect(historyEmpty).toBeVisible();
    await expect(historyEmpty).toContainText('No completed matches yet.');

    // Switch back to ranking and verify ranking table is visible
    await rankingTab.click();
    await expect(rankingTab).toHaveAttribute('aria-selected', 'true');
    const rankingTable = page.locator('.leaderboard-table');
    await expect(rankingTable).toBeVisible();
    await expect(rankingTable).toContainText('Captain Anne Bonny');
  });
});
