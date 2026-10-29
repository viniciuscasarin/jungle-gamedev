export async function initMocks(options?: { timeoutMs?: number }): Promise<boolean> {
  // Only register service worker in browser environments where ServiceWorker is supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const timeoutMs = options?.timeoutMs ?? 1500;

  try {
    const { worker } = await import('./browser');

    const startPromise = worker.start({
      onUnhandledFrame: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`MSW initialization timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    await Promise.race([startPromise, timeoutPromise]);
    return true;
  } catch (error) {
    // Resilience: Service Worker failure must never block gameplay or app launch
    console.warn('[MSW] Mock Service Worker could not be started; continuing without network mock.', error);
    return false;
  }
}
