type RequiredEnvKey =
    | 'VITE_MARKET_OVERVIEW_API_BASE_URL'
    | 'VITE_MARKET_OVERVIEW_API_PATH'
    | 'VITE_TSETMC_API_BASE_URL'
    | 'VITE_TSETMC_CLOSING_PRICE_API_PATH'
    | 'VITE_TSETMC_INSTRUMENT_INFO_API_PATH'
    | 'VITE_TSETMC_BEST_LIMITS_API_PATH'
    | 'VITE_TSETMC_CLIENT_TYPE_API_PATH'
    | 'VITE_TSETMC_CODAL_NOTICES_API_PATH'
    | 'VITE_FIPIRAN_API_BASE_URL'
    | 'VITE_FIPIRAN_SNAPSHOT_API_PATH'
    | 'VITE_FIPIRAN_FUNDS_API_PATH'
    | 'VITE_FIPIRAN_FUND_DETAILS_API_PATH'
    | 'VITE_SYMBOL_SEARCH_API_BASE_URL'
    | 'VITE_SYMBOL_SEARCH_API_PATH'
    | 'VITE_CODAL_API_BASE_URL'
    | 'VITE_CODAL_NOTICES_API_PATH'
    | 'VITE_AUTH_API_BASE_URL'
    | 'VITE_SYMBOL_SEARCH_DEBOUNCE_MS'
    | 'VITE_MARKET_OVERVIEW_REFRESH_MS'
    | 'VITE_CODAL_NOTICES_REFRESH_MS'
    | 'VITE_TSETMC_CLOSING_PRICE_REFRESH_MS'
    | 'VITE_TSETMC_INSTRUMENT_INFO_REFRESH_MS'
    | 'VITE_TSETMC_BEST_LIMITS_REFRESH_MS'
    | 'VITE_TSETMC_CLIENT_TYPE_REFRESH_MS'
    | 'VITE_FIPIRAN_SNAPSHOT_REFRESH_MS'
    | 'VITE_FIPIRAN_FUND_SUMMARY_REFRESH_MS'
    | 'VITE_FIPIRAN_FUND_DETAILS_REFRESH_MS'
    | 'VITE_API_ERROR_RETRY_MS';

const getRequiredEnv = (key: RequiredEnvKey) => {
    const value = import.meta.env[key];
    if (!value) {
        throw new Error(`Missing required env: ${key}`);
    }
    return value;
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
    marketOverviewApiPath: getRequiredEnv('VITE_MARKET_OVERVIEW_API_PATH'),
    tsetmcApiBaseUrl: getRequiredEnv('VITE_TSETMC_API_BASE_URL'),
    tsetmcClosingPriceApiPath: getRequiredEnv('VITE_TSETMC_CLOSING_PRICE_API_PATH'),
    tsetmcInstrumentInfoApiPath: getRequiredEnv('VITE_TSETMC_INSTRUMENT_INFO_API_PATH'),
    tsetmcBestLimitsApiPath: getRequiredEnv('VITE_TSETMC_BEST_LIMITS_API_PATH'),
    tsetmcClientTypeApiPath: getRequiredEnv('VITE_TSETMC_CLIENT_TYPE_API_PATH'),
    tsetmcCodalNoticesApiPath: getRequiredEnv('VITE_TSETMC_CODAL_NOTICES_API_PATH'),
    fipiranApiBaseUrl: getRequiredEnv('VITE_FIPIRAN_API_BASE_URL'),
    fipiranSnapshotApiPath: getRequiredEnv('VITE_FIPIRAN_SNAPSHOT_API_PATH'),
    fipiranFundsApiPath: getRequiredEnv('VITE_FIPIRAN_FUNDS_API_PATH'),
    fipiranFundDetailsApiPath: getRequiredEnv('VITE_FIPIRAN_FUND_DETAILS_API_PATH'),
    symbolSearchApiBaseUrl: getRequiredEnv('VITE_SYMBOL_SEARCH_API_BASE_URL'),
    symbolSearchApiPath: getRequiredEnv('VITE_SYMBOL_SEARCH_API_PATH'),
    symbolSearchDebounceMs: parsePositiveInt(
        getRequiredEnv('VITE_SYMBOL_SEARCH_DEBOUNCE_MS'),
        'VITE_SYMBOL_SEARCH_DEBOUNCE_MS'
    ),
    tsetmcClosingPriceRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_CLOSING_PRICE_REFRESH_MS'),
        'VITE_TSETMC_CLOSING_PRICE_REFRESH_MS'
    ),
    tsetmcInstrumentInfoRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_INSTRUMENT_INFO_REFRESH_MS'),
        'VITE_TSETMC_INSTRUMENT_INFO_REFRESH_MS'
    ),
    tsetmcBestLimitsRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_BEST_LIMITS_REFRESH_MS'),
        'VITE_TSETMC_BEST_LIMITS_REFRESH_MS'
    ),
    tsetmcClientTypeRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_CLIENT_TYPE_REFRESH_MS'),
        'VITE_TSETMC_CLIENT_TYPE_REFRESH_MS'
    ),
    fipiranSnapshotRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_FIPIRAN_SNAPSHOT_REFRESH_MS'),
        'VITE_FIPIRAN_SNAPSHOT_REFRESH_MS'
    ),
    fipiranFundSummaryRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_FIPIRAN_FUND_SUMMARY_REFRESH_MS'),
        'VITE_FIPIRAN_FUND_SUMMARY_REFRESH_MS'
    ),
    fipiranFundDetailsRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_FIPIRAN_FUND_DETAILS_REFRESH_MS'),
        'VITE_FIPIRAN_FUND_DETAILS_REFRESH_MS'
    ),
    marketOverviewRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_MARKET_OVERVIEW_REFRESH_MS'),
        'VITE_MARKET_OVERVIEW_REFRESH_MS'
    ),
    codalApiBaseUrl: getRequiredEnv('VITE_CODAL_API_BASE_URL'),
    codalNoticesApiPath: getRequiredEnv('VITE_CODAL_NOTICES_API_PATH'),
    codalNoticesRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_CODAL_NOTICES_REFRESH_MS'),
        'VITE_CODAL_NOTICES_REFRESH_MS'
    ),
    apiErrorRetryMs: parsePositiveInt(
        getRequiredEnv('VITE_API_ERROR_RETRY_MS'),
        'VITE_API_ERROR_RETRY_MS'
    ),
    authApiBaseUrl: getRequiredEnv('VITE_AUTH_API_BASE_URL'),
});
