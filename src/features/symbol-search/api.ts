import {appConfig} from '../../config/appConfig';
import {withAuthRequest} from '../../lib/authRequest';
import type {
    ApiResponse,
    SymbolSearchRow,
    TsetmcBestLimitLevel,
    TsetmcClientType,
    TsetmcClosingPriceChartDataResult,
    TsetmcClosingPriceDailyResult,
    TsetmcClosingPriceInfo,
    TsetmcEtfInfo,
    TsetmcInstrumentInfo,
    TsetmcMostVisitedResult,
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
    const response = await fetch(url, withAuthRequest(null, {
        headers: {
            accept: '*/*',
        },
        signal,
    }));

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

export const searchSymbols = async (query: string, signal?: AbortSignal) =>
    fetchApi<SymbolSearchRow[]>(buildSymbolSearchUrl(query), signal);

export const getTsetmcClosingPriceInfo = async (instrumentCode: string, signal?: AbortSignal) =>
    fetchApi<TsetmcClosingPriceInfo>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcClosingPriceApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
        })
    ), signal);

export const getTsetmcClosingPriceChart = async (
    instrumentCode: string,
    period: string,
    signal?: AbortSignal
) =>
    fetchApi<TsetmcClosingPriceChartDataResult>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcClosingPriceChartApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
            period: encodeURIComponent(period),
        })
    ), signal);

export const getTsetmcClosingPriceDaily = async (
    instrumentCode: string,
    days: number,
    signal?: AbortSignal
) =>
    fetchApi<TsetmcClosingPriceDailyResult>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcClosingPriceDailyApiPath, {
            instrumentCode: encodeURIComponent(instrumentCode),
            days: encodeURIComponent(String(days)),
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

export const getTsetmcMostVisited = async (marketId: number, limit: number, signal?: AbortSignal) =>
    fetchApi<TsetmcMostVisitedResult>(joinUrl(
        appConfig.tsetmcApiBaseUrl,
        applyTemplate(appConfig.tsetmcMostVisitedApiPath, {
            marketId: encodeURIComponent(String(marketId)),
            limit: encodeURIComponent(String(limit)),
        })
    ), signal);

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
