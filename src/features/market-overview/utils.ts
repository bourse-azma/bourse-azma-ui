import type {TsetmcMostVisitedInstrument as ApiInstrument} from '../symbol-search/types';
import type {MarketSymbolQuote} from './types';

export const computeChangePercent = (
    priceChange: number | null | undefined,
    previousClosingPrice: number | null | undefined,
): number => {
    if (
        priceChange === null
        || priceChange === undefined
        || previousClosingPrice === null
        || previousClosingPrice === undefined
        || previousClosingPrice === 0
        || Number.isNaN(priceChange)
        || Number.isNaN(previousClosingPrice)
    ) {
        return 0;
    }

    return (priceChange / previousClosingPrice) * 100;
};

export const toMarketSymbolQuote = (
    instrument: ApiInstrument,
    marketId: 1 | 2,
): MarketSymbolQuote | null => {
    const instrumentCode = instrument.instrumentCode?.trim();
    const symbol = instrument.symbol?.trim();
    if (!instrumentCode || !symbol) {
        return null;
    }

    const price = instrument.lastTradePrice ?? instrument.closingPrice ?? 0;
    const priceChange = instrument.priceChange ?? 0;

    return {
        instrumentCode,
        symbol,
        fullName: instrument.fullName?.trim() || symbol,
        price,
        priceChange,
        changePercent: computeChangePercent(instrument.priceChange, instrument.previousClosingPrice),
        marketId,
    };
};

export const sortByChangePercent = (
    quotes: MarketSymbolQuote[],
    direction: 'gainers' | 'losers',
): MarketSymbolQuote[] =>
    [...quotes].sort((left, right) =>
        direction === 'gainers'
            ? right.changePercent - left.changePercent
            : left.changePercent - right.changePercent,
    );

export const buildSparklinePath = (points: { value: number }[], width: number, height: number): string => {
    if (points.length < 2) {
        return '';
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return points
        .map((point, index) => {
            const x = (index / (points.length - 1)) * width;
            const y = height - ((point.value - min) / range) * (height - 4) - 2;
            return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
};
