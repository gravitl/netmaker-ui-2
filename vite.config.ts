/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const assetBasePath = '###ASSET_BASE_PATH###';

// https://vitejs.dev/config/
export default defineConfig({
  base: assetBasePath,
  plugins: [react()],
  build: {
    sourcemap: true,
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': `${__dirname}/src`,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
