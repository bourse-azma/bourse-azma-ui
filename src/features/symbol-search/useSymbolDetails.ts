import {useCallback, useEffect, useRef, useState} from 'react';
import {toSymbolDetailsViewModel} from './mappers';
import type {SymbolSearchSuggestion} from './types';
import {detailCache} from './symbolDetailsCache';
import {fetchClientTypeRaw, fetchCoreRaw, fetchDetailSourcesRaw,} from './symbolDetailsFetch';
import {
    emptyRaw,
    isAbortError,
    isLikelyFundSymbol,
    isMarketSymbol,
    type RawDetailsSources,
    type SymbolDetailsState,
    type UseSymbolDetailsOptions,
} from './symbolDetailsTypes';
import {type MarketDataUpdate, marketTopic} from '../../services/realtimeTypes';
import {webSocketService} from '../../services/webSocketService';

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
    const accessToken = options?.accessToken?.trim() ?? '';
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
        let marketUpdateReceived = false;
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
                const fetchedPatch = await fetcher(controller.signal);
                if (!isActive() || controller.signal.aborted) return;
                const patch = marketUpdateReceived
                    ? {
                        ...fetchedPatch,
                        tsetmcClosing: rawRef.current.tsetmcClosing,
                        tsetmcBestLimits: rawRef.current.tsetmcBestLimits,
                        tsetmcClientType: rawRef.current.tsetmcClientType,
                    }
                    : fetchedPatch;
                applyRaw(patch, symbol, requestVersion);
            } catch (error) {
                if (!controller.signal.aborted && !isAbortError(error) && isActive()) {
                    markError(requestVersion);
                }
            }
        };

        void runFetch((signal) => fetchCoreRaw(symbol, signal));

        let unsubscribeMarket: (() => void) | undefined;
        if (symbol.instrumentCode && isMarketSymbol(symbol.type)) {
            const instrumentCode = symbol.instrumentCode;
            unsubscribeMarket = webSocketService.subscribeJson<MarketDataUpdate>(
                accessToken,
                marketTopic(instrumentCode),
                (update) => {
                    if (!isActive() || update.instrumentCode !== instrumentCode) return;
                    marketUpdateReceived = true;
                    applyRaw({
                        tsetmcClosing: update.closingPrice ?? rawRef.current.tsetmcClosing,
                        tsetmcBestLimits: update.bestLimits ?? rawRef.current.tsetmcBestLimits,
                        tsetmcClientType: update.clientType ?? rawRef.current.tsetmcClientType,
                    }, symbol, requestVersion);
                },
                {onReconnect: () => setReloadToken((current) => current + 1)}
            );
        }

        return () => {
            active = false;
            unsubscribeMarket?.();
        };
    }, [accessToken, applyRaw, cacheKey, enabled, markError, reloadToken, symbol]);

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

        return () => {
            active = false;
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

        return () => {
            active = false;
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
