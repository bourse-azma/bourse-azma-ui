import type {ChartBar} from './chartBarTypes';

/** TSETMC uses 0 for missing min/max/first on older rows — not a valid trade price. */
export const isValidTradePrice = (value: number | null | undefined): value is number =>
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

export const pickBetterBar = (existing: ChartBar, candidate: ChartBar) => {
    const existingScore = barDataQuality(existing);
    const candidateScore = barDataQuality(candidate);
    if (candidateScore !== existingScore) {
        return candidateScore > existingScore ? candidate : existing;
    }
    return candidate;
};

export const positiveMin = (values: number[]) => {
    const valid = values.filter(isValidTradePrice);
    return valid.length > 0 ? Math.min(...valid) : null;
};

export const positiveMax = (values: number[]) => {
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

export const finalizeAggregatedBar = (bar: Omit<ChartBar, 'open' | 'high' | 'low' | 'close'> & {
    open: number;
    high: number | null;
    low: number | null;
    close: number;
}): ChartBar | null => {
    const ohlc = resolveOhlc(bar.close, bar.open, bar.high, bar.low);
    if (!ohlc) {
        return null;
    }

    return {
        ...bar,
        ...ohlc,
    };
};

export const toBar = (
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
