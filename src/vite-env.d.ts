/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MARKET_OVERVIEW_API_BASE_URL: string;
    readonly VITE_MARKET_OVERVIEW_REFRESH_MS: string;
    readonly VITE_LANDING_MARKET_REFRESH_MS: string;
    readonly VITE_LANDING_CODAL_REFRESH_MS: string;
    readonly VITE_MARKET_OVERVIEW_PROXY_TARGET: string;
    readonly VITE_CALM_SCROLL_DAMPING_FACTOR?: string;
    readonly VITE_INFINITE_SCROLL_PREFETCH_ITEMS_FROM_END?: string;
    readonly VITE_INFINITE_SCROLL_PREFETCH_RATIO?: string;
    readonly VITE_INFINITE_SCROLL_MIN_PREFETCH_PX?: string;
    readonly VITE_ADMIN_STATS_REFRESH_MS: string;
    readonly VITE_ADMIN_USERS_REFRESH_MS: string;
    readonly VITE_ADMIN_USER_DETAIL_REFRESH_MS: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
