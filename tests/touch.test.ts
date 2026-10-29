import {expect, it} from 'vitest';
import {createInputBuffer} from '../src/input/desktop';
import {createTouchAdapter, joypadDirection} from '../src/input/touch';
import {createSimulation} from '../src/simulation/engine';
import {createMatchSetup, DEFAULT_CONFIG} from '../src/domain/config';
import {NEUTRAL_INPUT} from '../src/simulation/contracts';
import {healthBarGeometry} from '../src/render/healthBars';
import {hullIsValid} from '../src/simulation/collision';
import {createNavigationLoop} from '../src/render/navigationLoop';
const setup = createMatchSetup(DEFAULT_CONFIG, 1);
it('uses inclusive 15% CSS radius, fixed normalized magnitude, and rejects invalid geometry', () => {
  for (const x of [0, 14.9, 15]) expect(joypadDirection(x, 0, 100)).toBeUndefined();
  expect(joypadDirection(15.1, 0, 100)).toEqual({x: 1, y: 0});
  expect(joypadDirection(300, 400, 100)).toEqual({x: .6, y: .8});
  for (const [x,y,r] of [[NaN,0,100], [0,Infinity,100], [1,1,0], [1,1,-1]]) expect(joypadDirection(x!,y!,r!)).toBeUndefined();
});
it('composes keyboard, two IDs per weapon and one joypad owner without cross release', () => {
  const b = createInputBuffer(); b.down(false, 'KeyQ'); b.attack('front', 7, true); b.attack('front', 22, true);
  b.up('KeyQ'); b.attack('front', 7, false); b.attack('front', 99, false); expect(b.consume().fire.front).toBe(true);
  b.attack('front',22,false); expect(b.consume().fire.front).toBe(false);
  expect(b.joyStart(8)).toBe(true); expect(b.joyStart(99)).toBe(false);
  b.joyMove(8,{x:1,y:0}); b.joyEnd(99); expect(b.consume().movementRequested).toBe(true);
  b.joyMove(8,undefined); expect(b.consume()).toMatchObject({movementRequested:false,steering:{kind:'direction',x:1,y:0}});
  b.joyMove(8,{x:0,y:-1});b.joyEnd(8);expect(b.consume()).toMatchObject({movementRequested:false,steering:{kind:'direction',x:0,y:-1}});
  b.toggle();b.toggle();expect(b.consume().toggleAutoSailPressed).toBe(true);expect(b.consume().toggleAutoSailPressed).toBe(true);expect(b.consume().toggleAutoSailPressed).toBe(false);
  b.pulse('port');expect(b.consume().fire.port).toBe(true);expect(b.consume().fire.port).toBe(false);
  b.clear();b.clear();expect(b.consume()).toEqual(NEUTRAL_INPUT);
});
it('turns by a finite shortest arc and uses manual forward motion with R Off; release retains steering with R On', () => {
  const b = createInputBuffer(), sim = createSimulation(setup, {mode:'stationary-targets'});b.joyStart(3);b.joyMove(3,{x:1,y:0});
  const s = sim.step(b.consume());expect(s.autoSailEnabled).toBe(false);expect(s.player.headingRadians).toBeCloseTo(-Math.PI/2 + Math.PI/60);
  expect(Math.hypot(s.player.position.xUnits-480,s.player.position.yUnits-270)).toBeCloseTo(2.5);
  b.joyEnd(3);expect(sim.step(b.consume()).player.position).toEqual(s.player.position);
  b.toggle();sim.step(b.consume());for(let i=0;i<60;i++)sim.step(b.consume());
  expect(sim.inspect().autoSailEnabled).toBe(true);expect(sim.inspect().player.headingRadians).toBeCloseTo(0);
  for (const [x,y] of [[0,0], [NaN,1], [1,Infinity]]) {
    const a = createSimulation(setup); expect(a.step({...NEUTRAL_INPUT,steering:{kind:'direction',x:x!,y:y!}}).player.headingRadians).toBe(-Math.PI/2);
  }
  const tie = createSimulation(setup);expect(tie.step({...NEUTRAL_INPUT,steering:{kind:'direction',x:0,y:1}}).player.headingRadians).toBeCloseTo(-Math.PI/2+Math.PI/60);
});
it('neutralizes only auto-sail without a step, clock change, heading change or setup mutation', () => {
  const sim = createSimulation(setup);sim.step({...NEUTRAL_INPUT,toggleAutoSailPressed:true});const before=sim.inspect();
  sim.neutralizeAutoSail();expect(sim.inspect()).toEqual({...before,autoSailEnabled:false});sim.neutralizeAutoSail();expect(sim.inspect()).toEqual({...before,autoSailEnabled:false});
});
it('keeps manual direction trajectories inside all configured shores and world bounds',()=>{
  const sim=createSimulation(setup,{mode:'stationary-targets'});
  for(const [x,y] of [[-1,-1],[0,-1],[-1,0],[1,0],[1,1],[0,1]]) for(let i=0;i<500;i++) {
    const s=sim.step({...NEUTRAL_INPUT,movementRequested:true,steering:{kind:'direction',x:x!,y:y!}});expect(hullIsValid(s.player.position,DEFAULT_CONFIG)).toBe(true);expect(s.player.health).toBe(100);
  }
});
it('loop mode neutralization republishes without consuming a step or queuing another RAF',()=>{
  const b=createInputBuffer(), frames=new Map<number,(t:number)=>void>();let id=0,presents=0;
  const loop=createNavigationLoop(setup,b,{request:cb=>{frames.set(++id,cb);return id;},cancel:n=>{frames.delete(n);}},()=>{presents++;});
  const frame=(t:number)=>{const [n,cb]=[...frames][0]!;frames.delete(n);cb(t);};
  loop.mount();b.toggle();frame(0);frame(20);const before=loop.inspect(),count=presents;
  loop.neutralizeAutoSail();expect(loop.inspect()).toEqual({...before,autoSailEnabled:false});expect(presents).toBe(count+1);expect(frames.size).toBe(1);loop.destroy();
});
it('keeps screen-readable horizontal bars clamped to the visible world and health range', () => {
  const ship = createSimulation(setup).inspect().player;
  for (const scale of [.1,.3,1,2]) for(const health of [-20,50,200]) for(const point of [{xUnits:0,yUnits:0},{xUnits:960,yUnits:540}]) {
    const r=healthBarGeometry({...ship,health,position:point,headingRadians:2},scale,960,540);
    expect(r.rotation).toBe(0);expect(r.width*scale).toBeGreaterThanOrEqual(24);expect(r.height*scale).toBeGreaterThanOrEqual(4);
    expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(960);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(540);expect(r.fraction).toBe(Math.max(0,Math.min(1,health/100)));
  }
});
it('capture adapter isolates IDs, retains drag out, discards cancelled R and confirms valid up only once', () => {
  const b=createInputBuffer();let mode='desktop';
  const adapter=createTouchAdapter(b,()=>true,m=>{mode=m;});
  const capture=new Set<number>();
  const element={getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:100,width:100,height:100}),setPointerCapture:(id:number)=>capture.add(id),hasPointerCapture:(id:number)=>capture.has(id),releasePointerCapture:(id:number)=>capture.delete(id)} as unknown as HTMLElement;
  const e=(id:number,x=50,y=50)=>({pointerId:id,pointerType:'touch',clientX:x,clientY:y,preventDefault(){}} as PointerEvent);
  adapter.down(e(1,90),element,'joypad');adapter.down(e(2),element,'front');adapter.down(e(3),element,'front');expect(mode).toBe('touch');
  capture.add(4);adapter.down({...e(4),target:element} as unknown as PointerEvent,element,'joypad');expect(capture.has(4)).toBe(false);adapter.up(e(4));expect(b.consume().movementRequested).toBe(true);
  adapter.move(e(2,500,500));adapter.up(e(2,500,500));expect(b.consume().fire.front).toBe(true);expect(capture.has(1)).toBe(true);
  adapter.cancel(e(3));adapter.cancel(e(3));expect(b.consume().fire.front).toBe(false);
  adapter.down(e(5),element,'R');adapter.cancel(e(5));adapter.up(e(5));expect(b.consume().toggleAutoSailPressed).toBe(false);
  adapter.down(e(6),element,'R');adapter.up(e(6,200));expect(b.consume().toggleAutoSailPressed).toBe(false);
  adapter.down(e(7),element,'R');adapter.up(e(7));adapter.cancel(e(7));expect(b.consume().toggleAutoSailPressed).toBe(true);expect(b.consume().toggleAutoSailPressed).toBe(false);
  adapter.clear();adapter.clear();expect(capture.size).toBe(0);expect(b.consume()).toEqual(NEUTRAL_INPUT);
});
