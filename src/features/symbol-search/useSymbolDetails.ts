import {useCallback, useEffect, useRef, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {
    getTsetmcBestLimits,
    getTsetmcClientType,
    getTsetmcClosingPriceInfo,
    getTsetmcEtfInfo,
    getTsetmcInstrumentInfo,
} from './api';
import {toSymbolDetailsViewModel} from './mappers';
import type {SymbolSearchSuggestion} from './types';
import {detailCache} from './symbolDetailsCache';
import {
    fetchClientTypeRaw,
    fetchCoreRaw,
    fetchDetailSourcesRaw,
    type PollController,
    startPoll,
} from './symbolDetailsFetch';
import {
    emptyRaw,
    isAbortError,
    isLikelyFundSymbol,
    isMarketSymbol,
    type RawDetailsSources,
    type SymbolDetailsState,
    type UseSymbolDetailsOptions,
} from './symbolDetailsTypes';

const toViewModel = (symbol: SymbolSearchSuggestion, raw: RawDetailsSources) =>
    toSymbolDetailsViewModel({
        symbol,
        tsetmcClosing: raw.tsetmcClosing,
        tsetmcInfo: raw.tsetmcInfo,
        tsetmcBestLimits: raw.tsetmcBestLimits,
        tsetmcClientType: raw.tsetmcClientType,
        tsetmcEtf: raw.tsetmcEtf,
    });

export type {UseSymbolDetailsOptions};

export const useSymbolDetails = (
    symbol: SymbolSearchSuggestion | null,
    options?: UseSymbolDetailsOptions
) => {
    const enabled = options?.enabled ?? true;
    const includeClientType = options?.includeClientType ?? true;
    const includeDetailSources = options?.includeDetailSources ?? true;

    const [reloadToken, setReloadToken] = useState(0);
    const requestVersionRef = useRef(0);
    const rawRef = useRef<RawDetailsSources>(emptyRaw());
    const [state, setState] = useState<SymbolDetailsState>({
        data: null,
        loading: false,
        refreshing: false,
        error: null,
    });

    const cacheKey = symbol?.key ?? null;

    const applyRaw = useCallback(
        (patch: Partial<RawDetailsSources>, symbolForView: SymbolSearchSuggestion, requestVersion: number) => {
            if (requestVersionRef.current !== requestVersion) return;

            const nextRaw: RawDetailsSources = {...rawRef.current, ...patch};
            rawRef.current = nextRaw;
            const nextData = toViewModel(symbolForView, nextRaw);
            detailCache.set(symbolForView.key, {raw: nextRaw, data: nextData});

            setState((prev) => ({
                ...prev,
                data: nextData,
                loading: false,
                refreshing: false,
                error: null,
            }));
        },
        []
    );

    const markError = useCallback((requestVersion: number) => {
        if (requestVersionRef.current !== requestVersion) return;
        setState((prev) => ({
            ...prev,
            loading: false,
            refreshing: false,
            error: prev.data ? prev.error : 'دریافت اطلاعات نماد با خطا مواجه شد.',
        }));
    }, []);

    useEffect(() => {
        if (!enabled) return;

        if (!symbol || !cacheKey) {
            rawRef.current = emptyRaw();
            setState({data: null, loading: false, refreshing: false, error: null});
            return;
        }

        const requestVersion = requestVersionRef.current + 1;
        requestVersionRef.current = requestVersion;
        let active = true;
        const isActive = () => active && requestVersionRef.current === requestVersion;

        const cached = detailCache.get(cacheKey) ?? null;
        rawRef.current = cached?.raw ?? emptyRaw();

        setState({
            data: cached?.data ?? null,
            loading: cached === null,
            refreshing: cached !== null,
            error: null,
        });

        const runFetch = async (fetcher: (signal: AbortSignal) => Promise<Partial<RawDetailsSources>>) => {
            const controller = new AbortController();
            try {
                const patch = await fetcher(controller.signal);
                if (!isActive() || controller.signal.aborted) return;
                applyRaw(patch, symbol, requestVersion);
            } catch (error) {
                if (!controller.signal.aborted && !isAbortError(error) && isActive()) {
                    markError(requestVersion);
                }
            }
        };

        void runFetch((signal) => fetchCoreRaw(symbol, signal));

        const polls: PollController[] = [];
        if (symbol.instrumentCode && isMarketSymbol(symbol.type)) {
            const instrumentCode = symbol.instrumentCode;

            polls.push(
                startPoll(
                    appConfig.tsetmcClosingPriceRefreshMs,
                    async (signal) => {
                        const tsetmcClosing = await getTsetmcClosingPriceInfo(instrumentCode, signal).catch(() => null);
                        applyRaw({tsetmcClosing}, symbol, requestVersion);
                    },
                    isActive,
                    isAbortError
                )
            );

            polls.push(
                startPoll(
                    appConfig.tsetmcInstrumentInfoRefreshMs,
                    async (signal) => {
                        const tsetmcInfo = await getTsetmcInstrumentInfo(instrumentCode, signal).catch(() => null);
                        applyRaw({tsetmcInfo}, symbol, requestVersion);
                    },
                    isActive,
                    isAbortError
                )
            );

            polls.push(
                startPoll(
                    appConfig.tsetmcBestLimitsRefreshMs,
                    async (signal) => {
                        const tsetmcBestLimits = await getTsetmcBestLimits(instrumentCode, signal)
                            .then((result) => result.orderBookLevels)
                            .catch(() => null);
                        applyRaw({tsetmcBestLimits}, symbol, requestVersion);
                    },
                    isActive,
                    isAbortError
                )
            );
        }

        return () => {
            active = false;
            polls.forEach((poll) => poll.abort());
        };
    }, [applyRaw, cacheKey, enabled, markError, reloadToken, symbol]);

    useEffect(() => {
        if (!enabled || !includeClientType || !symbol || !cacheKey) return;

        const requestVersion = requestVersionRef.current;
        let active = true;
        const isActive = () => active && requestVersionRef.current === requestVersion;

        const runFetch = async () => {
            const controller = new AbortController();
            try {
                const patch = await fetchClientTypeRaw(symbol, controller.signal);
                if (!isActive() || controller.signal.aborted) return;
                applyRaw(patch, symbol, requestVersion);
            } catch (error) {
                if (!controller.signal.aborted && !isAbortError(error) && isActive()) {
                    markError(requestVersion);
                }
            }
        };

        void runFetch();

        const polls: PollController[] = [];
        if (symbol.instrumentCode && isMarketSymbol(symbol.type)) {
            const instrumentCode = symbol.instrumentCode;
            polls.push(
                startPoll(
                    appConfig.tsetmcClientTypeRefreshMs,
                    async (signal) => {
                        const tsetmcClientType = await getTsetmcClientType(instrumentCode, signal).catch(() => null);
                        applyRaw({tsetmcClientType}, symbol, requestVersion);
                    },
                    isActive,
                    isAbortError
                )
            );
        }

        return () => {
            active = false;
            polls.forEach((poll) => poll.abort());
        };
    }, [applyRaw, cacheKey, enabled, includeClientType, markError, reloadToken, symbol]);

    useEffect(() => {
        if (!enabled || !includeDetailSources || !symbol || !cacheKey || !isLikelyFundSymbol(symbol.name, symbol.type)) {
            return;
        }

        const requestVersion = requestVersionRef.current;
        let active = true;
        const isActive = () => active && requestVersionRef.current === requestVersion;

        const runFetch = async () => {
            const controller = new AbortController();
            try {
                const patch = await fetchDetailSourcesRaw(symbol, controller.signal);
                if (!isActive() || controller.signal.aborted) return;
                applyRaw(patch, symbol, requestVersion);
            } catch (error) {
                if (!controller.signal.aborted && !isAbortError(error) && isActive()) {
                    markError(requestVersion);
                }
            }
        };

        void runFetch();

        const polls: PollController[] = [];
        if (symbol.instrumentCode && isMarketSymbol(symbol.type)) {
            const instrumentCode = symbol.instrumentCode;
            polls.push(
                startPoll(
                    appConfig.tsetmcEtfInfoRefreshMs,
                    async (signal) => {
                        const tsetmcEtf = await getTsetmcEtfInfo(instrumentCode, signal).catch(() => null);
                        applyRaw({tsetmcEtf}, symbol, requestVersion);
                    },
                    isActive,
                    isAbortError
                )
            );
        }

        return () => {
            active = false;
            polls.forEach((poll) => poll.abort());
        };
    }, [applyRaw, cacheKey, enabled, includeDetailSources, markError, reloadToken, symbol]);

    const refresh = useCallback(() => {
        if (!cacheKey) return;
        detailCache.delete(cacheKey);
        rawRef.current = emptyRaw();
        setReloadToken((prev) => prev + 1);
    }, [cacheKey]);

    return {...state, refresh};
};
