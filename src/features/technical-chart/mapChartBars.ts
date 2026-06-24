import type {Time} from 'lightweight-charts';
import type {TsetmcClosingPriceChartDataItem, TsetmcClosingPriceDailyItem,} from '../symbol-search/types';
import {
    gregorianMsToParts,
    jalaliMonthStartMs,
    jalaliYearStartMs,
    parseTsetmcEventDateToMs,
} from '../../utils/jalaliCalendar';
import type {ChartTimeframe} from './chartConfig';

export type ChartBar = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    /** First calendar day of a weekly bucket (inclusive). */
    periodStartMs?: number;
    /** Last calendar day of a weekly bucket (inclusive). */
    periodEndMs?: number;
    /** True for the most recent weekly candle (open week → present). */
    isLatestPeriod?: boolean;
};

const parseEventDateToMs = parseTsetmcEventDateToMs;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const utcDayMs = (timeMs: number) => {
    const {gy, gm, gd} = gregorianMsToParts(timeMs);
    return Date.UTC(gy, gm - 1, gd);
};

const addUtcDays = (dayMs: number, days: number) => dayMs + days * MS_PER_DAY;

/** TSETMC uses 0 for missing min/max/first on older rows — not a valid trade price. */
const isValidTradePrice = (value: number | null | undefined): value is number =>
    value !== null && value !== undefined && Number.isFinite(value) && value > 0;

const firstValidPrice = (...values: Array<number | null | undefined>) => {
    for (const value of values) {
        if (isValidTradePrice(value)) {
            return value;
        }
    }
    return null;
};

export const resolveOhlc = (
    close: number | null,
    open: number | null,
    high: number | null,
    low: number | null
): { open: number; high: number; low: number; close: number } | null => {
    const resolvedClose = firstValidPrice(close, open, high, low);
    if (resolvedClose === null) {
        return null;
    }

    const resolvedOpen = isValidTradePrice(open) ? open : resolvedClose;
    const resolvedHigh = isValidTradePrice(high)
        ? high
        : Math.max(resolvedOpen, resolvedClose);
    const resolvedLow = isValidTradePrice(low)
        ? low
        : Math.min(resolvedOpen, resolvedClose);

    return {
        open: resolvedOpen,
        high: Math.max(resolvedHigh, resolvedOpen, resolvedClose),
        low: Math.min(resolvedLow, resolvedOpen, resolvedClose),
        close: resolvedClose,
    };
};

const barDataQuality = (bar: ChartBar) => {
    let score = 0;
    if (isValidTradePrice(bar.close)) score += 4;
    if (isValidTradePrice(bar.open)) score += 1;
    if (isValidTradePrice(bar.high)) score += 1;
    if (isValidTradePrice(bar.low)) score += 1;
    return score;
};

const pickBetterBar = (existing: ChartBar, candidate: ChartBar) => {
    const existingScore = barDataQuality(existing);
    const candidateScore = barDataQuality(candidate);
    if (candidateScore !== existingScore) {
        return candidateScore > existingScore ? candidate : existing;
    }
    return candidate;
};

const positiveMin = (values: number[]) => {
    const valid = values.filter(isValidTradePrice);
    return valid.length > 0 ? Math.min(...valid) : null;
};

const positiveMax = (values: number[]) => {
    const valid = values.filter(isValidTradePrice);
    return valid.length > 0 ? Math.max(...valid) : null;
};

const hasTradeActivity = (
    volume: number | null | undefined,
    tradeCount?: number | null
) => (volume ?? 0) > 0 || (tradeCount ?? 0) > 0;

const hasSessionPrices = (
    open: number | null | undefined,
    high: number | null | undefined,
    low: number | null | undefined
) => isValidTradePrice(open) || isValidTradePrice(high) || isValidTradePrice(low);

/**
 * TSETMC repeats a stale closing price on halt/non-trading days with zero volume
 * and zero session prices — rendering them creates flat horizontal lines on the chart.
 */
export const isFrozenNonTradingRow = (
    volume: number | null | undefined,
    tradeCount: number | null | undefined,
    open: number | null | undefined,
    high: number | null | undefined,
    low: number | null | undefined
) => !hasTradeActivity(volume, tradeCount) && !hasSessionPrices(open, high, low);

const finalizeAggregatedBar = (bar: Omit<ChartBar, 'open' | 'high' | 'low' | 'close'> & {
    open: number;
    high: number | null;
    low: number | null;
    close: number;
}): ChartBar | null => {
    const ohlc = resolveOhlc(
        bar.close,
        bar.open,
        bar.high,
        bar.low
    );
    if (!ohlc) {
        return null;
    }

    return {
        ...bar,
        ...ohlc,
    };
};

const toBar = (
    timeMs: number,
    open: number | null,
    high: number | null,
    low: number | null,
    close: number | null,
    volume: number | null,
    periodStartMs?: number,
    isLatestPeriod?: boolean
): ChartBar | null => {
    const ohlc = resolveOhlc(close, open, high, low);
    if (!ohlc) {
        return null;
    }

    return {
        time: timeMs,
        open: ohlc.open,
        high: ohlc.high,
        low: ohlc.low,
        close: ohlc.close,
        volume: volume !== null && Number.isFinite(volume) ? volume : 0,
        periodStartMs,
        isLatestPeriod,
    };
};

/** Union multiple bar sets by time; on duplicate days keep the row with fuller OHLC. */
export const mergeChartBarsByTime = (...groups: ChartBar[][]): ChartBar[] => {
    const byTime = new Map<number, ChartBar>();

    for (const group of groups) {
        for (const bar of group) {
            const existing = byTime.get(bar.time);
            byTime.set(bar.time, existing ? pickBetterBar(existing, bar) : bar);
        }
    }

    return [...byTime.values()].sort((left, right) => left.time - right.time);
};

/** Lightweight Charts requires strictly ascending unique times; TSETMC may repeat a day. */
export const deduplicateChartBarsByTime = (bars: ChartBar[]): ChartBar[] => {
    const sorted = [...bars].sort((left, right) => left.time - right.time);
    const deduped: ChartBar[] = [];

    for (const bar of sorted) {
        const last = deduped[deduped.length - 1];
        if (last && last.time === bar.time) {
            deduped[deduped.length - 1] = pickBetterBar(last, bar);
            continue;
        }
        deduped.push(bar);
    }

    return deduped;
};

export const mapChartDataItemsToBars = (items: TsetmcClosingPriceChartDataItem[]): ChartBar[] => {
    const bars: ChartBar[] = [];

    for (const item of items) {
        const timeMs = parseEventDateToMs(item.eventDate);
        if (timeMs === null) {
            continue;
        }

        const periodStartMs = item.periodStartDate
            ? parseEventDateToMs(item.periodStartDate) ?? undefined
            : undefined;

        if (isFrozenNonTradingRow(
            item.tradeVolume,
            null,
            item.firstTradePrice,
            item.dayMaxPrice,
            item.dayMinPrice
        )) {
            continue;
        }

        const bar = toBar(
            timeMs,
            item.firstTradePrice,
            item.dayMaxPrice,
            item.dayMinPrice,
            item.lastTradePrice ?? item.firstTradePrice,
            item.tradeVolume,
            periodStartMs,
            item.currentPeriod === true
        );
        if (bar) {
            bars.push(bar);
        }
    }

    return deduplicateChartBarsByTime(bars);
};

export const mapDailyItemsToBars = (items: TsetmcClosingPriceDailyItem[]): ChartBar[] => {
    const bars: ChartBar[] = [];

    for (const item of items) {
        const timeMs = parseEventDateToMs(item.eventDate);
        if (timeMs === null) {
            continue;
        }

        if (isFrozenNonTradingRow(
            item.tradeVolume,
            item.tradeCount,
            item.firstTradePrice,
            item.dayMaxPrice,
            item.dayMinPrice
        )) {
            continue;
        }

        const bar = toBar(
            timeMs,
            item.firstTradePrice,
            item.dayMaxPrice,
            item.dayMinPrice,
            item.lastTradePrice ?? item.closingPrice,
            item.tradeVolume
        );
        if (bar) {
            bars.push(bar);
        }
    }

    return deduplicateChartBarsByTime(bars);
};

const aggregateBars = (
    bars: ChartBar[],
    bucketKey: (bar: ChartBar) => number,
    bucketTime: (key: number) => number,
    withPeriodStart?: boolean
): ChartBar[] => {
    const buckets = new Map<number, ChartBar[]>();

    for (const bar of bars) {
        const key = bucketKey(bar);
        const bucket = buckets.get(key);
        if (bucket) {
            bucket.push(bar);
        } else {
            buckets.set(key, [bar]);
        }
    }

    const aggregated: ChartBar[] = [];

    for (const [key, bucketBars] of buckets) {
        const sorted = bucketBars.sort((left, right) => left.time - right.time);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const high = positiveMax(sorted.map((bar) => bar.high));
        const low = positiveMin(sorted.map((bar) => bar.low));
        const finalized = finalizeAggregatedBar({
            time: withPeriodStart ? last.time : bucketTime(key),
            periodStartMs: withPeriodStart ? first.time : undefined,
            open: first.open,
            high,
            low,
            close: last.close,
            volume: sorted.reduce((sum, bar) => sum + (bar.volume ?? 0), 0),
        });
        if (finalized) {
            aggregated.push(finalized);
        }
    }

    return aggregated.sort((left, right) => left.time - right.time);
};

const normalizeWeeklyBars = (bars: ChartBar[]): ChartBar[] =>
    bars.map((bar, index, all) => {
        const periodStartMs = bar.periodStartMs ?? bar.time;
        return {
            ...bar,
            periodStartMs,
            periodEndMs: bar.periodEndMs ?? addUtcDays(periodStartMs, 6),
            isLatestPeriod: index === all.length - 1,
        };
    });

/**
 * Buckets daily bars into consecutive 7-calendar-day windows anchored at the latest bar.
 * Example: latest day D → [D-6, D], then [D-13, D-7], then [D-20, D-14], …
 */
export const aggregateDailyBarsToWeekly = (bars: ChartBar[]): ChartBar[] => {
    if (bars.length === 0) {
        return [];
    }

    const sorted = [...bars].sort((left, right) => left.time - right.time);
    const anchorDay = utcDayMs(sorted[sorted.length - 1].time);
    const buckets = new Map<number, { periodStartMs: number; periodEndMs: number; bars: ChartBar[] }>();

    for (const bar of sorted) {
        const barDay = utcDayMs(bar.time);
        const daysFromAnchor = Math.floor((anchorDay - barDay) / MS_PER_DAY);
        if (daysFromAnchor < 0) {
            continue;
        }

        const bucketIndex = Math.floor(daysFromAnchor / 7);
        const periodEndMs = addUtcDays(anchorDay, -bucketIndex * 7);
        const periodStartMs = addUtcDays(periodEndMs, -6);

        const bucket = buckets.get(periodStartMs);
        if (bucket) {
            bucket.bars.push(bar);
        } else {
            buckets.set(periodStartMs, {periodStartMs, periodEndMs, bars: [bar]});
        }
    }

    const aggregated: ChartBar[] = [...buckets.values()]
        .sort((left, right) => left.periodStartMs - right.periodStartMs)
        .map((bucket) => {
            const chunk = [...bucket.bars].sort((left, right) => left.time - right.time);
            const first = chunk[0];
            const last = chunk[chunk.length - 1];

            return finalizeAggregatedBar({
                time: last.time,
                periodStartMs: bucket.periodStartMs,
                periodEndMs: bucket.periodEndMs,
                open: first.open,
                high: positiveMax(chunk.map((item) => item.high)),
                low: positiveMin(chunk.map((item) => item.low)),
                close: last.close,
                volume: chunk.reduce((sum, item) => sum + (item.volume ?? 0), 0),
            });
        })
        .filter((bar): bar is ChartBar => bar !== null);

    return normalizeWeeklyBars(aggregated);
};

export const aggregateDailyBarsToMonthly = (bars: ChartBar[]): ChartBar[] =>
    aggregateBars(bars, (bar) => jalaliMonthStartMs(bar.time), (key) => key);

export const aggregateDailyBarsToYearly = (bars: ChartBar[]): ChartBar[] =>
    aggregateBars(bars, (bar) => jalaliYearStartMs(bar.time), (key) => key);

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
