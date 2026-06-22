import type {SymbolOrderBookRow} from './types';

export const ORDER_BOOK_ROW_COUNT = 5;

export const normalizeOrderBookRows = (rows: SymbolOrderBookRow[]): SymbolOrderBookRow[] => {
    if (rows.length >= ORDER_BOOK_ROW_COUNT) {
        return rows.slice(0, ORDER_BOOK_ROW_COUNT);
    }

    if (rows.length === 0) {
        return Array.from({length: ORDER_BOOK_ROW_COUNT}, (_, index) => createEmptyOrderBookRow(index + 1));
    }

    return [
        ...rows,
        ...Array.from({length: ORDER_BOOK_ROW_COUNT - rows.length}, (_, index) =>
            createEmptyOrderBookRow(rows.length + index + 1)
        ),
    ];
};

const createEmptyOrderBookRow = (level: number): SymbolOrderBookRow => ({
    id: `empty-row-${level}`,
    level,
    askCount: null,
    askVolume: null,
    askPrice: null,
    bidPrice: null,
    bidVolume: null,
    bidCount: null,
});

export type OrderBookPriceRange = {
    min: number;
    max: number;
};

const collectQueuePrices = (
    rows: SymbolOrderBookRow[],
    side: 'bid' | 'ask'
): number[] => {
    const prices: number[] = [];
    for (const row of rows) {
        const price = side === 'bid' ? row.bidPrice : row.askPrice;
        const volume = side === 'bid' ? row.bidVolume : row.askVolume;
        if (price !== null && price !== undefined && price > 0 && (volume ?? 0) > 0) {
            prices.push(price);
        }
    }
    return prices;
};

export const getBidPriceRange = (rows: SymbolOrderBookRow[]): OrderBookPriceRange | null => {
    const prices = collectQueuePrices(rows, 'bid');
    if (prices.length === 0) return null;
    return {min: Math.min(...prices), max: Math.max(...prices)};
};

export const getAskPriceRange = (rows: SymbolOrderBookRow[]): OrderBookPriceRange | null => {
    const prices = collectQueuePrices(rows, 'ask');
    if (prices.length === 0) return null;
    return {min: Math.min(...prices), max: Math.max(...prices)};
};

/** Both buy and sell queues must have at least one level with price and volume. */
export const isOrderBookReady = (
    bidPriceRange: OrderBookPriceRange | null,
    askPriceRange: OrderBookPriceRange | null
): boolean => bidPriceRange !== null && askPriceRange !== null;

export const getOrderBookMaxVolumes = (rows: SymbolOrderBookRow[]) => {
    const maxAskVolume = rows.reduce((max, row) => Math.max(max, row.askVolume ?? 0), 0);
    const maxBidVolume = rows.reduce((max, row) => Math.max(max, row.bidVolume ?? 0), 0);

    return {
        ask: maxAskVolume > 0 ? maxAskVolume : 1,
        bid: maxBidVolume > 0 ? maxBidVolume : 1,
    };
};

/** Linear share blended with sqrt scale so smaller rows stay visible when one level dominates. */
export const volumeToBarPercent = (value: number, max: number) => {
    if (value <= 0 || max <= 0) return 0;
    if (value >= max) return 100;

    const linear = (value / max) * 100;
    const sqrt = (Math.sqrt(value) / Math.sqrt(max)) * 100;
    const blended = value >= max * 0.5 ? linear : sqrt;

    return Math.max(3, Math.min(100, blended));
};

export const clampDepthPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value) || value <= 0) return 0;
    return Math.min(100, value);
};
