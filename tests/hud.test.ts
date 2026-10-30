import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { BattleHud } from '../src/ui/BattleHud';
import { Options } from '../src/ui/Options';
import { Dialog } from '../src/ui/Dialog';
import type { ArenaStatus } from '../src/render/pixiPreview';

const mockStatus: ArenaStatus = {
  mode: 'desktop',
  cooldownRemainingMs: [0, 0, 0],
  cooldownDurationMs: [350, 1200, 1200],
  paused: false,
  autoSail: false,
  score: 0,
  cooldowns: ['Ready', 'Ready', 'Ready'],
  remainingSeconds: 120,
  health: 100,
  maxHealth: 100,
  state: 'playing',
};

describe('BattleHud component accessibility', () => {
  it('renders polite live region for accessible screen reader announcements', () => {
    const html = renderToString(
      createElement(BattleHud, {
        status: mockStatus,
        soundMuted: false,
        onToggleMute: vi.fn(),
        pause: vi.fn(),
        menu: vi.fn(),
      })
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-testid="battle-live-region"');
    expect(html).toContain('class="sr-only"');
  });

  it('renders accessible mute toggle button with aria-label and aria-pressed states', () => {
    const onToggleMute = vi.fn();

    // Unmuted state
    const unmutedHtml = renderToString(
      createElement(BattleHud, {
        status: mockStatus,
        soundMuted: false,
        onToggleMute,
        pause: vi.fn(),
        menu: vi.fn(),
      })
    );
    expect(unmutedHtml).toContain('aria-label="Mute sound"');
    expect(unmutedHtml).toContain('aria-pressed="false"');
    expect(unmutedHtml).toContain('Sound active');

    // Muted state
    const mutedHtml = renderToString(
      createElement(BattleHud, {
        status: mockStatus,
        soundMuted: true,
        onToggleMute,
        pause: vi.fn(),
        menu: vi.fn(),
      })
    );
    expect(mutedHtml).toContain('aria-label="Unmute sound"');
    expect(mutedHtml).toContain('aria-pressed="true"');
    expect(mutedHtml).toContain('Sound muted');
  });

  it('adapts accessible layout for touch mode with joypad and top health bar', () => {
    const touchStatus: ArenaStatus = { ...mockStatus, mode: 'touch' };
    const html = renderToString(
      createElement(BattleHud, {
        status: touchStatus,
        soundMuted: false,
        onToggleMute: vi.fn(),
        pause: vi.fn(),
        menu: vi.fn(),
      })
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Sailing joypad"');
    expect(html).toContain('id="sailing-instructions" class="sr-only"');
    expect(html).toContain('aria-label="Dismiss control tips"');
    expect(html).toMatch(/role="status" aria-live="polite" aria-atomic="true" data-testid="battle-live-region"><\/div>/);
    expect(html.match(/id="sailing-instructions"/g)).toHaveLength(1);
  });
});

describe('Options component sound control', () => {
  it('renders accessible sound mute button within settings panel', () => {
    const onToggleMute = vi.fn();
    const html = renderToString(
      createElement(Options, {
        initial: { sessionDurationMs: 120000, enemySpawnIntervalMs: 3000 },
        notice: undefined,
        soundMuted: false,
        onToggleMute,
        save: vi.fn(() => true),
        onSaved: vi.fn(),
        onCancel: vi.fn(),
      })
    );

    expect(html).toContain('id="sound-mute-button"');
    expect(html).toContain('aria-label="Sound is active, click to mute"');
    expect(html).toContain('Sound: Active');
  });
});

describe('Dialog component accessible focus structure', () => {
  it('renders modal dialog with aria-modal, role and heading association', () => {
    const html = renderToString(
      createElement(
        Dialog,
        { title: 'Paused', onEscape: vi.fn() },
        createElement('button', null, 'Resume')
      )
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="dialog-title"');
    expect(html).toContain('id="dialog-title"');
    expect(html).toContain('Paused');
  });
});
