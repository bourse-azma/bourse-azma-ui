/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MARKET_OVERVIEW_API_BASE_URL: string;
  readonly VITE_MARKET_OVERVIEW_REFRESH_MS: string;
  readonly VITE_MARKET_OVERVIEW_PROXY_TARGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
