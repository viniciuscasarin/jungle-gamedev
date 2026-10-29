import { describe, expect, it, vi } from 'vitest';
import { ALL_SOUND_IDS, AUDIO_MANIFEST } from '../src/audio/audioManifest';
import { createAudioEngine, MAX_EFFECT_VOICES } from '../src/audio/audioEngine';

function createMockAudioContext() {
  const destination = {} as AudioDestinationNode;
  const createdGainNodes: Array<{ gain: { value: number }; connect: ReturnType<typeof vi.fn> }> = [];
  const createdSources: Array<{
    buffer: AudioBuffer | null;
    loop: boolean;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  }> = [];

  const mockContext = {
    state: 'suspended' as AudioContextState,
    destination,
    resume: vi.fn(async () => {
      mockContext.state = 'running';
    }),
    close: vi.fn(async () => {
      mockContext.state = 'closed';
    }),
    createGain: vi.fn(() => {
      const node = {
        gain: { value: 1 },
        connect: vi.fn(),
      };
      createdGainNodes.push(node);
      return node as unknown as GainNode;
    }),
    createBufferSource: vi.fn(() => {
      const source = {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
        onended: null,
      };
      createdSources.push(source);
      return source as unknown as AudioBufferSourceNode;
    }),
    decodeAudioData: vi.fn(async () => {
      return {} as AudioBuffer;
    }),
    _createdGainNodes: createdGainNodes,
    _createdSources: createdSources,
  };

  return mockContext as unknown as AudioContext & {
    _createdGainNodes: typeof createdGainNodes;
    _createdSources: typeof createdSources;
  };
}

describe('audioManifest', () => {
  it('catalogues all 27 WAV sounds with unique IDs and valid categories', () => {
    expect(ALL_SOUND_IDS).toHaveLength(27);
    const categories = new Set(ALL_SOUND_IDS.map(id => AUDIO_MANIFEST[id].category));
    expect(categories).toEqual(new Set(['ambience', 'navigation', 'fire', 'impact', 'destruction', 'threshold', 'ui', 'session']));

    for (const id of ALL_SOUND_IDS) {
      const def = AUDIO_MANIFEST[id];
      expect(def.id).toBe(id);
      expect(def.source).toMatch(/^assets\/sounds\/.*\.wav$/);
      expect(def.url).toContain('.wav');
      expect(['normal', 'high', 'critical']).toContain(def.priority);
    }
  });
});

describe('audioEngine', () => {
  it('operates silently as no-op fallback when AudioContext is absent', async () => {
    const engine = createAudioEngine();
    expect(engine.isUnlocked()).toBe(false);
    expect(engine.isMuted()).toBe(false);

    // None of these should throw
    await engine.unlock();
    await engine.play('cannonFire1');
    await engine.startLoop('oceanAmbience');
    engine.stopLoop('oceanAmbience');
    engine.stopAllLoops();
    engine.checkThresholds(10, 100, 5);
    engine.resetThresholds();
    engine.onPause();
    engine.onResume();
    engine.handleSimulationEvents([{ step: 1, activeTimeMs: 16, type: 'ended', reason: 'player_destroyed', score: 0 }]);
    engine.destroy();
  });

  it('unlocks AudioContext on explicit gesture and ignores play before unlock', async () => {
    const mockCtx = createMockAudioContext();
    const engine = createAudioEngine({ context: mockCtx });

    expect(engine.isUnlocked()).toBe(false);
    // Play before unlock does nothing
    await engine.play('cannonFire1');
    expect(mockCtx.createBufferSource).not.toHaveBeenCalled();

    // Unlock resumes context
    await engine.unlock();
    expect(engine.isUnlocked()).toBe(true);
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it('controls master gain and reflects mute persistence', () => {
    const mockCtx = createMockAudioContext();
    const engine = createAudioEngine({ context: mockCtx, initialMuted: false });

    const masterGain = mockCtx._createdGainNodes[0];
    expect(masterGain?.gain.value).toBe(1);
    expect(engine.isMuted()).toBe(false);

    engine.setMuted(true);
    expect(masterGain?.gain.value).toBe(0);
    expect(engine.isMuted()).toBe(true);

    engine.setMuted(false);
    expect(masterGain?.gain.value).toBe(1);
    expect(engine.isMuted()).toBe(false);
  });

  it('limits transient voices to MAX_EFFECT_VOICES with voice stealing', async () => {
    const mockCtx = createMockAudioContext();
    // Mock global fetch to return a dummy arrayBuffer
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;

    try {
      const engine = createAudioEngine({ context: mockCtx });
      await engine.unlock();

      // Play 4 normal sounds
      await engine.play('cannonFire1');
      await engine.play('cannonFire2');
      await engine.play('cannonFire3');
      await engine.play('shipWoodHit1');
      expect(engine.getActiveVoiceCount()).toBe(MAX_EFFECT_VOICES);

      // Play a 5th sound - triggers voice stealing
      await engine.play('shipWoodHit2');
      expect(engine.getActiveVoiceCount()).toBe(MAX_EFFECT_VOICES);
      // The oldest voice was stopped
      expect(mockCtx._createdSources[0]?.stop).toHaveBeenCalled();

      // Higher priority voice steals a lower priority voice
      await engine.play('healthLow'); // critical priority
      expect(engine.getActiveVoiceCount()).toBe(4);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('triggers threshold sentinels exactly once on crossing edge', async () => {
    const mockCtx = createMockAudioContext();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;

    const flush = () => new Promise(r => setTimeout(r, 0));

    try {
      const engine = createAudioEngine({ context: mockCtx });
      await engine.unlock();

      // Healthy ship (>25%): no threshold
      engine.checkThresholds(30, 100, 30);
      await flush();
      expect(mockCtx.createBufferSource).not.toHaveBeenCalled();

      // Drops to 25%: fires healthLow
      engine.checkThresholds(25, 100, 30);
      await flush();
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(1);

      // Remains <= 25%: does NOT fire again
      engine.checkThresholds(20, 100, 30);
      engine.checkThresholds(10, 100, 25);
      await flush();
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(1);

      // Enters 10s remaining: fires timeWarning
      engine.checkThresholds(10, 100, 10);
      await flush();
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(2);

      // 9 seconds remaining: does NOT fire again
      engine.checkThresholds(10, 100, 9);
      await flush();
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(2);

      // Reset thresholds allows re-triggering for a new match
      engine.resetThresholds();
      engine.checkThresholds(20, 100, 8);
      await flush();
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(4); // both re-triggered
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('discards acoustic backlog on pause and resume without replay', async () => {
    const mockCtx = createMockAudioContext();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;

    try {
      const engine = createAudioEngine({ context: mockCtx });
      await engine.unlock();

      await engine.play('cannonFire1');
      await engine.startLoop('oceanAmbience');
      expect(engine.getActiveVoiceCount()).toBe(1);

      // Pause clears all transient voices and loops
      engine.onPause();
      expect(engine.getActiveVoiceCount()).toBe(0);

      // Resume discards backlog, does not replay old shots
      engine.onResume();
      expect(engine.getActiveVoiceCount()).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
