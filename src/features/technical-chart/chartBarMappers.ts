import {parseTsetmcEventDateToMs} from '../../utils/jalaliCalendar';
import type {TsetmcClosingPriceChartDataItem, TsetmcClosingPriceDailyItem} from '../symbol-search/types';
import type {ChartBar} from './chartBarTypes';
import {isFrozenNonTradingRow, pickBetterBar, toBar} from './chartBarOhlc';

const parseEventDateToMs = parseTsetmcEventDateToMs;

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
