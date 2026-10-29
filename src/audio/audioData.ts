import { withDeadline } from '../startup/deadline';

/** Transfers only: no AudioContext, decoding or playback before a user gesture. */
export function createAudioData(fetchData: typeof fetch = (...args) => fetch(...args)) {
  const data = new Map<string, ArrayBuffer | null>();
  const pending = new Map<string, Promise<ArrayBuffer | null>>();
  return {
    load(url: string): Promise<ArrayBuffer | null> {
      if (data.has(url)) return Promise.resolve(data.get(url)!);
      const existing = pending.get(url); if (existing) return existing;
      const controller = new AbortController();
      const work = (async () => {
        const response = await fetchData(url, { signal: controller.signal });
        if (response.ok === false) throw new Error('Sound transfer failed.');
        return response.arrayBuffer();
      })();
      const ready = withDeadline(work, undefined, () => controller.abort()).catch(() => null).then(bytes => {
        data.set(url, bytes); pending.delete(url); return bytes;
      });
      pending.set(url, ready); return ready;
    },
  };
}

export const sessionAudioData = createAudioData();
