import {getTsetmcClosingPriceChart, getTsetmcClosingPriceDaily,} from '../symbol-search/api';
import type {TsetmcClosingPriceChartDataItem} from '../symbol-search/types';
import {applyChartTimeframe, type ChartBar, mapChartDataItemsToBars, mapDailyItemsToBars,} from './mapChartBars';
import type {ChartTimeframe} from './chartConfig';

const RESOLUTION_TO_PERIOD: Record<string, string> = {
    '1D': 'D',
    '1W': 'W',
    '1M': 'M',
    '12M': '12M',
};

const barCache = new Map<string, ChartBar[]>();

const isRetryableChartError = (error: unknown) =>
    error instanceof Error && /status 500|status 502|status 503|status 504/.test(error.message);

const fetchChartResultWithRetry = async (
    instrumentCode: string,
    period: string,
    signal?: AbortSignal
) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        try {
            return await getTsetmcClosingPriceChart(instrumentCode, period, signal);
        } catch (error) {
            lastError = error;
            if (!isRetryableChartError(error) || attempt === 2) {
                throw error;
            }
        }
    }

    throw lastError;
};

const loadDailyBars = async (
    instrumentCode: string,
    signal?: AbortSignal
): Promise<ChartBar[]> => {
    let chartFetchError: unknown = null;

    try {
        const chartResult = await fetchChartResultWithRetry(instrumentCode, 'D', signal);
        const bars = mapChartDataItemsToBars(chartResult.chartData ?? []);
        if (bars.length > 0) {
            return bars;
        }
    } catch (error) {
        chartFetchError = error;
    }

    try {
        const dailyResult = await getTsetmcClosingPriceDaily(instrumentCode, 0, signal);
        const bars = mapDailyItemsToBars(dailyResult.dailyPrices ?? []);
        if (bars.length > 0) {
            return bars;
        }
    } catch (dailyError) {
        if (chartFetchError) {
            throw chartFetchError;
        }
        throw dailyError;
    }

    if (chartFetchError) {
        throw chartFetchError;
    }

    return [];
};

export const clearChartBarCache = (instrumentCode?: string) => {
    if (!instrumentCode) {
        barCache.clear();
        return;
    }

    for (const key of barCache.keys()) {
        if (key.startsWith(`${instrumentCode}:`)) {
            barCache.delete(key);
        }
    }
};

export const fetchChartBars = async (
    instrumentCode: string,
    resolution: string,
    signal?: AbortSignal
): Promise<ChartBar[]> => {
    const period = RESOLUTION_TO_PERIOD[resolution];
    if (!period) {
        throw new Error(`بازه زمانی پشتیبانی نمی‌شود: ${resolution}`);
    }

    const cacheKey = `${instrumentCode}:${resolution}:v3`;
    const cached = barCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    let bars: ChartBar[];

    if (resolution === '1D') {
        let rawItems: TsetmcClosingPriceChartDataItem[] = [];
        let chartFetchError: unknown = null;

        try {
            const chartResult = await fetchChartResultWithRetry(instrumentCode, 'D', signal);
            rawItems = chartResult.chartData ?? [];
        } catch (error) {
            chartFetchError = error;
        }

        bars = mapChartDataItemsToBars(rawItems);

        if (bars.length === 0) {
            bars = await loadDailyBars(instrumentCode, signal);
            if (bars.length === 0 && chartFetchError) {
                throw chartFetchError;
            }
        }
    } else {
        const dailyBars = await loadDailyBars(instrumentCode, signal);
        bars = applyChartTimeframe(dailyBars, resolution as ChartTimeframe);
    }

    if (bars.length > 0) {
        barCache.set(cacheKey, bars);
    }

    return bars;
};
