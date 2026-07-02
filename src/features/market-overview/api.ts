import {appConfig} from '../../config/appConfig';
import {getTsetmcClosingPriceChart, getTsetmcMostVisited, type TsetmcCodalNotice,} from '../symbol-search/api';
import type {ApiResponse} from '../symbol-search/types';
import {withAuthRequest} from '../../lib/authRequest';
import type {
    CodalLatestNotice,
    InstrumentEffect,
    MarketId,
    MarketOverview,
    SelectedIndex,
    SparklinePoint,
} from './types';

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
        headers: {accept: '*/*'},
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

type MarketOverviewApiResult = {
    marketOverview?: {
        totalIndexValue?: number | null;
        totalIndexChange?: number | null;
        equalWeightedIndexValue?: number | null;
        equalWeightedIndexChange?: number | null;
        totalTradeCount?: number | null;
        totalTradeValue?: number | null;
        totalTradeVolume?: number | null;
        marketStateTitle?: string | null;
    };
};

type SelectedIndexesApiResult = {
    selectedIndexes?: Array<{
        indexCode?: string | null;
        currentValue?: number | null;
        dayHighValue?: number | null;
        baseValue?: number | null;
        changePercent?: number | null;
        changeValue?: number | null;
        indexName?: string | null;
    }>;
};

type InstrumentEffectsApiResult = {
    instrumentEffects?: Array<{
        instrumentCode?: string | null;
        symbol?: string | null;
        fullName?: string | null;
        closingPrice?: number | null;
        indexEffectValue?: number | null;
    }>;
};

type CodalNoticesApiResult = {
    notices?: TsetmcCodalNotice[];
};

const toNumber = (value: number | null | undefined, fallback = 0) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toString = (value: string | null | undefined, fallback = '') =>
    typeof value === 'string' ? value : fallback;

export const getMarketOverview = async (marketId: MarketId, signal?: AbortSignal): Promise<MarketOverview> => {
    const result = await fetchApi<MarketOverviewApiResult>(
        joinUrl(
            appConfig.marketOverviewApiBaseUrl,
            applyTemplate(appConfig.marketOverviewApiPath, {marketId: String(marketId)}),
        ),
        signal,
    );

    const overview = result.marketOverview;
    return {
        totalIndexValue: toNumber(overview?.totalIndexValue),
        totalIndexChange: toNumber(overview?.totalIndexChange),
        equalWeightedIndexValue: toNumber(overview?.equalWeightedIndexValue),
        equalWeightedIndexChange: toNumber(overview?.equalWeightedIndexChange),
        totalTradeCount: toNumber(overview?.totalTradeCount),
        totalTradeValue: toNumber(overview?.totalTradeValue),
        totalTradeVolume: toNumber(overview?.totalTradeVolume),
        marketStateTitle: toString(overview?.marketStateTitle, 'نامشخص'),
    };
};

export const getSelectedIndexes = async (marketId: MarketId, signal?: AbortSignal): Promise<SelectedIndex[]> => {
    const result = await fetchApi<SelectedIndexesApiResult>(
        joinUrl(
            appConfig.tsetmcApiBaseUrl,
            applyTemplate(appConfig.tsetmcSelectedIndexesApiPath, {marketId: String(marketId)}),
        ),
        signal,
    );

    return (result.selectedIndexes ?? [])
        .map((index) => ({
            indexCode: toString(index.indexCode),
            currentValue: toNumber(index.currentValue),
            dayHighValue: toNumber(index.dayHighValue),
            baseValue: toNumber(index.baseValue),
            changePercent: toNumber(index.changePercent),
            changeValue: toNumber(index.changeValue),
            indexName: toString(index.indexName, 'شاخص'),
        }))
        .filter((index) => index.indexCode !== '');
};

export const getInstrumentEffects = async (
    marketId: MarketId,
    limit: number,
    signal?: AbortSignal,
): Promise<InstrumentEffect[]> => {
    const result = await fetchApi<InstrumentEffectsApiResult>(
        joinUrl(
            appConfig.tsetmcApiBaseUrl,
            applyTemplate(appConfig.tsetmcInstrumentEffectsApiPath, {
                marketId: String(marketId),
                limit: String(limit),
            }),
        ),
        signal,
    );

    return (result.instrumentEffects ?? [])
        .map((item) => ({
            instrumentCode: toString(item.instrumentCode),
            symbol: toString(item.symbol),
            fullName: toString(item.fullName),
            closingPrice: toNumber(item.closingPrice),
            indexEffectValue: toNumber(item.indexEffectValue),
        }))
        .filter((item) => item.instrumentCode !== '' && item.symbol !== '');
};

export const getMostVisitedQuotes = async (
    marketId: MarketId,
    limit: number,
    signal?: AbortSignal,
) => getTsetmcMostVisited(marketId, limit, signal);

export const getLatestCodalNotices = async (limit: number, signal?: AbortSignal): Promise<CodalLatestNotice[]> => {
    const result = await fetchApi<CodalNoticesApiResult>(
        joinUrl(
            appConfig.tsetmcApiBaseUrl,
            applyTemplate(appConfig.tsetmcLatestCodalNoticesApiPath, {limit: String(limit)}),
        ),
        signal,
    );

    return (result.notices ?? []).map((notice) => ({
        noticeId: notice.noticeId,
        symbol: notice.symbol,
        companyName: notice.companyName,
        title: notice.title,
        publishedAtGregorian: notice.publishedAtGregorian,
        trackingNumber: notice.trackingNumber,
    }));
};

const parseChartDate = (raw: string | null | undefined): number | null => {
    if (!raw) return null;
    const normalized = raw.trim().slice(0, 8);
    if (!/^\d{8}$/.test(normalized)) return null;
    const year = Number(normalized.slice(0, 4));
    const month = Number(normalized.slice(4, 6)) - 1;
    const day = Number(normalized.slice(6, 8));
    const timestamp = Date.UTC(year, month, day);
    return Number.isFinite(timestamp) ? timestamp : null;
};

export const getSymbolSparkline = async (
    instrumentCode: string,
    signal?: AbortSignal,
): Promise<SparklinePoint[]> => {
    const result = await getTsetmcClosingPriceChart(instrumentCode, 'D', signal);
    return (result.chartData ?? [])
        .map((item) => {
            const time = parseChartDate(item.eventDate);
            const value = item.lastTradePrice ?? item.firstTradePrice ?? null;
            if (time === null || value === null || !Number.isFinite(value)) {
                return null;
            }
            return {time, value};
        })
        .filter((point): point is SparklinePoint => point !== null)
        .slice(-30);
};
