import {useEffect, useRef, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {
    getFipiranInstrumentSnapshot,
    getFundDetails,
    getTsetmcBestLimits,
    getTsetmcClientType,
    getTsetmcClosingPriceInfo,
    getTsetmcInstrumentInfo,
    searchFunds,
} from './api';
import {toSymbolDetailsViewModel} from './mappers';
import type {
    FipiranFundDetails,
    FipiranFundSummary,
    FipiranInstrumentSnapshot,
    SymbolDetailsViewModel,
    SymbolSearchSuggestion,
    TsetmcBestLimitLevel,
    TsetmcClientType,
    TsetmcClosingPriceInfo,
    TsetmcInstrumentInfo,
} from './types';

type SymbolDetailsState = {
    data: SymbolDetailsViewModel | null;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
};

type RawDetailsSources = {
    tsetmcClosing: TsetmcClosingPriceInfo | null;
    tsetmcInfo: TsetmcInstrumentInfo | null;
    tsetmcBestLimits: TsetmcBestLimitLevel[] | null;
    tsetmcClientType: TsetmcClientType | null;
    snapshot: FipiranInstrumentSnapshot | null;
    fundSummary: FipiranFundSummary | null;
    fundDetails: FipiranFundDetails | null;
};

type DetailCacheEntry = {
    raw: RawDetailsSources;
    data: SymbolDetailsViewModel;
};

const detailCache = new Map<string, DetailCacheEntry>();

const emptyRaw = (): RawDetailsSources => ({
    tsetmcClosing: null,
    tsetmcInfo: null,
    tsetmcBestLimits: null,
    tsetmcClientType: null,
    snapshot: null,
    fundSummary: null,
    fundDetails: null,
});

const normalize = (value: string) =>
    value
        .replace('ي', 'ی')
        .replace('ك', 'ک')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';
const isMarketSymbol = (type: string) => type === 'TSE' || type === 'IFB' || type === 'FUND' || type === 'UNKNOWN';

const isLikelyFundSymbol = (symbol: SymbolSearchSuggestion) => {
    if (symbol.type === 'FUND') return true;
    const normalizedName = normalize(symbol.name);
    return normalizedName.includes('صندوق') || normalizedName.includes('etf');
};

const chooseFundSummary = (
    symbol: SymbolSearchSuggestion,
    groups: Array<FipiranFundSummary[]>
): FipiranFundSummary | null => {
    const normalizedSymbol = normalize(symbol.symbol);
    const normalizedName = normalize(symbol.name);

    for (const items of groups) {
        const byInstrumentCode =
            symbol.instrumentCode &&
            items.find((item) => item.instrumentCode && item.instrumentCode === symbol.instrumentCode);
        if (byInstrumentCode) return byInstrumentCode;

        const byExactName = items.find((item) => normalize(item.name) === normalizedName);
        if (byExactName) return byExactName;

        const byContains = items.find((item) => normalize(item.name).includes(normalizedSymbol));
        if (byContains) return byContains;
    }

    return null;
};

const fetchFundSummary = async (
    symbol: SymbolSearchSuggestion,
    signal: AbortSignal
): Promise<FipiranFundSummary | null> => {
    const queries = Array.from(new Set([symbol.name, symbol.symbol].map((item) => item.trim()).filter(Boolean)));
    if (queries.length === 0) return null;

    const results = await Promise.all(
        queries.map(async (query) => {
            try {
                const response = await searchFunds(query, 60, signal);
                return response.funds.items;
            } catch {
                return [] as FipiranFundSummary[];
            }
        })
    );

    return chooseFundSummary(symbol, results);
};

const fetchInitialRaw = async (symbol: SymbolSearchSuggestion, signal: AbortSignal): Promise<RawDetailsSources> => {
    if (!symbol.instrumentCode || !isMarketSymbol(symbol.type)) {
        return emptyRaw();
    }

    const needFund = isLikelyFundSymbol(symbol);

    const [snapshot, tsetmcClosing, tsetmcInfo, tsetmcBestLimits, tsetmcClientType, fundSummary] = await Promise.all([
        getFipiranInstrumentSnapshot(symbol.instrumentCode, signal).catch(() => null),
        getTsetmcClosingPriceInfo(symbol.instrumentCode, signal).catch(() => null),
        getTsetmcInstrumentInfo(symbol.instrumentCode, signal).catch(() => null),
        getTsetmcBestLimits(symbol.instrumentCode, signal)
            .then((result) => result.orderBookLevels)
            .catch(() => null),
        getTsetmcClientType(symbol.instrumentCode, signal).catch(() => null),
        needFund ? fetchFundSummary(symbol, signal).catch(() => null) : Promise.resolve(null),
    ]);

    let fundDetails: FipiranFundDetails | null = null;
    if (needFund && fundSummary?.registrationNumber) {
        fundDetails = await getFundDetails(fundSummary.registrationNumber, signal).catch(() => null);
    }

    return {
        snapshot,
        tsetmcClosing,
        tsetmcInfo,
        tsetmcBestLimits,
        tsetmcClientType,
        fundSummary,
        fundDetails,
    };
};

const toViewModel = (symbol: SymbolSearchSuggestion, raw: RawDetailsSources) =>
    toSymbolDetailsViewModel({
        symbol,
        tsetmcClosing: raw.tsetmcClosing,
        tsetmcInfo: raw.tsetmcInfo,
        tsetmcBestLimits: raw.tsetmcBestLimits,
        tsetmcClientType: raw.tsetmcClientType,
        snapshot: raw.snapshot,
        fundSummary: raw.fundSummary,
        fundDetails: raw.fundDetails,
    });

export const useSymbolDetails = (symbol: SymbolSearchSuggestion | null) => {
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

    useEffect(() => {
        if (!symbol || !cacheKey) {
            rawRef.current = emptyRaw();
            setState({
                data: null,
                loading: false,
                refreshing: false,
                error: null,
            });
            return;
        }

        const requestVersion = requestVersionRef.current + 1;
        requestVersionRef.current = requestVersion;
        let active = true;
        const clearTimeouts: (() => void)[] = [];
        const controllers = new Set<AbortController>();

        const cached = detailCache.get(cacheKey) ?? null;
        if (cached) {
            rawRef.current = cached.raw;
        }

        setState({
            data: cached?.data ?? null,
            loading: cached === null,
            refreshing: cached !== null,
            error: null,
        });

        const applyRaw = (patch: Partial<RawDetailsSources>) => {
            if (!active || requestVersionRef.current !== requestVersion) return;
            const currentRaw = rawRef.current;
            const nextRaw: RawDetailsSources = {...currentRaw, ...patch};
            rawRef.current = nextRaw;
            const nextData = toViewModel(symbol, nextRaw);
            detailCache.set(cacheKey, {raw: nextRaw, data: nextData});
            setState((prev) => ({
                ...prev,
                data: nextData,
                loading: false,
                refreshing: false,
                error: null,
            }));
        };

        const runWithController = async (task: (signal: AbortSignal) => Promise<void>) => {
            const controller = new AbortController();
            controllers.add(controller);
            try {
                await task(controller.signal);
            } catch (error) {
                if (!controller.signal.aborted && !isAbortError(error) && active && requestVersionRef.current === requestVersion) {
                    setState((prev) => ({
                        ...prev,
                        loading: false,
                        refreshing: false,
                        error: prev.data ? prev.error : 'دریافت اطلاعات نماد با خطا مواجه شد.',
                    }));
                }
            } finally {
                controllers.delete(controller);
            }
        };

        const schedule = (ms: number, task: (signal: AbortSignal) => Promise<void>) => {
            let timeoutId: number;
            const tick = async () => {
                if (!active) return;
                let hasError = false;
                await runWithController(async (signal) => {
                    try {
                        await task(signal);
                    } catch (e) {
                        hasError = true;
                        throw e;
                    }
                });
                if (active) {
                    timeoutId = window.setTimeout(tick, hasError ? appConfig.apiErrorRetryMs : ms);
                }
            };
            timeoutId = window.setTimeout(tick, ms);
            clearTimeouts.push(() => window.clearTimeout(timeoutId));
        };

        void runWithController(async (signal) => {
            const initialRaw = await fetchInitialRaw(symbol, signal);
            applyRaw(initialRaw);
        });

        if (symbol.instrumentCode && isMarketSymbol(symbol.type)) {
            schedule(appConfig.tsetmcClosingPriceRefreshMs, async (signal) => {
                const tsetmcClosing = await getTsetmcClosingPriceInfo(symbol.instrumentCode!, signal).catch(() => null);
                applyRaw({tsetmcClosing});
            });

            schedule(appConfig.tsetmcInstrumentInfoRefreshMs, async (signal) => {
                const tsetmcInfo = await getTsetmcInstrumentInfo(symbol.instrumentCode!, signal).catch(() => null);
                applyRaw({tsetmcInfo});
            });

            schedule(appConfig.tsetmcBestLimitsRefreshMs, async (signal) => {
                const tsetmcBestLimits = await getTsetmcBestLimits(symbol.instrumentCode!, signal)
                    .then((result) => result.orderBookLevels)
                    .catch(() => null);
                applyRaw({tsetmcBestLimits});
            });

            schedule(appConfig.tsetmcClientTypeRefreshMs, async (signal) => {
                const tsetmcClientType = await getTsetmcClientType(symbol.instrumentCode!, signal).catch(() => null);
                applyRaw({tsetmcClientType});
            });

            schedule(appConfig.fipiranSnapshotRefreshMs, async (signal) => {
                const snapshot = await getFipiranInstrumentSnapshot(symbol.instrumentCode!, signal).catch(() => null);
                applyRaw({snapshot});
            });

            if (isLikelyFundSymbol(symbol)) {
                schedule(appConfig.fipiranFundSummaryRefreshMs, async (signal) => {
                    const fundSummary = await fetchFundSummary(symbol, signal).catch(() => null);
                    applyRaw({fundSummary});
                });

                schedule(appConfig.fipiranFundDetailsRefreshMs, async (signal) => {
                    const registrationNumber = rawRef.current.fundSummary?.registrationNumber;
                    if (!registrationNumber) return;
                    const fundDetails = await getFundDetails(registrationNumber, signal).catch(() => null);
                    applyRaw({fundDetails});
                });
            }
        }

        return () => {
            active = false;
            clearTimeouts.forEach((clear) => clear());
            controllers.forEach((controller) => controller.abort());
            controllers.clear();
        };
    }, [cacheKey, reloadToken, symbol]);

    const refresh = () => {
        if (!cacheKey) return;
        detailCache.delete(cacheKey);
        rawRef.current = emptyRaw();
        setReloadToken((prev) => prev + 1);
    };

    return {
        ...state,
        refresh,
    };
};
