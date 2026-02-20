import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const marketOverviewProxyTarget = env.VITE_MARKET_OVERVIEW_PROXY_TARGET;
  const codalProxyTarget = env.VITE_CODAL_PROXY_TARGET ?? marketOverviewProxyTarget;
  const authProxyTarget = env.VITE_AUTH_PROXY_TARGET ?? 'http://localhost:9003';
  if (!marketOverviewProxyTarget) {
    throw new Error('Missing required env: VITE_MARKET_OVERVIEW_PROXY_TARGET');
  }
  if (!codalProxyTarget) {
    throw new Error('Missing required env: VITE_CODAL_PROXY_TARGET');
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
        '/api/codal': {
          target: codalProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/codal/, '/codal/api/v1'),
        },
        '/api/auth': {
          target: authProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/auth/, '/api/v1/auth'),
        },
        '/api/v1/users': {
          target: authProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
