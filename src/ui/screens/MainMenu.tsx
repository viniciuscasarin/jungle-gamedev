import { useMemo, type RefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { ASSET_MANIFEST } from '../../render/assetManifest';
import { usePendingOutbox } from '../../data/useMatchOutbox';
import type { ResultOutcome } from './Result';
import { LeaderboardTabs } from './LeaderboardTabs';
import { NetworkScenarioPanel } from './NetworkScenarioPanel';
import { getOrGenerateIdentity } from '../../api/identity';
import { DEFAULT_CONFIG } from '../../domain/config';
import { configurationKey as getConfigurationKey } from '../../domain/validation';

export interface MainMenuProps {
  playRef: RefObject<HTMLButtonElement | null>;
  optionsButtonRef: RefObject<HTMLButtonElement | null>;
  onStart(): void;
  onOptions(): void;
  onLastResult(): void;
  lastResult: ResultOutcome | null;
  storageNotice?: string | undefined;
  configurationKey?: string | undefined;
  configurationLabel?: string | undefined;
  playerId?: string | undefined;
  client?: QueryClient | undefined;
}

export function MainMenu({
  playRef,
  optionsButtonRef,
  onStart,
  onOptions,
  onLastResult,
  lastResult,
  storageNotice,
  configurationKey: configurationKeyProp,
  configurationLabel: configurationLabelProp,
  playerId: playerIdProp,
  client,
}: MainMenuProps) {
  const { pendingCount, isDispatching, retryAll } = usePendingOutbox();

  const defaultIdentity = useMemo(() => getOrGenerateIdentity(), []);
  const resolvedPlayerId = playerIdProp ?? defaultIdentity.playerId;
  const resolvedConfigKey = configurationKeyProp ?? getConfigurationKey(DEFAULT_CONFIG);
  const resolvedConfigLabel =
    configurationLabelProp ??
    `${Math.round(DEFAULT_CONFIG.options.sessionDurationMs / 1000)}s session · ${(
      DEFAULT_CONFIG.options.enemySpawnIntervalMs / 1000
    ).toFixed(1)}s enemy spawn`;

  return (
    <main className="menu-screen">
      <section className="menu-panel" aria-labelledby="menu-title">
        <h1 id="menu-title">
          <img
            src={ASSET_MANIFEST.menuTitle.url}
            alt=""
            onError={event => {
              event.currentTarget.hidden = true;
            }}
          />
          <span>Pirate Battle</span>
        </h1>
        <h2 className="menu-kicker">Main Menu</h2>
        <p className="menu-description">
          Mouse to steer. Hold Q for the front cannon, W for port and E for starboard. Press R to turn
          auto-sail on or off. On touch, drag the joypad to steer and sail; hold skills to fire and tap R
          for cruise.
        </p>
        <button ref={playRef} onClick={onStart}>
          Play
        </button>
        <button className="secondary" ref={optionsButtonRef} onClick={onOptions}>
          Options
        </button>
        {lastResult && (
          <button className="secondary" onClick={onLastResult}>
            Last Result
          </button>
        )}

        {pendingCount > 0 && (
          <aside className="outbox-pending-notice" role="status" aria-label="Pending matches notice">
            <p>
              {pendingCount === 1 ? '1 pending match record' : `${pendingCount} pending match records`}
            </p>
            <button
              className="secondary retry-pending-button"
              onClick={() => void retryAll()}
              disabled={isDispatching}
            >
              {isDispatching ? 'Syncing…' : 'Retry Pending'}
            </button>
          </aside>
        )}

        <p className="menu-note">
          Escape / P or Pause to stop. Losing window focus pauses sailing. Choose Resume to return.
        </p>
        <LeaderboardTabs
          configurationKey={resolvedConfigKey}
          configurationLabel={resolvedConfigLabel}
          playerId={resolvedPlayerId}
          client={client}
        />
        <NetworkScenarioPanel client={client} />
        {storageNotice && (
          <p className="storage-notice" role="status">
            {storageNotice}
          </p>
        )}
      </section>
    </main>
  );
}
