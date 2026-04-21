import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  /** Only proxy when the Express API is running; otherwise Vite logs ECONNREFUSED for every /api call. */
  const apiProxy =
    env.ENABLE_API_PROXY === 'true'
      ? {
          '/api': {
            target: `http://127.0.0.1:${env.API_PORT || '8787'}`,
            changeOrigin: true,
          },
        }
      : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      ...(apiProxy ? { proxy: apiProxy } : {}),
    },
    preview: {
      ...(apiProxy ? { proxy: apiProxy } : {}),
    },
  };
});
