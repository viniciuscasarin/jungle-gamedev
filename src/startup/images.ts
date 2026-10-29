import { withDeadline } from './deadline';

export function createImagePreparation(makeImage: () => HTMLImageElement = () => new Image()) {
  const images = new Map<string, HTMLImageElement>();
  const pending = new Map<string, Promise<void>>();
  return {
    prepare(url: string): Promise<void> {
      if (images.has(url)) return Promise.resolve();
      const existing = pending.get(url);
      if (existing) return existing;
      const image = makeImage();
      const work = new Promise<void>((resolve, reject) => {
        image.onload = () => {
          const decoding = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
          decoding.then(resolve, reject);
        };
        image.onerror = () => reject(new Error(`Image could not be prepared: ${url}`));
        image.src = url;
      });
      const ready = withDeadline(work, undefined, () => { image.src = ''; }).then(() => { images.set(url, image); });
      pending.set(url, ready);
      const cleanup = () => {
        image.onload = null; image.onerror = null;
        if (pending.get(url) === ready) pending.delete(url);
      };
      void ready.then(cleanup, cleanup);
      return ready;
    },
  };
}
