import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {
    getInstrumentEffects,
    getLatestCodalNotices,
    getMarketOverview,
    getMostVisitedQuotes,
    getSelectedIndexes,
    getSymbolSparkline,
} from './api';
import type {
    CodalLatestNotice,
    InstrumentEffect,
    MarketOverview,
    MarketSymbolQuote,
    SelectedIndex,
    SparklinePoint,
} from './types';
import {sortByChangePercent, toMarketSymbolQuote} from './utils';

export type LandingMarketData = {
    bourseOverview: MarketOverview | null;
    farabourseOverview: MarketOverview | null;
    bourseIndexes: SelectedIndex[];
    farabourseIndexes: SelectedIndex[];
    bourseEffects: InstrumentEffect[];
    farabourseEffects: InstrumentEffect[];
    popularSymbols: MarketSymbolQuote[];
    gainers: MarketSymbolQuote[];
    losers: MarketSymbolQuote[];
    codalNotices: CodalLatestNotice[];
    sparklines: Record<string, SparklinePoint[]>;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
};

const MARKET_LIMIT = 40;
const EFFECT_LIMIT = 8;
const NOTICE_LIMIT = 10;
const SPARKLINE_SYMBOL_COUNT = 5;

export type LandingTickerItem = {
    instrumentCode: string;
    symbol: string;
    price: number;
    changePercent: number;
};

const buildPopularSymbols = (
    bourseQuotes: MarketSymbolQuote[],
    farabourseQuotes: MarketSymbolQuote[],
): MarketSymbolQuote[] => {
    const merged = [...bourseQuotes, ...farabourseQuotes];
    return merged.sort((left, right) => right.changePercent - left.changePercent);
};

const emptyData = (): LandingMarketData => ({
    bourseOverview: null,
    farabourseOverview: null,
    bourseIndexes: [],
    farabourseIndexes: [],
    bourseEffects: [],
    farabourseEffects: [],
    popularSymbols: [],
    gainers: [],
    losers: [],
    codalNotices: [],
    sparklines: {},
    loading: true,
    error: null,
    lastUpdated: null,
});

export const useLandingMarketData = (enabled = true): LandingMarketData => {
    const [data, setData] = useState<LandingMarketData>(emptyData);
    const hasDataRef = useRef(false);
    const isFirstLoadRef = useRef(true);
    const sparklinesLoadedRef = useRef(false);

    const loadSparklines = useCallback(async (symbols: MarketSymbolQuote[], signal: AbortSignal) => {
        const targets = symbols.slice(0, SPARKLINE_SYMBOL_COUNT);
        const entries = await Promise.all(
            targets.map(async (symbol) => {
                try {
                    const points = await getSymbolSparkline(symbol.instrumentCode, signal);
                    return [symbol.instrumentCode, points] as const;
                } catch {
                    return [symbol.instrumentCode, []] as const;
                }
            }),
        );

        return Object.fromEntries(entries);
    }, []);

    const fetchTseCore = useCallback(async (signal: AbortSignal) => {
        const [
            bourseOverview,
            farabourseOverview,
            bourseMostVisited,
            farabourseMostVisited,
        ] = await Promise.all([
            getMarketOverview(1, signal),
            getMarketOverview(2, signal),
            getMostVisitedQuotes(1, MARKET_LIMIT, signal),
            getMostVisitedQuotes(2, MARKET_LIMIT, signal),
        ]);

        const bourseQuotes = bourseMostVisited.mostVisitedInstruments
            .map((item) => toMarketSymbolQuote(item, 1))
            .filter((item): item is MarketSymbolQuote => item !== null);
        const farabourseQuotes = farabourseMostVisited.mostVisitedInstruments
            .map((item) => toMarketSymbolQuote(item, 2))
            .filter((item): item is MarketSymbolQuote => item !== null);

        const allQuotes = [...bourseQuotes, ...farabourseQuotes];
        const popularSymbols = buildPopularSymbols(bourseQuotes, farabourseQuotes);

        return {
            bourseOverview,
            farabourseOverview,
            popularSymbols,
            gainers: sortByChangePercent(allQuotes, 'gainers').slice(0, 40),
            losers: sortByChangePercent(allQuotes, 'losers').slice(0, 40),
        };
    }, []);

    const fetchTseDetails = useCallback(async (signal: AbortSignal) => {
        const [
            bourseIndexes,
            farabourseIndexes,
            bourseEffects,
            farabourseEffects,
        ] = await Promise.all([
            getSelectedIndexes(1, signal),
            getSelectedIndexes(2, signal),
            getInstrumentEffects(1, EFFECT_LIMIT, signal),
            getInstrumentEffects(2, EFFECT_LIMIT, signal),
        ]);

        return {bourseIndexes, farabourseIndexes, bourseEffects, farabourseEffects};
    }, []);

    const fetchCodal = useCallback(async (signal: AbortSignal) => {
        return getLatestCodalNotices(NOTICE_LIMIT, signal);
    }, []);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let active = true;
        let tseTimeoutId: number | undefined;
        let codalTimeoutId: number | undefined;
        const controller = new AbortController();

        const applyTseUpdate = (partial: Partial<LandingMarketData>) => {
            if (!active) return;
            hasDataRef.current = true;
            setData((prev) => ({
                ...prev,
                ...partial,
                loading: false,
                error: null,
                lastUpdated: new Date(),
            }));
        };

        const loadSparklinesInBackground = async (symbols: MarketSymbolQuote[]) => {
            if (sparklinesLoadedRef.current || symbols.length === 0) return;
            try {
                const sparklines = await loadSparklines(symbols, controller.signal);
                if (!active) return;
                sparklinesLoadedRef.current = true;
                setData((prev) => ({...prev, sparklines}));
            } catch {
                // Sparklines are non-critical; keep existing data.
            }
        };

        const runTse = async () => {
            try {
                const core = await fetchTseCore(controller.signal);
                if (!active) return;

                const isFirstLoad = isFirstLoadRef.current;
                applyTseUpdate(core);
                void loadSparklinesInBackground(core.popularSymbols);

                if (isFirstLoad) {
                    isFirstLoadRef.current = false;
                    const details = await fetchTseDetails(controller.signal);
                    if (!active) return;
                    applyTseUpdate(details);
                } else {
                    void fetchTseDetails(controller.signal).then((details) => {
                        if (!active) return;
                        applyTseUpdate(details);
                    });
                }
            } catch (loadError) {
                if (!active) return;

                const message = loadError instanceof Error
                    ? loadError.message
                    : 'دریافت اطلاعات بازار ناموفق بود.';

                setData((prev) => ({
                    ...prev,
                    loading: false,
                    error: hasDataRef.current ? prev.error : message,
                }));
            } finally {
                if (!active) return;
                tseTimeoutId = window.setTimeout(
                    () => void runTse(),
                    hasDataRef.current ? appConfig.landingMarketRefreshMs : appConfig.apiErrorRetryMs,
                );
            }
        };

        const runCodal = async () => {
            try {
                const codalNotices = await fetchCodal(controller.signal);
                if (!active) return;
                setData((prev) => ({...prev, codalNotices}));
            } catch {
                // Codal is non-critical on landing; keep existing notices.
            } finally {
                if (!active) return;
                codalTimeoutId = window.setTimeout(
                    () => void runCodal(),
                    appConfig.landingCodalRefreshMs,
                );
            }
        };

        void runTse();
        void runCodal();

        return () => {
            active = false;
            controller.abort();
            if (tseTimeoutId !== undefined) {
                window.clearTimeout(tseTimeoutId);
            }
            if (codalTimeoutId !== undefined) {
                window.clearTimeout(codalTimeoutId);
            }
        };
    }, [enabled, fetchTseCore, fetchTseDetails, fetchCodal, loadSparklines]);

    return useMemo(() => data, [data]);
};

export const buildTickerItems = (data: LandingMarketData): LandingTickerItem[] =>
    data.popularSymbols.filter((symbol) => symbol.marketId === 1).slice(0, 25)
        .concat(data.popularSymbols.filter((symbol) => symbol.marketId === 2).slice(0, 15))
        .map((symbol) => ({
            instrumentCode: symbol.instrumentCode,
            symbol: symbol.symbol,
            price: symbol.price,
            changePercent: symbol.changePercent,
        }));
