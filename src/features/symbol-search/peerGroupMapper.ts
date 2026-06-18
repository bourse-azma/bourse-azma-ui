import type {PeerGroupRow, TsetmcRelatedCompanyItem} from './types';

const toPeerPercent = (
    price: number | null,
    priceChange: number | null
): number | null => {
    if (price === null || priceChange === null) return null;
    const previousClose = price - priceChange;
    if (!Number.isFinite(previousClose) || previousClose === 0) return null;
    return (priceChange / previousClose) * 100;
};

const toLastPercent = (
    lastPrice: number | null,
    closingPrice: number | null,
    priceChange: number | null
): number | null => {
    if (lastPrice === null || closingPrice === null || priceChange === null) return null;
    const previousClose = closingPrice - priceChange;
    if (!Number.isFinite(previousClose) || previousClose === 0) return null;
    return ((lastPrice - previousClose) / previousClose) * 100;
};

export const mapRelatedCompaniesToPeerRows = (
    items: TsetmcRelatedCompanyItem[]
): PeerGroupRow[] =>
    items
        .filter((item) => item.symbol && item.instrumentCode)
        .map((item) => ({
            instrumentCode: item.instrumentCode!,
            symbol: item.symbol!,
            fullName: item.fullName,
            closingPrice: item.closingPrice,
            closingPercent: toPeerPercent(item.closingPrice, item.priceChange),
            lastPrice: item.lastTradePrice,
            lastPercent: toLastPercent(item.lastTradePrice, item.closingPrice, item.priceChange),
            dayMinPrice: item.dayMinPrice,
            dayMaxPrice: item.dayMaxPrice,
            tradeCount: item.tradeCount,
            tradeVolume: item.tradeVolume,
            tradeValue: item.tradeValue,
        }))
        .sort((left, right) => (right.tradeValue ?? 0) - (left.tradeValue ?? 0));
