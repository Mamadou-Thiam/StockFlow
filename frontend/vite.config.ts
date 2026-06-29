import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const isDev = mode === 'development';
  const apiUrl = env.VITE_API_URL || '/api';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: isDev
        ? {
            '/api': {
              target: 'http://127.0.0.1:5000',
              changeOrigin: true,
            },
          }
        : undefined,
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV || mode),
    },
  };
});
