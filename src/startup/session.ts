import { sessionAssets } from '../render/sessionAssets';
import { sessionAudioData } from '../audio/audioData';
import { createStartupCoordinator } from './coordinator';
import { createImagePreparation } from './images';
import { STARTUP_RESOURCES } from './manifest';

const images = createImagePreparation();
function prepareTexture(url: string): Promise<void> {
  const lease = sessionAssets.acquire();
  return new Promise<void>((resolve, reject) => {
    let finished = false;
    let stop = () => {};
    const finish = () => { finished = true; stop(); lease.release(); resolve(); };
    stop = sessionAssets.subscribe(loaded => { if (loaded === url) finish(); });
    if (finished) stop();
    void lease.ready.catch(error => { stop(); lease.release(); reject(error); });
  });
}
export const startup = createStartupCoordinator(STARTUP_RESOURCES, resource => {
  if (resource.kind === 'texture') return prepareTexture(resource.url);
  if (resource.kind === 'audio') return sessionAudioData.load(resource.url);
  return images.prepare(resource.url);
});

if (import.meta.hot) import.meta.hot.dispose(() => startup.dispose());
