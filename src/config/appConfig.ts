const getRequiredEnv = (key: 'VITE_MARKET_OVERVIEW_API_BASE_URL' | 'VITE_MARKET_OVERVIEW_REFRESH_MS') => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

const getOptionalEnv = (key: string, fallback: string) => {
  const value = import.meta.env[key];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return fallback;
};

const parsePositiveInt = (raw: string, key: string) => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid env value for ${key}: ${raw}`);
  }
  return Math.floor(parsed);
};

export const appConfig = Object.freeze({
  marketOverviewApiBaseUrl: getRequiredEnv('VITE_MARKET_OVERVIEW_API_BASE_URL'),
  marketOverviewRefreshMs: parsePositiveInt(
    getRequiredEnv('VITE_MARKET_OVERVIEW_REFRESH_MS'),
    'VITE_MARKET_OVERVIEW_REFRESH_MS'
  ),
  codalNoticesApiBaseUrl: getOptionalEnv('VITE_CODAL_NOTICES_API_BASE_URL', '/api/codal/codal/notices'),
  codalNoticesRefreshMs: parsePositiveInt(
    getOptionalEnv('VITE_CODAL_NOTICES_REFRESH_MS', '15000'),
    'VITE_CODAL_NOTICES_REFRESH_MS'
  ),
  authApiBaseUrl: getOptionalEnv('VITE_AUTH_API_BASE_URL', '/api/auth'),
});
