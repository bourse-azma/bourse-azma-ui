import {appConfig} from '../../config/appConfig';
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

export type PollController = {
    abort: () => void;
};

export const startPoll = (
    intervalMs: number,
    task: (signal: AbortSignal) => Promise<void>,
    isActive: () => boolean,
    isAbortError: (error: unknown) => boolean
): PollController => {
    const controllers = new Set<AbortController>();
    const clearTimeouts: (() => void)[] = [];
    let timeoutId: number;

    const runWithController = async () => {
        const controller = new AbortController();
        controllers.add(controller);
        let hasError = false;

        try {
            await task(controller.signal);
        } catch (error) {
            if (!controller.signal.aborted && !isAbortError(error)) {
                hasError = true;
            }
        } finally {
            controllers.delete(controller);
        }

        return hasError;
    };

    const tick = async () => {
        if (!isActive()) return;
        const hasError = await runWithController();
        if (!isActive()) return;
        timeoutId = window.setTimeout(tick, hasError ? appConfig.apiErrorRetryMs : intervalMs);
    };

    timeoutId = window.setTimeout(tick, intervalMs);
    clearTimeouts.push(() => window.clearTimeout(timeoutId));

    return {
        abort: () => {
            clearTimeouts.forEach((clear) => clear());
            controllers.forEach((controller) => controller.abort());
            controllers.clear();
        },
    };
};
