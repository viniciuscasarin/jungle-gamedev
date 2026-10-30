import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
  // Keep the per-step CPU budget independent of other test workers' CPU load.
  test: { environment: 'node', include: ['tests/**/*.test.ts'], fileParallelism: false },
});
