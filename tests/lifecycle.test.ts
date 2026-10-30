import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, createGameConfig, createMatchSetup } from '../src/domain/config';
import type { GameConfig, ProceduralGameConfig } from '../src/domain/config';
import { configurationKey, validateConfiguration, validateOptions } from '../src/domain/validation';
import { validateCompletedResult } from '../src/domain/result';
import type { CompletedMatchResult } from '../src/domain/result';
import { createSessionCompletion, prepareSession } from '../src/domain/session';
import { createLocalAdapter, LOCAL_KEYS } from '../src/storage/local';
import { preparePlay } from '../src/ui/sessionBoundary';
import { createSimulation } from '../src/simulation/engine';
import { NEUTRAL_INPUT } from '../src/simulation/contracts';
import type { ProjectileSnapshot, SimulationEvent } from '../src/simulation/contracts';
import { createNavigationLoop } from '../src/render/navigationLoop';
import { createInputBuffer } from '../src/input/desktop';
import legacyResult from './fixtures/finite-result-v2.json';

it('recovers literal finite Last Result without rewriting or clearing storage', () => {
  const raw = JSON.stringify({ version: 1, data: legacyResult });
  const write = vi.fn();
  const local = createLocalAdapter(() => ({ getItem: () => raw, setItem: write }));
  expect(local.readResult().value).toEqual(legacyResult);
  expect(write).not.toHaveBeenCalled();
});

const config = createGameConfig({ sessionDurationMs: 60000, enemySpawnIntervalMs: 1000 });
const setup = createMatchSetup(config, 123);
const fixture = (c = config): CompletedMatchResult => ({ matchId: 'run-1', playerId: 'captain-1', playerName: 'Captain-Test', completedAt: '2026-10-28T03:00:00.000Z', score: 0, activeDurationMs: c.options.sessionDurationMs, endReason: 'time_expired', configuration: c, configurationKey: configurationKey(c), seed: 123 });
const lethal: ProjectileSnapshot = { id: 'lethal', ownerId: 'enemy', faction: 'enemy', damage: 100, speedUnitsPerSecond: 260, radiusUnits: 5, position: { xUnits: 480, yUnits: 270 }, headingRadians: 0, remainingLifetimeMs: 1000 };
function reorder(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reorder);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reorder(v)]));
  return value;
}

describe('captured preparation and canonical gameplay', () => {
  it('deeply captures sources without freezing callers and keeps all metadata explicit', () => {
    const source = JSON.parse(JSON.stringify(config)) as GameConfig;
    const identity = { playerId: 'p', playerName: 'Captain' };
    const preparation = prepareSession('new-run', identity, source, 7);
    identity.playerName = 'Changed';
    Reflect.set(source.world.playerStart, 'xUnits', 33);
    expect(preparation.identity.playerName).toBe('Captain');
    expect(preparation.setup.configuration.world.playerStart.xUnits).toBe(480);
    expect(Object.isFrozen(('catalog' in preparation.setup.configuration.world ? preparation.setup.configuration.world.catalog[0]!.solidOutline : preparation.setup.configuration.world.islands[0]!.solidOutline))).toBe(true);
    expect('window' in globalThis).toBe(false);
  });
  it('ignores property order and external metadata; preserves array order', () => {
    expect(configurationKey(reorder(config) as GameConfig)).toBe(configurationKey(config));
    expect(configurationKey(prepareSession('different', {playerId:'x', playerName:'Y'}, config, 999).setup.configuration)).toBe(configurationKey(config));
    expect(configurationKey({...config, spawn:{...config.spawn, archetypeSequence:['shooter','chaser']}})).not.toBe(configurationKey(config));
  });
  it.each(Object.keys(DEFAULT_CONFIG))('includes every gameplay family %s in the key', family => {
    const source = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
    function mutate(value: unknown): unknown {
      if (typeof value === 'string') return `${value}-changed`;
      if (typeof value === 'number') return value + 1;
      if (value && typeof value === 'object') { const item = value as Record<string, unknown>; const key = Object.keys(item)[0]!; item[key] = mutate(item[key]); }
      return value;
    }
    source[family] = mutate(source[family]);
    expect(configurationKey(source as unknown as GameConfig)).not.toBe(configurationKey(config));
  });
  it('reconstructs current settings at each Play, prepares diagnostic configuration before capture and injects new IDs/seeds', () => {
    const id = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('replay'), seed = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(11);
    const identity = {playerId:'p',playerName:'Captain'};
    const first = preparePlay(config.options, identity, new URLSearchParams('combatScenario=island'), {id,seed});
    const replay = preparePlay({...config.options,sessionDurationMs:180000}, identity, new URLSearchParams('configScenario=custom'), {id,seed});
    expect(first.preparation.setup.configuration.world.playerStart.xUnits).toBe(350);
    expect(replay.preparation).toMatchObject({matchId:'replay',setup:{seed:11,configuration:{options:{sessionDurationMs:180000},world:{kind:'procedural',playerStart:{xUnits:600}},ships:{player:{hullRadiusUnits:22}}}}});
    expect(first.preparation.setup.configuration.options.sessionDurationMs).toBe(60000);
  });
});

describe('unknown persisted data', () => {
  it('round trips historical tuning and geometry without replacing them with defaults', () => {
    const historical: GameConfig = {...config,balanceVersion:'historical-v9',weapons:{...config.weapons,front:{...config.weapons.front,damage:23}},world:{...config.world,playerStart:{...config.world.playerStart,xUnits:500}}};
    const result = validateCompletedResult(JSON.parse(JSON.stringify(fixture(historical))));
    expect(result.configuration.weapons.front.damage).toBe(23); expect(result.configuration.world.playerStart.xUnits).toBe(500);
    expect(Object.isFrozen(result.configuration.world.playerStart)).toBe(true);
  });
  it('rejects every missing or wrongly typed required leaf in every family', () => {
    const paths: string[][] = [];
    function leaves(value: unknown, path: string[] = []) {
      if (Array.isArray(value)) { if (value.length) leaves(value[0], [...path,'0']); }
      else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) leaves(child,[...path,key]);
      else paths.push(path);
    }
    leaves(config);
    for (const path of paths) for (const mode of ['missing','wrong']) {
      const copy = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
      let parent = copy;
      for (const key of path.slice(0,-1)) parent = parent[key] as Record<string,unknown>;
      const key = path[path.length-1]!;
      if (mode === 'missing') delete parent[key]; else parent[key] = {invalid:true};
      expect(() => validateConfiguration(copy), `${path.join('.')} ${mode}`).toThrow(RangeError);
    }
    expect(paths.length).toBeGreaterThan(87);
  });
  it.each([
    (c: ProceduralGameConfig) => ({...c, world:{...c.world, widthUnits:Infinity}}),
    (c: ProceduralGameConfig) => ({...c, world:{...c.world, playerStart:{...c.world.playerStart,xUnits:0}}}),
    (c: ProceduralGameConfig) => ({...c, spawn:{...c.spawn,archetypeSequence:['boss']}}),
    (c: ProceduralGameConfig) => ({...c, world:{...c.world,catalog:[{...c.world.catalog[0]!,solidOutline:[{xUnits:0,yUnits:0},{xUnits:1,yUnits:0}]}]}}),
    (c: ProceduralGameConfig) => ({...c, world:{...c.world,catalog:[{...c.world.catalog[0]!,widthUnits:900}]}}),
    (c: ProceduralGameConfig) => ({...c, navigation:{...c.navigation,endpointConnections:1.5}}),
    (c: ProceduralGameConfig) => ({...c, controls:{...c.controls,joypadDeadZoneNormalized:1}}),
    (c: ProceduralGameConfig) => ({...c, options:{...c.options,sessionDurationMs:59000}}),
    (c: ProceduralGameConfig) => ({...c, rules:{...c.rules,friendlyFire:true}}),
  ])('rejects nonfinite, invalid geometry, enums and limits', change => { expect(() => validateConfiguration(change(config))).toThrow(RangeError); });
  it.each(['matchId','playerId','playerName','completedAt','score','activeDurationMs','endReason','configuration','configurationKey','seed'])('rejects missing result field %s', key => {
    const result = {...fixture()} as Record<string,unknown>; delete result[key]; expect(() => validateCompletedResult(result)).toThrow(RangeError);
  });
  it.each([{matchId:''},{playerName:' '},{seed:4294967296},{seed:'0'},{score:0.2},{score:Number.MAX_SAFE_INTEGER+1},{activeDurationMs:60001},{activeDurationMs:59999},{endReason:'abandoned'},{completedAt:'2026-02-29T00:00:00Z'},{configurationKey:'other'}])('rejects invalid metadata %j', change => { expect(() => validateCompletedResult({...fixture(),...change})).toThrow(RangeError); });
  it('rejects unvalidated options and accepts all documented limits', () => {
    for (const value of [null,{}, {sessionDurationMs:'60000',enemySpawnIntervalMs:1000},{sessionDurationMs:60000,enemySpawnIntervalMs:1001}]) expect(()=>validateOptions(value)).toThrow();
    expect(validateOptions({sessionDurationMs:180000,enemySpawnIntervalMs:10000})).toEqual({sessionDurationMs:180000,enemySpawnIntervalMs:10000});
  });
});

describe('local storage and one-shot completion', () => {
  function memory() { const values = new Map<string,string>(); return { values, store:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}} }; }
  it('round trips only completed results, settings and identity in versioned envelopes', () => {
    const m = memory(), local = createLocalAdapter(()=>m.store);
    expect(local.readResult()).toEqual({}); expect(local.saveResult(fixture())).toBe(true);
    expect(local.readResult().value).toEqual(fixture());
    expect(local.saveOptions(config.options)).toBe(true); expect(local.readOptions().value).toEqual(config.options);
    expect(local.saveIdentity({playerId:'p',playerName:'Captain'})).toBe(true); expect(local.readIdentity().value?.playerId).toBe('p');
    expect([...m.values.keys()].sort()).toEqual(Object.values(LOCAL_KEYS).sort());
  });
  it('defensively handles corrupt JSON, envelope versions and invalid nested data', () => {
    const m=memory(), local=createLocalAdapter(()=>m.store);
    for(const raw of ['{','null','{}',JSON.stringify({version:9,data:fixture()}),JSON.stringify({version:1,data:{...fixture(),configuration:{options:config.options}}})]) {
      m.values.set(LOCAL_KEYS.result,raw); expect(local.readResult()).toEqual({notice:expect.any(String)});
    }
    m.values.set(LOCAL_KEYS.options,'bad'); expect(local.readOptions().notice).toContain('Default settings');
    m.values.set(LOCAL_KEYS.identity,JSON.stringify({version:1,data:{playerId:''}})); expect(local.readIdentity().value).toBeUndefined();
  });
  it('handles denied getter/read/write and quota without destroying a previously saved result', () => {
    const denied=createLocalAdapter(()=>{throw new Error('denied');});
    expect(denied.readResult().notice).toBeTruthy(); expect(denied.readOptions().value).toBeUndefined(); expect(denied.saveResult(fixture())).toBe(false);
    const m=memory(), local=createLocalAdapter(()=>m.store); local.saveResult(fixture()); const before=m.values.get(LOCAL_KEYS.result);
    const quota=createLocalAdapter(()=>({...m.store,setItem(){throw new Error('quota');}}));
    expect(quota.saveResult({...fixture(),matchId:'second'})).toBe(false); expect(m.values.get(LOCAL_KEYS.result)).toBe(before); expect(quota.readResult().value?.matchId).toBe('run-1');
  });
  it('takes the supplied date once, saves once, ignores duplicates and stale completion after abandonment', () => {
    const preparation=prepareSession('run', {playerId:'p',playerName:'Captain'},config,123), utc=vi.fn(()=>fixture().completedAt), save=vi.fn(()=>false);
    const completion=createSessionCompletion(preparation,utc,save), event: EndEvent={type:'ended',step:3600,activeTimeMs:60000,score:0,reason:'time_expired'};
    const first=completion.complete(event)!; expect(first.saved).toBe(false); expect(completion.complete(event)).toBe(first); expect(utc).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1);
    completion.dispose(); expect(completion.complete(event)).toBeUndefined();
    const abandoned=createSessionCompletion(preparation,utc,save); abandoned.dispose(); expect(abandoned.complete(event)).toBeUndefined(); expect(save).toHaveBeenCalledTimes(1);
  });
});
type EndEvent = Extract<SimulationEvent,{type:'ended'}>;

describe('authoritative terminal boundary', () => {
  it('expires exactly at valid 60s with zero score, emits ended last/once and stays immutable through all commands', () => {
    const sim=createSimulation(setup,{mode:'stationary-targets'});
    for(let i=0;i<3599;i++)sim.step(NEUTRAL_INPUT);
    expect(sim.inspect().state).toBe('playing'); expect(sim.inspect().activeTimeMs).toBeLessThan(60000);
    const end=sim.step({...NEUTRAL_INPUT,fire:{front:true,port:true,starboard:true},toggleAutoSailPressed:true}), events=sim.events();
    expect(end).toMatchObject({state:'completed',step:3600,activeTimeMs:60000,score:0,autoSailEnabled:false,projectiles:[],reservations:[]});
    expect(events).toEqual([{type:'ended',reason:'time_expired',score:0,step:3600,activeTimeMs:60000}]);
    for(let i=0;i<10;i++){sim.freeze();sim.resume();expect(sim.step(NEUTRAL_INPUT)).toBe(end);expect(sim.events()).toEqual([]);}
    expect(events).toHaveLength(1); expect(Object.isFrozen(events[0])).toBe(true);
  });
  it('gives real lethal contact precedence over time at exactly the final step', () => {
    const c={...config,world:{...config.world,playerStart:{...config.world.playerStart,headingRadians:Math.PI/2}},ships:{...config.ships,player:{...config.ships.player,maxHealth:25}}};
    const sim=createSimulation(createMatchSetup(c,0),{mode:'stationary-targets',enemies:[{id:'contact',archetype:'chaser',position:{xUnits:480,yUnits:305.9},headingRadians:0,health:40,maxHealth:40}]});
    for(let i=0;i<3599;i++)sim.step(NEUTRAL_INPUT);
    expect(sim.inspect().player.health).toBe(25);
    const end=sim.step({...NEUTRAL_INPUT,toggleAutoSailPressed:true,fire:{front:true,port:true,starboard:true}});
    expect(end).toMatchObject({state:'completed',activeTimeMs:60000,player:{health:0},score:0,projectiles:[]});
    expect(sim.events().map(e=>e.type)).toEqual(['damage','destruction','damage','destruction','ended']);
    expect(sim.events().at(-1)).toMatchObject({reason:'player_destroyed'});
  });
  it('resolves damage but never emits new player/shooter attacks or director opportunities after a lethal existing ball', () => {
    const sim=createSimulation(setup,{projectiles:[lethal],enemies:[{id:'shooter',archetype:'shooter',position:{xUnits:480,yUnits:200},headingRadians:Math.PI/2,health:60,maxHealth:60}]});
    expect(sim.step({...NEUTRAL_INPUT,fire:{front:true,port:true,starboard:true}})).toMatchObject({state:'completed',step:1,projectiles:[],reservations:[],cooldownsMs:{front:0,port:0,starboard:0}});
    expect(sim.events().at(-1)).toMatchObject({type:'ended',reason:'player_destroyed'});
  });
  it('new engines reset RNG, IDs, director, cooldowns and all initial state reproducibly', () => {
    const a=createSimulation(setup), b=createSimulation(setup);
    for(let i=0;i<300;i++){const input={...NEUTRAL_INPUT,fire:{front:true,port:true,starboard:true}};expect(a.step(input)).toEqual(b.step(input));}
    a.freeze(); const fresh=createSimulation(setup);expect(fresh.inspect()).toEqual(createSimulation(setup).inspect());
    for(let i=0;i<300;i++)fresh.step({...NEUTRAL_INPUT,fire:{front:true,port:true,starboard:true}});
    expect(fresh.inspect()).toEqual(b.inspect());
  });
});

describe('pause edges and loop delivery', () => {
  it('buffers Escape/P once per physical edge, ignores duplicate and repeat, and clears every transient input', () => {
    for(const key of ['Escape','KeyP']) {
      const buffer=createInputBuffer();buffer.down(false,key);buffer.down(false,key);buffer.down(true,key);
      expect(buffer.consume().pausePressed).toBe(true);expect(buffer.consume().pausePressed).toBe(false);
      buffer.up(key);buffer.down(false,key);expect(buffer.consume().pausePressed).toBe(true);
      for(const attack of ['KeyQ','KeyW','KeyE','KeyR'])buffer.down(false,attack);buffer.point({xUnits:1,yUnits:2});buffer.clear();
      expect(buffer.consume()).toEqual(NEUTRAL_INPUT);
    }
  });
  it('halts a multistep frame after the terminal first step without more input, RAF or duplicated delivery', () => {
    const callbacks=new Map<number,(t:number)=>void>();let id=0;
    const consume=vi.fn(()=>NEUTRAL_INPUT), clear=vi.fn(), delivered: SimulationEvent[][]=[];
    const loop=createNavigationLoop(setup,{consume,clear},{request:cb=>{callbacks.set(++id,cb);return id;},cancel:i=>{callbacks.delete(i);}},()=>{}, {projectiles:[lethal]}, events=>delivered.push([...events]));
    const frame=(t:number)=>{const [key,cb]=[...callbacks][0]!;callbacks.delete(key);cb(t);return cb;};
    loop.mount();frame(0);const late=frame(80);const terminal=loop.inspect();
    expect(terminal.step).toBe(1);expect(consume).toHaveBeenCalledTimes(1);expect(delivered.flat().filter(e=>e.type==='ended')).toHaveLength(1);expect(callbacks.size).toBe(0);
    late(90000);loop.freeze();loop.resume();loop.mount();expect(loop.inspect()).toBe(terminal);expect(callbacks.size).toBe(0);expect(consume).toHaveBeenCalledTimes(1);loop.destroy();
  });
  it('pauses before another active step, then resumes with no catch-up or retained actions', () => {
    const buffer=createInputBuffer(), callbacks=new Map<number,(t:number)=>void>();let id=0;
    const loop=createNavigationLoop(setup,buffer,{request:cb=>{callbacks.set(++id,cb);return id;},cancel:i=>{callbacks.delete(i);}},()=>{});
    const frame=(t:number)=>{const [key,cb]=[...callbacks][0]!;callbacks.delete(key);cb(t);};
    loop.mount();frame(0);buffer.down(false,'KeyP');buffer.down(false,'KeyQ');buffer.down(false,'KeyR');frame(80);
    const paused=loop.inspect();expect(paused).toMatchObject({step:0,state:'paused',projectiles:[],autoSailEnabled:false});expect(callbacks.size).toBe(0);expect(buffer.consume()).toEqual(NEUTRAL_INPUT);
    buffer.down(false,'KeyQ');loop.resume();frame(100000);expect(loop.inspect().step).toBe(0);frame(100020);expect(loop.inspect()).toMatchObject({step:1,projectiles:[],autoSailEnabled:false});loop.destroy();
  });
  it('delivers events from every step independently of presentation', () => {
    const callbacks=new Map<number,(t:number)=>void>();let id=0;const steps:number[]=[];
    const balls=[{...lethal,id:'first',damage:10},{...lethal,id:'later',damage:10,position:{xUnits:440,yUnits:270},speedUnitsPerSecond:600}];
    const loop=createNavigationLoop(setup,{consume:()=>NEUTRAL_INPUT,clear(){}},{request:cb=>{callbacks.set(++id,cb);return id;},cancel:i=>{callbacks.delete(i);}},()=>{}, {mode:'stationary-targets',projectiles:balls},events=>steps.push(...events.filter(e=>e.type==='damage').map(e=>e.step)));
    loop.mount();for(const time of [0,80]){const [key,cb]=[...callbacks][0]!;callbacks.delete(key);cb(time);}
    expect(steps).toEqual([1,2]);loop.destroy();
  });
});
