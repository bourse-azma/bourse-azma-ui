import {getTsetmcClosingPriceChart} from '../symbol-search/api';
import {applyChartTimeframe, type ChartBar, mapChartDataItemsToBars} from './mapChartBars';
import type {ChartTimeframe} from './chartConfig';

const CHART_DAILY_PERIOD = 'D';

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

const loadDailyBarsFromChartApi = async (
    instrumentCode: string,
    signal?: AbortSignal
): Promise<ChartBar[]> => {
    const chartResult = await fetchChartResultWithRetry(instrumentCode, CHART_DAILY_PERIOD, signal);
    return mapChartDataItemsToBars(chartResult.chartData ?? []);
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
    const supported: ChartTimeframe[] = ['1D', '1W', '1M', '12M'];
    if (!supported.includes(resolution as ChartTimeframe)) {
        throw new Error(`بازه زمانی پشتیبانی نمی‌شود: ${resolution}`);
    }

    const cacheKey = `${instrumentCode}:${resolution}:v8`;
    const cached = barCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const dailyBars = await loadDailyBarsFromChartApi(instrumentCode, signal);
    const bars =
        resolution === '1D'
            ? dailyBars
            : applyChartTimeframe(dailyBars, resolution as ChartTimeframe);

    if (bars.length > 0) {
        barCache.set(cacheKey, bars);
    }

    return bars;
};
