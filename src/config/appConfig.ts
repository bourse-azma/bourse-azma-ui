type RequiredEnvKey =
    | 'VITE_MARKET_OVERVIEW_API_BASE_URL'
    | 'VITE_MARKET_OVERVIEW_API_PATH'
    | 'VITE_TSETMC_API_BASE_URL'
    | 'VITE_TSETMC_CLOSING_PRICE_API_PATH'
    | 'VITE_TSETMC_CLOSING_PRICE_CHART_API_PATH'
    | 'VITE_TSETMC_CLOSING_PRICE_DAILY_API_PATH'
    | 'VITE_TSETMC_INSTRUMENT_INFO_API_PATH'
    | 'VITE_TSETMC_BEST_LIMITS_API_PATH'
    | 'VITE_TSETMC_CLIENT_TYPE_API_PATH'
    | 'VITE_TSETMC_CODAL_NOTICES_API_PATH'
    | 'VITE_TSETMC_LATEST_CODAL_NOTICES_API_PATH'
    | 'VITE_TSETMC_ETF_INFO_API_PATH'
    | 'VITE_TSETMC_RELATED_COMPANIES_API_PATH'
    | 'VITE_TSETMC_MOST_VISITED_API_PATH'
    | 'VITE_TSETMC_SELECTED_INDEXES_API_PATH'
    | 'VITE_TSETMC_INSTRUMENT_EFFECTS_API_PATH'
    | 'VITE_SYMBOL_SEARCH_API_BASE_URL'
    | 'VITE_SYMBOL_SEARCH_API_PATH'
    | 'VITE_CODAL_API_BASE_URL'
    | 'VITE_CODAL_NOTICES_API_PATH'
    | 'VITE_AUTH_API_BASE_URL'
    | 'VITE_SYMBOL_SEARCH_DEBOUNCE_MS'
    | 'VITE_MARKET_OVERVIEW_REFRESH_MS'
    | 'VITE_LANDING_MARKET_REFRESH_MS'
    | 'VITE_LANDING_CODAL_REFRESH_MS'
    | 'VITE_CODAL_NOTICES_REFRESH_MS'
    | 'VITE_TSETMC_CLOSING_PRICE_REFRESH_MS'
    | 'VITE_TSETMC_CHART_REFRESH_MS'
    | 'VITE_TSETMC_INSTRUMENT_INFO_REFRESH_MS'
    | 'VITE_TSETMC_BEST_LIMITS_REFRESH_MS'
    | 'VITE_TSETMC_CLIENT_TYPE_REFRESH_MS'
    | 'VITE_TSETMC_ETF_INFO_REFRESH_MS'
    | 'VITE_TSETMC_RELATED_COMPANIES_REFRESH_MS'
    | 'VITE_TSETMC_MOST_VISITED_REFRESH_MS'
    | 'VITE_TRADING_ORDERS_REFRESH_MS'
    | 'VITE_SUPPORT_TICKETS_REFRESH_MS'
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

const parseBoolean = (raw: string | undefined) => raw?.trim().toLowerCase() === 'true';

export const appConfig = Object.freeze({
    uiDebugMode: parseBoolean(import.meta.env.VITE_UI_DEBUG_MODE),
    marketOverviewApiBaseUrl: getRequiredEnv('VITE_MARKET_OVERVIEW_API_BASE_URL'),
    marketOverviewApiPath: getRequiredEnv('VITE_MARKET_OVERVIEW_API_PATH'),
    tsetmcApiBaseUrl: getRequiredEnv('VITE_TSETMC_API_BASE_URL'),
    tsetmcClosingPriceApiPath: getRequiredEnv('VITE_TSETMC_CLOSING_PRICE_API_PATH'),
    tsetmcClosingPriceChartApiPath: getRequiredEnv('VITE_TSETMC_CLOSING_PRICE_CHART_API_PATH'),
    tsetmcClosingPriceDailyApiPath: getRequiredEnv('VITE_TSETMC_CLOSING_PRICE_DAILY_API_PATH'),
    tsetmcInstrumentInfoApiPath: getRequiredEnv('VITE_TSETMC_INSTRUMENT_INFO_API_PATH'),
    tsetmcBestLimitsApiPath: getRequiredEnv('VITE_TSETMC_BEST_LIMITS_API_PATH'),
    tsetmcClientTypeApiPath: getRequiredEnv('VITE_TSETMC_CLIENT_TYPE_API_PATH'),
    tsetmcCodalNoticesApiPath: getRequiredEnv('VITE_TSETMC_CODAL_NOTICES_API_PATH'),
    tsetmcLatestCodalNoticesApiPath: getRequiredEnv('VITE_TSETMC_LATEST_CODAL_NOTICES_API_PATH'),
    tsetmcEtfInfoApiPath: getRequiredEnv('VITE_TSETMC_ETF_INFO_API_PATH'),
    tsetmcRelatedCompaniesApiPath: getRequiredEnv('VITE_TSETMC_RELATED_COMPANIES_API_PATH'),
    tsetmcMostVisitedApiPath: getRequiredEnv('VITE_TSETMC_MOST_VISITED_API_PATH'),
    tsetmcSelectedIndexesApiPath: getRequiredEnv('VITE_TSETMC_SELECTED_INDEXES_API_PATH'),
    tsetmcInstrumentEffectsApiPath: getRequiredEnv('VITE_TSETMC_INSTRUMENT_EFFECTS_API_PATH'),
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
    tsetmcChartRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_CHART_REFRESH_MS'),
        'VITE_TSETMC_CHART_REFRESH_MS'
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
    tsetmcEtfInfoRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_ETF_INFO_REFRESH_MS'),
        'VITE_TSETMC_ETF_INFO_REFRESH_MS'
    ),
    tsetmcRelatedCompaniesRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_RELATED_COMPANIES_REFRESH_MS'),
        'VITE_TSETMC_RELATED_COMPANIES_REFRESH_MS'
    ),
    tsetmcMostVisitedRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TSETMC_MOST_VISITED_REFRESH_MS'),
        'VITE_TSETMC_MOST_VISITED_REFRESH_MS'
    ),
    tradingOrdersRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_TRADING_ORDERS_REFRESH_MS'),
        'VITE_TRADING_ORDERS_REFRESH_MS'
    ),
    supportTicketsRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_SUPPORT_TICKETS_REFRESH_MS'),
        'VITE_SUPPORT_TICKETS_REFRESH_MS'
    ),
    marketOverviewRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_MARKET_OVERVIEW_REFRESH_MS'),
        'VITE_MARKET_OVERVIEW_REFRESH_MS'
    ),
    landingMarketRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_LANDING_MARKET_REFRESH_MS'),
        'VITE_LANDING_MARKET_REFRESH_MS'
    ),
    landingCodalRefreshMs: parsePositiveInt(
        getRequiredEnv('VITE_LANDING_CODAL_REFRESH_MS'),
        'VITE_LANDING_CODAL_REFRESH_MS'
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
