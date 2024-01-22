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
    name: 'NMUI',
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    exclude: ['./e2e/**', './node_modules/**'],
  },
});
