import type {TsetmcClosingPriceInfo} from '../symbol-search/types';

export const resolveLivePriceFromClosing = (closing: TsetmcClosingPriceInfo | null | undefined): number | null => {
    if (!closing) return null;

    const lastTradePrice = closing.lastTradePrice;
    if (lastTradePrice !== null && lastTradePrice > 0) {
        return lastTradePrice;
    }

    const closingPrice = closing.closingPrice;
    if (closingPrice !== null && closingPrice > 0) {
        return closingPrice;
    }

    return null;
};

export const resolveLivePricePercentFromClosing = (
    closing: TsetmcClosingPriceInfo | null | undefined
): number | null => {
    if (!closing) return null;

    const previousClose = closing.previousClosingPrice;
    if (previousClose === null || previousClose === 0) return null;

    const livePrice = resolveLivePriceFromClosing(closing);
    if (livePrice === null) return null;

    return ((livePrice - previousClose) / previousClose) * 100;
};
