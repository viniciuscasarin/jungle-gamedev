import { describe, expect, it } from 'vitest';
import { fitViewport, followCamera, cameraBounds, screenToWorld, worldToScreen } from '../src/render/viewport';
import { snapshotConfiguration } from '../src/domain/config';
import { HISTORICAL_FINITE_CONFIG as DEFAULT_CONFIG } from '../src/domain/historicalFiniteConfig';

it.each([[1280, 900], [844, 390], [568, 320], [320, 568]])('fills %i/%i around signed camera positions with reversible CSS transforms', (width, height) => {
  const player = { x: -1580, y: 2670 }, insets = { left: 24, right: 28, top: 90, bottom: 116 };
  const v = followCamera(width, height, player, insets);
  expect(v.renderable).toBe(true); if (!v.renderable) return;
  expect(v.scale).toBe(Math.max(width / 960, height / 540));
  expect(worldToScreen(player, v).x).toBeCloseTo(24 + (width - 52) / 2, 8);
  expect(worldToScreen(player, v).y).toBeCloseTo(90 + (height - 206) / 2, 8);
  for (const p of [player, { x: -9000, y: -7000 }, { x: 0, y: 0 }]) {
    const back = screenToWorld(worldToScreen(p, v), v);
    expect(back.x).toBeCloseTo(p.x, 8); expect(back.y).toBeCloseTo(p.y, 8);
  }
  const bounds = cameraBounds(width, height, v);
  expect(worldToScreen({ x: bounds.minX, y: bounds.minY }, v).x).toBeCloseTo(0, 8);
  expect(worldToScreen({ x: bounds.maxX, y: bounds.maxY }, v).y).toBeCloseTo(height, 8);
  expect(followCamera(0, height, player)).toEqual({ renderable: false });
  expect(followCamera(width, height, player, { ...insets, bottom: height })).toEqual({ renderable: false });
});

describe('CSS viewport transforms', () => {
  it.each([[1280,900], [320,568], [390,844], [844,390], [960,676]])('fits and roundtrips at %i×%i', (width,height) => {
    const v = fitViewport(width,height,960,540);
    expect(v.renderable).toBe(true); if (!v.renderable) return;
    expect(v.offsetX).toBeGreaterThanOrEqual(0); expect(v.offsetY).toBeGreaterThanOrEqual(48);
    const bottom = worldToScreen({x:960,y:540},v);
    expect(bottom.x).toBeLessThanOrEqual(width+1e-8); expect(bottom.y).toBeLessThanOrEqual(height-88+1e-8);
    for(const p of [{x:0,y:0},{x:960,y:0},{x:0,y:540},{x:960,y:540},{x:480,y:270},{x:-17,y:900}]) {
      const back = screenToWorld(worldToScreen(p,v),v);
      expect(Math.abs(back.x-p.x)).toBeLessThanOrEqual(1e-8); expect(Math.abs(back.y-p.y)).toBeLessThanOrEqual(1e-8);
    }
    expect(worldToScreen({x:480,y:270},v)).toEqual({x:width/2,y:48+(height-136)/2});
  });
  it('accounts for asymmetric safe areas and leaves letterbox invertible', () => {
    const v=fitViewport(1000,800,960,540,{left:30,right:10,top:58,bottom:98});
    expect(v).toMatchObject({renderable:true,scale:1,offsetX:30,offsetY:110});
    if(v.renderable) expect(screenToWorld({x:0,y:0},v)).toEqual({x:-30,y:-110});
  });
  it.each([[0,0],[0,600],[600,136],[NaN,600],[-1,600],[600,Infinity]])('rejects nonrenderable %s/%s', (w,h) => {
    expect(fitViewport(w,h,960,540)).toEqual({renderable:false});
  });

});
it('keeps the sand outline finite, convex, nonselfintersecting, bounded and detached in snapshots', () => {
  const c=DEFAULT_CONFIG;
  for(const i of c.world.islands) {
    const p=i.solidOutline; expect(p.length).toBeGreaterThan(8);
    let area=0;
    for(let n=0;n<p.length;n++) {
      const a=p[n]!,b=p[(n+1)%p.length]!,d=p[(n+2)%p.length]!;
      expect(Number.isFinite(a.xUnits+a.yUnits)).toBe(true);
      expect(a.xUnits).toBeGreaterThanOrEqual(0);expect(a.yUnits).toBeGreaterThanOrEqual(0);
      expect(a.xUnits).toBeLessThanOrEqual(i.widthUnits);expect(a.yUnits).toBeLessThanOrEqual(i.heightUnits);
      expect(i.origin.xUnits+a.xUnits).toBeLessThan(c.world.widthUnits);expect(i.origin.yUnits+a.yUnits).toBeLessThan(c.world.heightUnits);
      expect((b.xUnits-a.xUnits)*(d.yUnits-b.yUnits)-(b.yUnits-a.yUnits)*(d.xUnits-b.xUnits)).toBeGreaterThanOrEqual(0);
      area+=a.xUnits*b.yUnits-b.xUnits*a.yUnits;
      expect(Object.isFrozen(a)).toBe(true);
    }
    const turn=(a:typeof p[number],b:typeof p[number],d:typeof p[number])=>(b.xUnits-a.xUnits)*(d.yUnits-a.yUnits)-(b.yUnits-a.yUnits)*(d.xUnits-a.xUnits);
    for(let a=0;a<p.length;a++)for(let b=a+2;b<p.length;b++) {
      if(a===0 && b===p.length-1)continue;
      const p1=p[a]!,p2=p[(a+1)%p.length]!,q1=p[b]!,q2=p[(b+1)%p.length]!;
      const intersects=turn(p1,p2,q1)*turn(p1,p2,q2)<0 && turn(q1,q2,p1)*turn(q1,q2,p2)<0;
      expect(intersects).toBe(false);
    }
    expect(area/2).toBeGreaterThan(160*120*.8);expect(area/2).toBeLessThan(160*120);
    expect(c.world.playerStart.xUnits<i.origin.xUnits || c.world.playerStart.xUnits>i.origin.xUnits+i.widthUnits).toBe(true);
    const snapshot=snapshotConfiguration(c);
    expect(snapshot.world.islands[0]!.solidOutline).not.toBe(c.world.islands[0]!.solidOutline);
    expect(Object.isFrozen(snapshot.world.islands[0]!.solidOutline)).toBe(true);
  }
});
