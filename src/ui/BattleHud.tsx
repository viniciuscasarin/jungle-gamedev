import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ASSET_MANIFEST } from '../render/assetManifest';
import type { ArenaStatus } from '../render/pixiPreview';

const skills = [
  { key: 'Q', control: 'front', name: 'Front cannon', icon: 'frontReference' },
  { key: 'W', control: 'port', name: 'Port broadside', icon: 'portIcon' },
  { key: 'E', control: 'starboard', name: 'Starboard broadside', icon: 'starboardIcon' },
  { key: 'R', control: 'R', name: 'Auto-sail', icon: 'sailIcon' },
] as const;

function Health({ status }: { status: ArenaStatus }) {
  return (
    <div className="player-health" aria-label={`Health ${status.health}/${status.maxHealth}`}>
      <div className="health-art" role="meter" aria-label="Player health" aria-valuemin={0} aria-valuemax={status.maxHealth} aria-valuenow={status.health}>
        <div className="health-track">
          <div className="health-fill" style={{ width: `${100 * status.health / status.maxHealth}%` }} />
        </div>
      </div>
      <span>Health {status.health}/{status.maxHealth}</span>
    </div>
  );
}

export interface BattleHudProps {
  readonly status: ArenaStatus;
  readonly soundMuted?: boolean;
  readonly onToggleMute?: () => void;
  readonly pause: () => void;
  readonly menu: () => void;
}

export function BattleHud({ status, soundMuted = false, onToggleMute, pause, menu }: BattleHudProps) {
  // Live region single-trigger edge detection
  const [announcement, setAnnouncement] = useState('');
  const prevScore = useRef(status.score);
  const prevPaused = useRef(status.paused);
  const lowHealthTriggered = useRef(false);
  const timeWarningTriggered = useRef(false);

  useEffect(() => {
    // 1. Critical health (<= 25%)
    if (status.maxHealth > 0 && status.health > 0 && (status.health / status.maxHealth) <= 0.25) {
      if (!lowHealthTriggered.current) {
        lowHealthTriggered.current = true;
        setAnnouncement('Critical damage! Hull integrity below 25 percent.');
      }
    } else if (status.maxHealth > 0 && (status.health / status.maxHealth) > 0.25) {
      lowHealthTriggered.current = false;
    }

    // 2. 10 seconds remaining
    if (status.remainingSeconds <= 10 && status.remainingSeconds > 0) {
      if (!timeWarningTriggered.current) {
        timeWarningTriggered.current = true;
        setAnnouncement('Warning: 10 seconds remaining.');
      }
    }

    // 3. Score point on enemy destruction
    if (status.score > prevScore.current) {
      const earned = status.score - prevScore.current;
      prevScore.current = status.score;
      setAnnouncement(`Enemy destroyed! ${earned} point scored. Total score: ${status.score}.`);
    }

    // 4. Pause / Resume transitions
    if (status.paused !== prevPaused.current) {
      prevPaused.current = status.paused;
      setAnnouncement(status.paused ? 'Game paused.' : 'Game resumed.');
    }
  }, [status.health, status.maxHealth, status.remainingSeconds, status.score, status.paused]);

  return (
    <>
      <header className="battle-top" data-hud-band="top">
        {status.mode === 'touch' && <Health status={status} />}
        <div className="top-line">
          <h1>Arena</h1>
          <div className="combat-status" aria-label="Combat status">Score {status.score}</div>
          <div className="match-status" aria-label="Match status">Time {status.remainingSeconds}s · {status.paused ? 'Paused' : 'Playing'}</div>
          {onToggleMute && (
            <button
              type="button"
              className="mute-control secondary"
              onClick={onToggleMute}
              aria-label={soundMuted ? 'Unmute sound' : 'Mute sound'}
              aria-pressed={soundMuted}
            >
              <span aria-hidden="true">{soundMuted ? '🔇' : '🔊'}</span>
              <span className="sr-only">{soundMuted ? 'Sound muted' : 'Sound active'}</span>
            </button>
          )}
          <button className="pause-control" onClick={pause} aria-label="Pause">
            <img src={ASSET_MANIFEST.pauseIcon.url} alt="" onError={e => { e.currentTarget.hidden = true; }} />
            <span>Pause</span>
          </button>
          <button className="menu-control secondary" onClick={menu}>Main Menu</button>
        </div>
      </header>
      <div className="battle-bottom" data-hud-band="bottom">
        <div
          id="sailing-instructions"
          className="control-guide"
          role="status"
          aria-live="polite"
          data-testid="battle-live-region"
        >
          {status.mode === 'touch' ? 'Drag joypad to steer and sail · Hold skills to fire' : 'Mouse to steer · Q front · W port · E starboard · R to sail'} · Auto-sail {status.autoSail ? 'On' : 'Off'}{status.paused ? ' · Paused' : ''}
          {announcement && <span className="sr-only"> · {announcement}</span>}
        </div>
        <div className="battle-control-row">
          {status.mode === 'touch' && (
            <div className="joypad" data-control="joypad" role="group" aria-label="Sailing joypad">
              <span className="joypad-center" /> <span className="joypad-label">Steer / sail</span>
            </div>
          )}
          <div className="skills" aria-label="Ship skills">
            {skills.map((skill, index) => {
              const text = index === 3 ? (status.autoSail ? 'On' : 'Off') : status.cooldowns[index];
              const fraction = index === 3 ? 0 : Math.max(0, Math.min(1, status.cooldownRemainingMs[index]! / status.cooldownDurationMs[index]!));
              return (
                <button
                  key={skill.key}
                  className="skill"
                  data-control={skill.control}
                  data-key={`Key${skill.key}`}
                  data-ready={fraction === 0}
                  data-state={text}
                  aria-label={`${skill.name} ${skill.key}: ${text}`}
                  aria-pressed={index === 3 ? status.autoSail : undefined}
                  style={{ '--cooldown': fraction } as CSSProperties}
                >
                  <span className="cooldown-fill" />
                  <img src={ASSET_MANIFEST[skill.icon].url} alt="" onError={e => { e.currentTarget.hidden = true; }} />
                  <kbd>{skill.key}</kbd>
                  <span className="skill-state">{text}</span>
                </button>
              );
            })}
          </div>
        </div>
        {status.mode === 'desktop' && <Health status={status} />}
      </div>
    </>
  );
}
