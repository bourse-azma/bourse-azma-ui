import type {SymbolSourceType, TsetmcMostVisitedInstrument} from '../symbol-search/types';
import {toLtrIsolated} from '../../utils/numberFormat';

export type MostVisitedMarketId = 1 | 2;

export const MOST_VISITED_MARKET_OPTIONS: Array<{ id: MostVisitedMarketId; label: string; type: SymbolSourceType }> = [
    {id: 1, label: 'بورس', type: 'TSE'},
    {id: 2, label: 'فرابورس', type: 'IFB'},
];

export const resolveMostVisitedDisplayPrice = (instrument: TsetmcMostVisitedInstrument): number | null => {
    const lastTradePrice = instrument.lastTradePrice;
    if (lastTradePrice !== null && !Number.isNaN(lastTradePrice)) {
        return lastTradePrice;
    }

    const closingPrice = instrument.closingPrice;
    if (closingPrice !== null && !Number.isNaN(closingPrice)) {
        return closingPrice;
    }

    return null;
};

export const resolveMostVisitedChangePercent = (instrument: TsetmcMostVisitedInstrument): number | null => {
    const previousClosingPrice = instrument.previousClosingPrice;
    const displayPrice = resolveMostVisitedDisplayPrice(instrument);

    if (
        previousClosingPrice !== null
        && !Number.isNaN(previousClosingPrice)
        && previousClosingPrice !== 0
        && displayPrice !== null
    ) {
        return ((displayPrice - previousClosingPrice) / previousClosingPrice) * 100;
    }

    const priceChange = instrument.priceChange;
    if (
        priceChange !== null
        && !Number.isNaN(priceChange)
        && previousClosingPrice !== null
        && !Number.isNaN(previousClosingPrice)
        && previousClosingPrice !== 0
    ) {
        return (priceChange / previousClosingPrice) * 100;
    }

    return null;
};

const formatCompactNumber = (value: number, digits: number) =>
    toLtrIsolated(
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(value),
    );

export const formatCompactTradeValue = (value: number | null | undefined): string | null => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return null;
    }

    const absolute = Math.abs(value);
    if (absolute >= 1_000_000_000_000) {
        return `${formatCompactNumber(value / 1_000_000_000_000, 1)} همت`;
    }
    if (absolute >= 1_000_000_000) {
        return `${formatCompactNumber(value / 1_000_000_000, 1)} میلیارد`;
    }
    if (absolute >= 1_000_000) {
        return `${formatCompactNumber(value / 1_000_000, 0)} میلیون`;
    }

    return `${formatCompactNumber(value, 0)} ریال`;
};
