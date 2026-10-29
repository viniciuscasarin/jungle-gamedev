import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './data/queryClient';
import { App } from './ui/App';
import { initMocks } from './mocks/init';

async function bootstrap() {
  await initMocks();

  const root = document.getElementById('root');
  if (!root) throw new Error('Application root is missing.');
  const application = createRoot(root);
  application.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
  // A BFCache visit keeps its session; a true exit releases owners before cache unload.
  const pageHide = (event: PageTransitionEvent) => { if (!event.persisted) application.unmount(); };
  window.addEventListener('pagehide', pageHide);
  if (import.meta.hot) import.meta.hot.dispose(() => { window.removeEventListener('pagehide', pageHide); application.unmount(); });
}

bootstrap().catch(error => {
  console.error('Fatal bootstrap failure:', error);
});
