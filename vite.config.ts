import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const marketOverviewProxyTarget = env.VITE_MARKET_OVERVIEW_PROXY_TARGET;
  if (!marketOverviewProxyTarget) {
    throw new Error('Missing required env: VITE_MARKET_OVERVIEW_PROXY_TARGET');
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/tsetmc': {
          target: marketOverviewProxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/tsetmc/, '/tsetmc/api/v1'),
        },
      },
    },
  };
});
