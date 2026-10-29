import { expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../src/domain/config';
import { createLocalAdapter, LOCAL_KEYS } from '../src/storage/local';
import { optionsDraft, saveDraft, validateDraft } from '../src/ui/optionsDraft';

it.each([['60','1',60000,1000],['180','10',180000,10000],['90','2.5',90000,2500],['120','1.5',120000,1500]])('converts valid seconds %s/%s exactly', (session, spawn, ms, interval) => {
  const draft = { sessionDurationMs: session, enemySpawnIntervalMs: spawn };
  expect(validateDraft(draft)).toEqual({ options: { sessionDurationMs: ms, enemySpawnIntervalMs: interval }, errors: {} });
  expect(optionsDraft(validateDraft(draft).options)).toEqual(draft);
});
it.each(['',' ','NaN','Infinity','-Infinity','text','0x78','1e2','120s','120.','59','181','60.5','120.00000001'])('rejects invalid session text %j before calling writer', value => {
  const draft = { ...optionsDraft(), sessionDurationMs: value }, writer = vi.fn();
  expect(validateDraft(draft).errors.sessionDurationMs).toContain('60–180 seconds');
  expect(saveDraft(draft, writer)).toBe(false); expect(writer).not.toHaveBeenCalled();
});
it.each(['',' ','NaN','Infinity','1.1','0.5','10.5','1.5001','3s','1e0'])('rejects invalid spawn %j without rounding', value => {
  expect(validateDraft({ ...optionsDraft(), enemySpawnIntervalMs: value }).errors.enemySpawnIntervalMs).toContain('0.5');
});
it('preserves defaults and reports failure instead of successful confirmation', () => {
  expect(optionsDraft()).toEqual({ sessionDurationMs:'120', enemySpawnIntervalMs:'3' });
  const writer = vi.fn(() => false);
  expect(saveDraft(optionsDraft(), writer)).toBe(false); expect(writer).toHaveBeenCalledExactlyOnceWith(DEFAULT_CONFIG.options);
  expect(saveDraft(optionsDraft(), () => { throw new Error('denied'); })).toBe(false);
});
it('validates before writing and never replaces an earlier Save on denied writes', () => {
  const values = new Map<string,string>();
  const writer = vi.fn((key:string,value:string) => { values.set(key,value); });
  const local = createLocalAdapter(() => ({ getItem:key=>values.get(key)??null, setItem:writer }));
  expect(saveDraft({sessionDurationMs:'90',enemySpawnIntervalMs:'2.5'},local.saveOptions)).toBe(true);
  const before = values.get(LOCAL_KEYS.options);
  expect(() => local.saveOptions({sessionDurationMs:NaN,enemySpawnIntervalMs:3000})).toThrow(); expect(writer).toHaveBeenCalledTimes(1);
  const denied = createLocalAdapter(() => ({getItem:key=>values.get(key)??null,setItem(){throw new Error('quota');}}));
  expect(saveDraft(optionsDraft(), denied.saveOptions)).toBe(false);
  expect(values.get(LOCAL_KEYS.options)).toBe(before); expect(denied.readOptions().value).toEqual({sessionDurationMs:90000,enemySpawnIntervalMs:2500});
});
it.each(['{','null','{}','{"version":2,"data":{}}','{"version":1,"data":null}',...[
  {sessionDurationMs:'120000',enemySpawnIntervalMs:3000}, {sessionDurationMs:60001,enemySpawnIntervalMs:3000}, {sessionDurationMs:120000,enemySpawnIntervalMs:1100}, {sessionDurationMs:181000,enemySpawnIntervalMs:3000}, {sessionDurationMs:120000},
].map(data=>JSON.stringify({version:1,data}))])('recovers corrupt options %s without writing', raw => {
  const writer=vi.fn();const local=createLocalAdapter(()=>({getItem:()=>raw,setItem:writer}));
  expect(local.readOptions()).toEqual({notice:expect.stringContaining('Default settings')}); expect(writer).not.toHaveBeenCalled();
});
