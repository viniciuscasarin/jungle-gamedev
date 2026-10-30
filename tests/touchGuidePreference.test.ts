import { expect, it, vi } from 'vitest';
import { createTouchGuidePreference, TOUCH_GUIDE_KEY } from '../src/ui/touchGuidePreference';

it('validates the session value and writes only its isolated versioned key', () => {
  for (const value of [null, '', 'false', '1', '{}', '{invalid', '"true"']) {
    expect(createTouchGuidePreference(() => ({ getItem: () => value, setItem: vi.fn() })).read()).toBe(false);
  }
  const values = new Map<string, string>([['other-key', 'unchanged']]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const preference = createTouchGuidePreference(() => storage);
  expect(preference.read()).toBe(false); preference.dismiss(); expect(preference.read()).toBe(true);
  expect(createTouchGuidePreference(() => storage).read()).toBe(true);
  expect([...values]).toEqual([['other-key', 'unchanged'], [TOUCH_GUIDE_KEY, 'true']]);
});
it('keeps shared memory through failing storage acquisition, reads and writes', () => {
  for (const storage of [() => { throw Error('getter'); }, () => ({ getItem: () => { throw Error('read'); }, setItem: () => { throw Error('write'); } })]) {
    const preference = createTouchGuidePreference(storage);
    expect(preference.read()).toBe(false); expect(() => preference.dismiss()).not.toThrow(); expect(preference.read()).toBe(true);
  }
});
