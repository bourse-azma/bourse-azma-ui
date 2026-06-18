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
