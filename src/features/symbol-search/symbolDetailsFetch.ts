import {
    getTsetmcBestLimits,
    getTsetmcClientType,
    getTsetmcClosingPriceInfo,
    getTsetmcEtfInfo,
    getTsetmcInstrumentInfo,
} from './api';
import type {SymbolSearchSuggestion} from './types';
import type {RawDetailsSources} from './symbolDetailsTypes';
import {isLikelyFundSymbol, isMarketSymbol} from './symbolDetailsTypes';

export const fetchCoreRaw = async (symbol: SymbolSearchSuggestion, signal: AbortSignal): Promise<Partial<RawDetailsSources>> => {
    if (!symbol.instrumentCode || !isMarketSymbol(symbol.type)) {
        return {};
    }

    const instrumentCode = symbol.instrumentCode;
    const [tsetmcClosing, tsetmcInfo, tsetmcBestLimits] = await Promise.all([
        getTsetmcClosingPriceInfo(instrumentCode, signal).catch(() => null),
        getTsetmcInstrumentInfo(instrumentCode, signal).catch(() => null),
        getTsetmcBestLimits(instrumentCode, signal)
            .then((result) => result.orderBookLevels)
            .catch(() => null),
    ]);

    return {tsetmcClosing, tsetmcInfo, tsetmcBestLimits};
};

export const fetchClientTypeRaw = async (
    symbol: SymbolSearchSuggestion,
    signal: AbortSignal
): Promise<Partial<RawDetailsSources>> => {
    if (!symbol.instrumentCode || !isMarketSymbol(symbol.type)) {
        return {};
    }

    const tsetmcClientType = await getTsetmcClientType(symbol.instrumentCode, signal).catch(() => null);
    return {tsetmcClientType};
};

export const fetchDetailSourcesRaw = async (
    symbol: SymbolSearchSuggestion,
    signal: AbortSignal
): Promise<Partial<RawDetailsSources>> => {
    if (!symbol.instrumentCode || !isMarketSymbol(symbol.type) || !isLikelyFundSymbol(symbol.name, symbol.type)) {
        return {};
    }

    const tsetmcEtf = await getTsetmcEtfInfo(symbol.instrumentCode, signal).catch(() => null);
    return {tsetmcEtf};
};
