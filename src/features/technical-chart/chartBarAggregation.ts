import {gregorianMsToParts, jalaliMonthStartMs, jalaliYearStartMs,} from '../../utils/jalaliCalendar';
import type {ChartBar} from './chartBarTypes';
import {finalizeAggregatedBar, positiveMax, positiveMin} from './chartBarOhlc';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const utcDayMs = (timeMs: number) => {
    const {gy, gm, gd} = gregorianMsToParts(timeMs);
    return Date.UTC(gy, gm - 1, gd);
};

const addUtcDays = (dayMs: number, days: number) => dayMs + days * MS_PER_DAY;

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
