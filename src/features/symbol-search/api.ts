import {appConfig} from '../../config/appConfig';
import type {
    ApiResponse,
    FipiranFundDetails,
    FipiranFundSummary,
    FipiranInstrumentSnapshot,
    SymbolSearchRow,
    TsetmcBestLimitLevel,
    TsetmcClientType,
    TsetmcClosingPriceInfo,
    TsetmcEtfInfo,
    TsetmcInstrumentInfo,
    TsetmcRelatedCompaniesResult,
} from './types';

type TsetmcBestLimitsResult = {
    orderBookLevels: TsetmcBestLimitLevel[];
};

type TsetmcClientTypeResult = TsetmcClientType;

export type TsetmcCodalNotice = {
    noticeId: number | null;
    symbol: string | null;
    companyName: string | null;
    title: string | null;
    publishedAtGregorian: string | null;
    publishedDate: number | null;
    htmlReportAvailabilityCode: number | null;
    excelReportAvailabilityCode: number | null;
    pdfReportAvailabilityCode: number | null;
    xmlReportAvailabilityCode: number | null;
    trackingNumber: string | null;
};

type TsetmcCodalNoticesResult = {
    notices: TsetmcCodalNotice[];
};

type FipiranFundsResult = {
    funds: {
        items: FipiranFundSummary[];
        page: number;
        pageSize: number;
        totalCount: number;
    };
};

const SESSION_STORAGE_KEY = 'bourse-azma-session';
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'bourse-azma-access-token';

const getAccessToken = () => {
    if (typeof window === 'undefined') return null;

    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (rawSession) {
        try {
            const parsed = JSON.parse(rawSession) as { accessToken?: unknown };
            if (typeof parsed.accessToken === 'string' && parsed.accessToken.trim() !== '') {
                return parsed.accessToken.trim();
            }
        } catch {
            // Ignore invalid localStorage payload.
        }
    }

    const legacyToken = window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
    if (typeof legacyToken === 'string' && legacyToken.trim() !== '') {
        return legacyToken.trim();
    }

    return null;
};

const buildHeaders = () => {
    const headers: Record<string, string> = {
        accept: '*/*',
    };
    const accessToken = getAccessToken();
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
};

const normalizePath = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const joinUrl = (baseUrl: string, path: string) => `${trimTrailingSlash(baseUrl)}${normalizePath(path)}`;
const applyTemplate = (template: string, values: Record<string, string>) => {
    let resolved = template;
    Object.entries(values).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return resolved;
};

const fetchApi = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
    const response = await fetch(url, {
        headers: buildHeaders(),
        signal,
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ApiResponse<T>;
    if (payload.code !== 200 || payload.result === undefined) {
        throw new Error(payload.message || 'Invalid response payload');
    }

    return payload.result;
};

const buildSymbolSearchUrl = (query: string) => {
    return joinUrl(
        appConfig.symbolSearchApiBaseUrl,
        applyTemplate(appConfig.symbolSearchApiPath, {
            query: encodeURIComponent(query),
        })
    );
};

const buildFundsSearchUrl = (query: string, pageSize: number) => {
    return joinUrl(
        appConfig.fipiranApiBaseUrl,
        applyTemplate(appConfig.fipiranFundsApiPath, {
            pageIndex: '1',
            pageSize: encodeURIComponent(String(pageSize)),
            search: encodeURIComponent(query),
        })
    );
};

const buildFundDetailsUrl = (registrationNumber: string) => {
    return joinUrl(
        appConfig.fipiranApiBaseUrl,
        applyTemplate(appConfig.fipiranFundDetailsApiPath, {
            registrationNumber: encodeURIComponent(registrationNumber),
        })
    );
};

export const searchSymbols = async (query: string, signal?: AbortSignal) =>
    fetchApi<SymbolSearchRow[]>(buildSymbolSearchUrl(query), signal);

export const getTsetmcClosingPriceInfo = async (instrumentCode: string, signal?: AbortSignal) =>
    fetchApi<TsetmcClosingPriceInfo>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcClosingPriceApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
        })
    ), signal);

export const getTsetmcInstrumentInfo = async (instrumentCode: string, signal?: AbortSignal) =>
    fetchApi<TsetmcInstrumentInfo>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcInstrumentInfoApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
        })
    ), signal);

export const getTsetmcBestLimits = async (instrumentCode: string, signal?: AbortSignal) =>
    fetchApi<TsetmcBestLimitsResult>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcBestLimitsApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
        })
    ), signal);

export const getTsetmcClientType = async (instrumentCode: string, signal?: AbortSignal) =>
    fetchApi<TsetmcClientTypeResult>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcClientTypeApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
        })
    ), signal);

export const getTsetmcCodalNotices = async (instrumentCode: string, limit: number, signal?: AbortSignal) =>
    fetchApi<TsetmcCodalNoticesResult>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcCodalNoticesApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
            limit: encodeURIComponent(String(limit)),
        })
    ), signal);

export const getTsetmcEtfInfo = async (instrumentCode: string, signal?: AbortSignal) =>
    fetchApi<TsetmcEtfInfo>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcEtfInfoApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
        })
    ), signal);

export const getTsetmcRelatedCompanies = async (sectorCode: string, signal?: AbortSignal) =>
    fetchApi<TsetmcRelatedCompaniesResult>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcRelatedCompaniesApiPath, {
            sectorCode: encodeURIComponent(sectorCode),
        })
    ), signal);

export const getFipiranInstrumentSnapshot = async (instrumentCode: string, signal?: AbortSignal) =>
    fetchApi<FipiranInstrumentSnapshot>(joinUrl(
        appConfig.fipiranApiBaseUrl,
        applyTemplate(appConfig.fipiranSnapshotApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
        })
    ), signal);

export const searchFunds = async (query: string, pageSize: number, signal?: AbortSignal) =>
    fetchApi<FipiranFundsResult>(buildFundsSearchUrl(query, pageSize), signal);

export const getFundDetails = async (registrationNumber: string, signal?: AbortSignal) =>
    fetchApi<FipiranFundDetails>(buildFundDetailsUrl(registrationNumber), signal);

const inflightCodalNoticeRequests = new Map<string, Promise<unknown>>();

export const getCodalNotices = async <T>(queryString: string, signal?: AbortSignal) => {
    const inflight = inflightCodalNoticeRequests.get(queryString);
    if (inflight) {
        return inflight as Promise<T>;
    }

    const request = fetchApi<T>(
        joinUrl(
            appConfig.codalApiBaseUrl,
            applyTemplate(appConfig.codalNoticesApiPath, {
                queryString,
            })
        ),
        signal
    ).finally(() => {
        if (inflightCodalNoticeRequests.get(queryString) === request) {
            inflightCodalNoticeRequests.delete(queryString);
        }
    });

    inflightCodalNoticeRequests.set(queryString, request);
    return request;
};
