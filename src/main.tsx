import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './data/queryClient';
import { App } from './ui/App';
import { initMocks } from './mocks/init';
import { startup } from './startup/session';
import { StartupShell } from './ui/Startup';

async function bootstrap() {
  void startup.retry();
  const mocksReady = initMocks();

  const root = document.getElementById('root');
  if (!root) throw new Error('Application root is missing.');
  const application = createRoot(root, { onUncaughtError: showFatal });
  application.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <StartupShell><App /></StartupShell>
      </QueryClientProvider>
    </StrictMode>
  );
  // A BFCache visit keeps its session; a true exit releases owners before cache unload.
  const pageHide = (event: PageTransitionEvent) => { if (!event.persisted) application.unmount(); };
  window.addEventListener('pagehide', pageHide);
  if (import.meta.hot) import.meta.hot.dispose(() => { window.removeEventListener('pagehide', pageHide); application.unmount(); });
  await mocksReady;
  startup.markBootstrapReady();
}

function showFatal(error: unknown) {
  console.error('Fatal bootstrap failure:', error);
  document.getElementById('startup-cover')?.remove();
  const root = document.getElementById('root'); if (root) { root.inert = true; root.setAttribute('aria-hidden', 'true'); }
  const fatal = document.getElementById('startup-fatal');
  if (fatal) { fatal.hidden = false; fatal.querySelector('button')?.focus(); }
}
bootstrap().catch(showFatal);
