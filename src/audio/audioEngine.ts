import { AUDIO_MANIFEST, type SoundDefinition, type SoundId, type SoundPriority } from './audioManifest';
import type { SimulationEvent } from '../simulation/contracts';
import { sessionAudioData } from './audioData';

export const MAX_EFFECT_VOICES = 4;

const PRIORITY_ORDER: Record<SoundPriority, number> = {
  normal: 1,
  high: 2,
  critical: 3,
};

export interface ActiveVoice {
  readonly id: SoundId;
  readonly priority: SoundPriority;
  readonly startedAtMs: number;
  readonly source: AudioBufferSourceNode | null;
  readonly gain: GainNode | null;
}

export interface AudioEngineOptions {
  readonly context?: AudioContext;
  readonly initialMuted?: boolean;
  readonly data?: typeof sessionAudioData;
}

export interface AudioEngine {
  readonly isUnlocked: () => boolean;
  readonly isMuted: () => boolean;
  readonly setMuted: (muted: boolean) => void;
  readonly unlock: () => Promise<void>;
  readonly play: (id: SoundId) => Promise<void>;
  readonly startLoop: (id: 'oceanAmbience' | 'shipSailing') => Promise<void>;
  readonly stopLoop: (id: 'oceanAmbience' | 'shipSailing') => void;
  readonly stopAllLoops: () => void;
  readonly checkThresholds: (playerHealth: number, maxHealth: number, remainingSeconds: number) => void;
  readonly resetThresholds: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly handleSimulationEvents: (events: readonly SimulationEvent[]) => void;
  readonly getActiveVoiceCount: () => number;
  readonly destroy: () => void;
}

export function createAudioEngine(options: AudioEngineOptions = {}): AudioEngine {
  let context: AudioContext | null = options.context ?? null;
  let unlocked = false;
  let muted = options.initialMuted ?? false;
  let masterGain: GainNode | null = null;

  // Single-trigger threshold sentinels
  let lowHealthTriggered = false;
  let timeWarningTriggered = false;

  // Track active transient voices
  const activeVoices: ActiveVoice[] = [];

  // Dedicated loop nodes
  const loops: Partial<Record<'oceanAmbience' | 'shipSailing', { source: AudioBufferSourceNode | null; gain: GainNode | null }>> = {};

  // Buffer cache
  const bufferCache = new Map<SoundId, AudioBuffer>();
  const loadingPromises = new Map<SoundId, Promise<AudioBuffer | null>>();
  const audioData = options.data ?? sessionAudioData;
  let acousticGeneration = 0;
  let destroyed = false;
  const loopRequests = new Map<string, number>();

  // Check Web Audio API availability
  const hasWebAudio = typeof window !== 'undefined' && (
    'AudioContext' in window || 'webkitAudioContext' in window
  );

  function getContext(): AudioContext | null {
    if (context) return context;
    if (!hasWebAudio) return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      context = new AudioCtx();
      masterGain = context.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterGain.connect(context.destination);
      return context;
    } catch {
      return null;
    }
  }

  // Setup initial master gain if context was supplied
  if (context) {
    try {
      masterGain = context.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterGain.connect(context.destination);
    } catch {
      // Ignored in headless/test environments
    }
  }

  async function unlock(): Promise<void> {
    if (unlocked) return;
    const ctx = getContext();
    if (!ctx) {
      unlocked = true;
      return;
    }
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Fallback silently if resume fails
      }
    }
    unlocked = true;
  }

  function setMuted(nextMuted: boolean): void {
    muted = nextMuted;
    if (masterGain && masterGain.gain) {
      masterGain.gain.value = muted ? 0 : 1;
    }
  }

  async function loadBuffer(id: SoundId): Promise<AudioBuffer | null> {
    if (bufferCache.has(id)) return bufferCache.get(id)!;
    if (loadingPromises.has(id)) return loadingPromises.get(id)!;
    const ctx = getContext();
    if (!ctx) return null;

    const def: SoundDefinition = AUDIO_MANIFEST[id];
    const promise = (async () => {
      try {
        const arrayBuffer = await audioData.load(def.url);
        if (!arrayBuffer || destroyed) return null;
        const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
        bufferCache.set(id, decoded);
        return decoded;
      } catch {
        return null;
      } finally {
        loadingPromises.delete(id);
      }
    })();
    loadingPromises.set(id, promise);
    return promise;
  }

  function removeVoice(voice: ActiveVoice): void {
    const index = activeVoices.indexOf(voice);
    if (index !== -1) {
      activeVoices.splice(index, 1);
    }
    if (voice.source) {
      try {
        voice.source.stop();
        voice.source.disconnect();
      } catch {
        // Source might already have stopped
      }
    }
  }

  function stopAllTransientVoices(): void {
    while (activeVoices.length > 0) {
      const voice = activeVoices.pop();
      if (voice?.source) {
        try {
          voice.source.stop();
          voice.source.disconnect();
        } catch {
          // Ignore
        }
      }
    }
  }

  async function play(id: SoundId): Promise<void> {
    if (!unlocked || muted || destroyed) return;
    const generation = acousticGeneration;
    const ctx = getContext();
    if (!ctx) return;

    const def: SoundDefinition = AUDIO_MANIFEST[id];
    const soundPriority = def.priority;

    // Voice limiting & voice stealing for transient sounds
    if (activeVoices.length >= MAX_EFFECT_VOICES) {
      // Find candidate to steal: oldest voice with lowest priority
      let lowestPriorityVal = Infinity;
      let candidateIndex = -1;
      let oldestTime = Infinity;

      for (let i = 0; i < activeVoices.length; i++) {
        const v = activeVoices[i]!;
        const pVal = PRIORITY_ORDER[v.priority];
        if (pVal < lowestPriorityVal || (pVal === lowestPriorityVal && v.startedAtMs < oldestTime)) {
          lowestPriorityVal = pVal;
          oldestTime = v.startedAtMs;
          candidateIndex = i;
        }
      }

      const incomingPriorityVal = PRIORITY_ORDER[soundPriority];
      if (incomingPriorityVal < lowestPriorityVal) {
        // The incoming sound is lower priority than all currently playing voices; drop it.
        return;
      }

      // Steal the lowest priority candidate
      if (candidateIndex !== -1) {
        const stolen = activeVoices.splice(candidateIndex, 1)[0]!;
        if (stolen.source) {
          try {
            stolen.source.stop();
            stolen.source.disconnect();
          } catch {
            // Ignore
          }
        }
      }
    }

    const buffer = await loadBuffer(id);
    if (!buffer || !ctx || muted || destroyed || generation !== acousticGeneration) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 1;
      source.connect(voiceGain);

      if (masterGain) {
        voiceGain.connect(masterGain);
      } else {
        voiceGain.connect(ctx.destination);
      }

      const voice: ActiveVoice = {
        id,
        priority: soundPriority,
        startedAtMs: Date.now(),
        source,
        gain: voiceGain,
      };

      source.onended = () => {
        removeVoice(voice);
      };

      activeVoices.push(voice);
      source.start();
    } catch {
      // Fallback silently on playback error
    }
  }

  async function startLoop(id: 'oceanAmbience' | 'shipSailing'): Promise<void> {
    if (!unlocked || destroyed || loopRequests.has(id) || muted && !masterGain) return;
    const generation = acousticGeneration;
    const ctx = getContext();
    if (!ctx) return;

    const existing = loops[id];
    if (existing?.source) return; // already looping
    loopRequests.set(id, generation);
    const buffer = await loadBuffer(id);
    const valid = loopRequests.get(id) === generation;
    if (valid) loopRequests.delete(id);
    if (!buffer || !ctx || !valid || muted && !masterGain || destroyed || generation !== acousticGeneration) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const loopGain = ctx.createGain();
      loopGain.gain.value = 1;
      source.connect(loopGain);

      if (masterGain) {
        loopGain.connect(masterGain);
      } else {
        loopGain.connect(ctx.destination);
      }

      source.start();
      loops[id] = { source, gain: loopGain };
    } catch {
      // Silently ignore
    }
  }

  function stopLoop(id: 'oceanAmbience' | 'shipSailing'): void {
    loopRequests.delete(id);
    const loop = loops[id];
    if (loop?.source) {
      try {
        loop.source.stop();
        loop.source.disconnect();
      } catch {
        // Ignore
      }
      delete loops[id];
    }
  }

  function stopAllLoops(): void {
    stopLoop('oceanAmbience');
    stopLoop('shipSailing');
  }

  function checkThresholds(playerHealth: number, maxHealth: number, remainingSeconds: number): void {
    // Health <= 25% threshold sentinel
    if (maxHealth > 0 && playerHealth > 0 && (playerHealth / maxHealth) <= 0.25) {
      if (!lowHealthTriggered) {
        lowHealthTriggered = true;
        void play('healthLow');
      }
    }

    // 10 seconds remaining threshold sentinel
    if (remainingSeconds <= 10 && remainingSeconds > 0) {
      if (!timeWarningTriggered) {
        timeWarningTriggered = true;
        void play('timeWarning');
      }
    }
  }

  function resetThresholds(): void {
    lowHealthTriggered = false;
    timeWarningTriggered = false;
  }

  function onPause(): void {
    acousticGeneration++;
    // 1. Immediately cut sailing loops and ambience
    stopAllLoops();
    // 2. Discard all acoustic backlog (clear active transient voices)
    stopAllTransientVoices();
    // 3. Play game_pause jingle
    void play('gamePause');
  }

  function onResume(): void {
    acousticGeneration++;
    // Discard any accumulated acoustic backlog
    stopAllTransientVoices();
    // Play game_resume jingle
    void play('gameResume');
    // Restore ocean ambience
    void startLoop('oceanAmbience');
  }

  function handleSimulationEvents(events: readonly SimulationEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'fire':
          if (event.weapon === 'front' || event.weapon === 'shooter') {
            const choices: readonly SoundId[] = ['cannonFire1', 'cannonFire2', 'cannonFire3'];
            const chosen = choices[Math.floor(Math.random() * choices.length)]!;
            void play(chosen);
          } else {
            void play('cannonBroadside');
          }
          break;
        case 'water_hit': {
          const choices: readonly SoundId[] = ['cannonballWaterHit1', 'cannonballWaterHit2'];
          const chosen = choices[Math.floor(Math.random() * choices.length)]!;
          void play(chosen);
          break;
        }
        case 'damage': {
          const choices: readonly SoundId[] = ['shipWoodHit1', 'shipWoodHit2'];
          const chosen = choices[Math.floor(Math.random() * choices.length)]!;
          void play(chosen);
          break;
        }
        case 'destruction': {
          const choices: readonly SoundId[] = ['shipExplosion1', 'shipExplosion2'];
          const chosen = choices[Math.floor(Math.random() * choices.length)]!;
          void play(chosen);
          void play('shipSinking');
          break;
        }
        case 'score':
          void play('scorePoint');
          break;
        case 'ended':
          stopAllLoops();
          if (event.reason === 'player_destroyed') {
            void play('gameOver');
          } else {
            void play('gameComplete');
          }
          break;
      }
    }
  }

  function destroy(): void {
    destroyed = true;
    acousticGeneration++;
    stopAllLoops();
    stopAllTransientVoices();
    if (context) {
      try {
        void context.close();
      } catch {
        // Ignore
      }
    }
  }

  return {
    isUnlocked: () => unlocked,
    isMuted: () => muted,
    setMuted,
    unlock,
    play,
    startLoop,
    stopLoop,
    stopAllLoops,
    checkThresholds,
    resetThresholds,
    onPause,
    onResume,
    handleSimulationEvents,
    getActiveVoiceCount: () => activeVoices.length,
    destroy,
  };
}
