import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../data/queryClient';
import { createPreviewOwner } from '../render/previewOwner';
import { countSubscription, initializePixiPreview } from '../render/pixiPreview';
import type { ArenaStatus } from '../render/pixiPreview';
import { observeArenaResize } from '../render/resizeObserver';
import { createLoadingAttempt } from '../render/loadingAttempt';
import { sessionAssets } from '../render/sessionAssets';
import { createLocalAdapter } from '../storage/local';
import { createGameConfig, DEFAULT_CONFIG } from '../domain/config';
import { configurationKey } from '../domain/validation';
import { createSessionCompletion } from '../domain/session';
import type { CompletedMatchResult } from '../domain/result';
import type { SimulationEvent } from '../simulation/contracts';
import { preparePlay } from './sessionBoundary';
import { Options } from './Options';
import { BattleHud } from './BattleHud';
import { Dialog } from './Dialog';
import { Result } from './screens/Result';
import { MainMenu } from './screens/MainMenu';
import { outboxStore } from '../data/outboxStore';
import { outboxService } from '../data/outboxService';
import { createAudioEngine } from '../audio/audioEngine';
import { orientation, enterLandscape } from '../input/browserOrientation';
import './styles.css';

const local = createLocalAdapter(() => window.localStorage);
const audioEngine = createAudioEngine({
  initialMuted: typeof window !== 'undefined' ? local.readSoundMuted() : false,
});

type Play = ReturnType<typeof preparePlay>;
type Outcome = { result: CompletedMatchResult; saved: boolean };
type Ended = Extract<SimulationEvent, { type: 'ended' }>;

function Arena({
  run,
  fail,
  outcome,
  soundMuted,
  onToggleMute,
  onMenu,
  onRetry,
  onComplete,
  onAgain,
}: {
  run: Play;
  fail: boolean;
  outcome: Outcome | null;
  soundMuted: boolean;
  onToggleMute(): void;
  onMenu(): void;
  onRetry(): void;
  onComplete(preparation: Play, event: Ended): void;
  onAgain(): void;
}) {
  const host = useRef<HTMLDivElement>(null), status = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [navigation, setNavigation] = useState<ArenaStatus>({
    mode: window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop',
    cooldownRemainingMs: [0, 0, 0],
    cooldownDurationMs: ['front', 'port', 'starboard'].map(key => run.preparation.setup.configuration.weapons[key as 'front' | 'port' | 'starboard'].cooldownMs),
    paused: false,
    autoSail: false,
    score: 0,
    cooldowns: ['Ready', 'Ready', 'Ready'],
    remainingSeconds: Math.ceil(run.preparation.setup.configuration.options.sessionDurationMs / 1000),
    health: run.preparation.setup.configuration.ships.player.maxHealth,
    maxHealth: run.preparation.setup.configuration.ships.player.maxHealth,
    state: 'playing',
  });
  const controls = useRef({ pause: () => {}, resume: () => {} });
  const [confirm, setConfirm] = useState(false);
  const { blocked } = useSyncExternalStore(orientation.subscribe, orientation.getSnapshot);
  const navigationPaused = useRef(false);
  useLayoutEffect(() => {
    if (blocked) { controls.current.pause(); audioEngine.onPause(); }
  }, [blocked]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let active = true;
    audioEngine.resetThresholds();
    navigationPaused.current = false;

    const attempt = createLoadingAttempt({
      fail,
      acquire: sessionAssets.acquire,
      initialize: textures => initializePixiPreview(
        element,
        textures,
        value => {
          if (active) {
            if (value.paused && !navigationPaused.current) audioEngine.onPause();
            navigationPaused.current = value.paused;
            setNavigation(value);
            if (!value.paused) audioEngine.checkThresholds(value.health, value.maxHealth, value.remainingSeconds);
          }
        },
        run.preparation.setup,
        run.initial,
        events => {
          if (active) {
            audioEngine.handleSimulationEvents(events);
            for (const event of events) if (event.type === 'ended') onComplete(run, event);
          }
        },
      ),
    });

    const owner = createPreviewOwner({
      initialize: attempt.initialize,
      observeResize: resize => {
        const stop = observeArenaResize(element, resize);
        countSubscription(1);
        return () => { stop(); countSubscription(-1); };
      },
      onState: value => {
        setState(value);
        if (value === 'ready' && !orientation.getSnapshot().blocked && !navigationPaused.current) void audioEngine.startLoop('oceanAmbience');
      },
    });
    controls.current = owner;
    if (orientation.getSnapshot().blocked) owner.pause();

    return () => {
      active = false;
      audioEngine.stopAllLoops();
      owner.dispose();
      attempt.dispose();
    };
  }, [run, fail, onComplete]);

  // Restore game focus only after React has removed the paused host's inert flag.
  useEffect(() => {
    if (outcome || blocked) return;
    if (state === 'ready') { if (!navigation.paused) host.current?.focus(); }
    else status.current?.focus();
  }, [state, navigation.paused, outcome, blocked]);

  const pauseGame = () => {
    controls.current.pause();
  };

  const resumeGame = () => {
    if (orientation.getSnapshot().blocked) return;
    controls.current.resume();
    audioEngine.onResume();
  };

  const menu = () => {
    if (state !== 'ready') onMenu();
    else {
      pauseGame();
      setConfirm(true);
    }
  };

  return <>
    <main className="arena-screen" data-state={state} data-input-mode={navigation.mode} data-match-id={run.preparation.matchId} inert={outcome !== null} aria-hidden={outcome !== null}>
      <div className="arena-host" ref={host} role="region" aria-label="Sailing controls" aria-describedby="sailing-instructions" tabIndex={state === 'ready' && !navigation.paused ? 0 : -1} style={{ visibility: state === 'ready' ? 'visible' : 'hidden' }} inert={navigation.paused || outcome !== null} aria-hidden={navigation.paused || outcome !== null} />
      <div className="battle-hud" style={{ visibility: state === 'ready' ? 'visible' : 'hidden' }} inert={state !== 'ready' || navigation.paused || outcome !== null} aria-hidden={state !== 'ready' || navigation.paused || outcome !== null}>
        <BattleHud status={navigation} soundMuted={soundMuted} onToggleMute={onToggleMute} pause={pauseGame} menu={menu} />
      </div>
      {state !== 'ready' && <>
        <header className="arena-top"><h1 ref={status} tabIndex={-1}>{state === 'failed' ? 'Loading failed' : 'Loading'}</h1></header>
        <div className="arena-message" role="status" aria-live="polite">{state === 'loading' ? <p>Preparing the ships and islands…</p> : <><p>Assets or graphics could not be loaded. Please try again.</p><button onClick={onRetry}>Retry</button></>}</div>
        <nav className="arena-bottom"><button className="secondary" onClick={menu}>Main Menu</button></nav>
      </>}
      {navigation.paused && !outcome && (
        confirm ? (
          <Dialog title="Abandon this match?" onEscape={() => setConfirm(false)}>
            <p>Leaving ends this run without saving a result.</p>
            <button onClick={() => setConfirm(false)}>Keep Playing</button>
            <button className="secondary" onClick={onMenu}>Abandon</button>
          </Dialog>
        ) : (
          <Dialog title="Paused" onEscape={resumeGame}>
            <p role="note">Auto-sail Off. Choose Resume, then press R to sail.</p>
            <button onClick={resumeGame}>Resume</button>
            <button className="secondary" onClick={() => setConfirm(true)}>Main Menu</button>
          </Dialog>
        )
      )}
    </main>
    {outcome && <Result outcome={outcome} onAgain={onAgain} onMenu={onMenu} />}
  </>;
}

export function App() {
  const [boot] = useState(() => {
    const savedIdentity = local.readIdentity(), savedResult = local.readResult(), options = local.readOptions();
    const identity = savedIdentity.value ?? { playerId: crypto.randomUUID(), playerName: `Captain-${crypto.randomUUID().slice(0, 4).toUpperCase()}` };
    const identitySaved = savedIdentity.value || local.saveIdentity(identity);
    return { identity, result: savedResult.value, optionsNotice: options.notice, notice: [savedIdentity.notice, savedResult.notice, !identitySaved && 'Local storage is unavailable. You can still play.'].filter(Boolean).join(' ') };
  });
  const [soundMuted, setSoundMuted] = useState(() => local.readSoundMuted());
  const [attempt, setAttempt] = useState<{ run: Play; generation: number; fail: boolean } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [lastResult, setLastResult] = useState<Outcome | null>(() => boot.result ? { result: boot.result, saved: true } : null);
  const [optionsNotice, setOptionsNotice] = useState(boot.optionsNotice);
  const [editing, setEditing] = useState<ReturnType<typeof local.readOptions> | null>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const focusOptions = useRef(false);
  const active = useRef<{ run: Play; completion: ReturnType<typeof createSessionCompletion> } | null>(null);
  const generation = useRef(0), failureConsumed = useRef(false), play = useRef<HTMLButtonElement>(null), hasVisited = useRef(false);

  const handleToggleMute = (muted?: boolean) => {
    const next = muted !== undefined ? muted : !soundMuted;
    setSoundMuted(next);
    local.saveSoundMuted(next);
    audioEngine.setMuted(next);
  };

  const onComplete = useCallback((run: Play, event: Ended) => {
    if (active.current?.run !== run) return;
    const completed = active.current.completion.complete(event);
    if (completed) {
      // 1. Atomic persist to Outbox store before network request
      outboxStore.enqueue(completed.result);
      // 2. Dispatch to network
      void outboxService.dispatchEntry(completed.result.matchId);
      setLastResult(completed);
      setOutcome(completed);
    }
  }, []);

  const menu = () => {
    active.current?.completion.dispose();
    setAttempt(null);
    setOutcome(null);
  };

  const start = () => {
    if (orientation.getSnapshot().blocked) return;
    void audioEngine.unlock();
    if (orientation.getSnapshot().coarse) void enterLandscape();
    active.current?.completion.dispose();
    const options = local.readOptions();
    setOptionsNotice(options.notice);
    const run = preparePlay(options.value, boot.identity, new URLSearchParams(window.location.search), { id: () => crypto.randomUUID(), seed: () => crypto.getRandomValues(new Uint32Array(1))[0]! });
    active.current = { run, completion: createSessionCompletion(run.preparation, () => new Date().toISOString(), local.saveResult) };
    const fail = !failureConsumed.current && new URLSearchParams(window.location.search).get('assetScenario') === 'fail-once';
    if (fail) failureConsumed.current = true;
    hasVisited.current = true;
    setOutcome(null);
    setAttempt({ run, generation: ++generation.current, fail });
  };

  useEffect(() => {
    if (!attempt && !outcome && !editing) {
      if (focusOptions.current) { optionsButton.current?.focus(); focusOptions.current = false; }
      else if (hasVisited.current) play.current?.focus();
    }
  }, [attempt, outcome, editing]);

  const content = (() => {
    if (attempt) return <Arena key={attempt.generation} run={attempt.run} fail={attempt.fail} outcome={outcome} soundMuted={soundMuted} onToggleMute={() => handleToggleMute()} onComplete={onComplete} onMenu={menu} onAgain={start} onRetry={() => setAttempt({ ...attempt, generation: ++generation.current, fail: false })} />;
    if (outcome) return <Result outcome={outcome} onAgain={start} onMenu={menu} />;
    if (editing) return <Options initial={editing.value} notice={editing.notice} soundMuted={soundMuted} onToggleMute={handleToggleMute} save={local.saveOptions} onSaved={() => { setOptionsNotice(undefined); focusOptions.current = true; setEditing(null); }} onCancel={() => { focusOptions.current = true; setEditing(null); }} />;

    const currentOptions = local.readOptions().value ?? DEFAULT_CONFIG.options;
    const currentConfig = createGameConfig(currentOptions);
    const currentConfigKey = configurationKey(currentConfig);
    const currentConfigLabel = `${Math.round(currentOptions.sessionDurationMs / 1000)}s session · ${(
      currentOptions.enemySpawnIntervalMs / 1000
    ).toFixed(1)}s enemy spawn`;

    return (
      <MainMenu
        playRef={play}
        optionsButtonRef={optionsButton}
        onStart={start}
        onOptions={() => {
          const read = local.readOptions();
          setOptionsNotice(read.notice);
          setEditing(read);
        }}
        onLastResult={() => {
          hasVisited.current = true;
          setOutcome(lastResult);
        }}
        lastResult={lastResult}
        storageNotice={[optionsNotice, boot.notice].filter(Boolean).join(' ') || undefined}
        configurationKey={currentConfigKey}
        configurationLabel={currentConfigLabel}
        playerId={boot.identity.playerId}
      />
    );
  })();

  return (
    <QueryClientProvider client={queryClient}>
      {content}
    </QueryClientProvider>
  );
}
