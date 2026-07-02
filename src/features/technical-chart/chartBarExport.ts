import type {Time} from 'lightweight-charts';
import type {ChartBar} from './chartBarTypes';
import type {ChartTimeframe} from './chartConfig';
import {
    aggregateDailyBarsToMonthly,
    aggregateDailyBarsToWeekly,
    aggregateDailyBarsToYearly,
} from './chartBarAggregation';

export const applyChartTimeframe = (bars: ChartBar[], timeframe: ChartTimeframe): ChartBar[] => {
    switch (timeframe) {
        case '1W':
            return aggregateDailyBarsToWeekly(bars);
        case '1M':
            return aggregateDailyBarsToMonthly(bars);
        case '12M':
            return aggregateDailyBarsToYearly(bars);
        case '1D':
        default:
            return bars;
    }
};

export const msToChartTime = (timeMs: number): Time => {
    const date = new Date(timeMs);
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    };
};

export const barDisplayTimeMs = (bar: ChartBar, timeframe?: ChartTimeframe): number => {
    if (timeframe === '1W' && bar.periodStartMs !== undefined) {
        return bar.periodStartMs;
    }
    return bar.time;
};

export const toCandlestickData = (bars: ChartBar[], timeframe?: ChartTimeframe) =>
    bars.map((bar) => ({
        time: msToChartTime(barDisplayTimeMs(bar, timeframe)),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
    }));

export const toVolumeData = (bars: ChartBar[], upColor: string, downColor: string, timeframe?: ChartTimeframe) =>
    bars.map((bar) => ({
        time: msToChartTime(barDisplayTimeMs(bar, timeframe)),
        value: bar.volume ?? 0,
        color: bar.close >= bar.open ? upColor : downColor,
    }));
