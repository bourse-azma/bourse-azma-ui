import {useCallback, useEffect, useRef, useState} from 'react';
import {INFINITE_SCROLL_PAGE_SIZE} from '../../config/scrollConfig';
import {getTsetmcMostVisited} from '../symbol-search/api';
import {toSymbolSuggestionFromMostVisited} from '../symbol-search/mappers';
import type {SymbolSearchSuggestion, TsetmcMostVisitedInstrument} from '../symbol-search/types';
import {MOST_VISITED_MARKET_OPTIONS, type MostVisitedMarketId} from './mostVisitedUtils';

export const MOST_VISITED_PAGE_SIZE = INFINITE_SCROLL_PAGE_SIZE;

export type PopularSymbolItem = {
    rank: number;
    suggestion: SymbolSearchSuggestion;
    instrument: TsetmcMostVisitedInstrument;
};

type UseMostVisitedResult = {
    items: PopularSymbolItem[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    marketId: MostVisitedMarketId;
    setMarketId: (marketId: MostVisitedMarketId) => void;
    loadMore: () => void;
    hasMore: boolean;
};

const mapInstruments = (
    instruments: TsetmcMostVisitedInstrument[],
    marketType: (typeof MOST_VISITED_MARKET_OPTIONS)[number]['type'],
): PopularSymbolItem[] =>
    instruments
        .map((instrument, index) => {
            const suggestion = toSymbolSuggestionFromMostVisited(instrument, marketType);
            if (!suggestion) {
                return null;
            }

            return {
                rank: index + 1,
                suggestion,
                instrument,
            };
        })
        .filter((item): item is PopularSymbolItem => item !== null);

const hasSameStructure = (prev: PopularSymbolItem[], next: PopularSymbolItem[]) =>
    prev.length === next.length
    && prev.every((item, index) => (
        item.suggestion.key === next[index]?.suggestion.key
        && item.rank === next[index]?.rank
    ));

const hasInstrumentChanged = (
    previous: TsetmcMostVisitedInstrument,
    next: TsetmcMostVisitedInstrument,
) =>
    previous.lastTradePrice !== next.lastTradePrice
    || previous.closingPrice !== next.closingPrice
    || previous.priceChange !== next.priceChange
    || previous.previousClosingPrice !== next.previousClosingPrice;

const mergePopularItems = (prev: PopularSymbolItem[], next: PopularSymbolItem[]): PopularSymbolItem[] => {
    if (!hasSameStructure(prev, next)) {
        return next;
    }

    let changed = false;
    const merged = prev.map((item, index) => {
        const nextItem = next[index];
        if (!hasInstrumentChanged(item.instrument, nextItem.instrument)) {
            return item;
        }

        changed = true;
        return {
            ...item,
            instrument: nextItem.instrument,
        };
    });

    return changed ? merged : prev;
};

export const useMostVisited = (enabled: boolean): UseMostVisitedResult => {
    const [marketId, setMarketId] = useState<MostVisitedMarketId>(1);
    const [items, setItems] = useState<PopularSymbolItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const hasItemsRef = useRef(false);
    const limitRef = useRef(MOST_VISITED_PAGE_SIZE);
    const loadingMoreRef = useRef(false);
    const marketIdRef = useRef(marketId);
    const requestEpochRef = useRef(0);
    const marketAbortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        hasItemsRef.current = items.length > 0;
    }, [items.length]);

    useEffect(() => {
        marketIdRef.current = marketId;
    }, [marketId]);

    const applyItems = useCallback((mapped: PopularSymbolItem[], mode: 'initial' | 'background' | 'more') => {
        if (mode === 'background') {
            setItems((prev) => mergePopularItems(prev, mapped));
            return;
        }

        if (mode === 'more') {
            setItems((prev) => {
                if (mapped.length <= prev.length) {
                    return prev;
                }

                const appended = mapped.slice(prev.length).map((item, index) => ({
                    ...item,
                    rank: prev.length + index + 1,
                }));
                return [...prev, ...appended];
            });
            return;
        }

        setItems(mapped);
    }, []);

    const fetchPage = useCallback(async (
        requestedMarketId: MostVisitedMarketId,
        requestedLimit: number,
        mode: 'initial' | 'background' | 'more',
        requestEpoch: number,
        signal?: AbortSignal,
    ) => {
        const market = MOST_VISITED_MARKET_OPTIONS.find((option) => option.id === requestedMarketId)
            ?? MOST_VISITED_MARKET_OPTIONS[0];

        if (mode === 'initial') {
            setLoading(true);
        } else if (mode === 'more') {
            loadingMoreRef.current = true;
            setLoadingMore(true);
        }

        try {
            const result = await getTsetmcMostVisited(requestedMarketId, requestedLimit, signal);
            if (signal?.aborted || requestEpoch !== requestEpochRef.current
                || requestedMarketId !== marketIdRef.current) {
                return false;
            }
            const mapped = mapInstruments(result.mostVisitedInstruments, market.type);

            applyItems(mapped, mode);
            setHasMore(mapped.length >= requestedLimit);
            setError(null);
            return true;
        } catch (loadError: unknown) {
            if (signal?.aborted || requestEpoch !== requestEpochRef.current
                || requestedMarketId !== marketIdRef.current) {
                return false;
            }
            if (mode === 'more') {
                limitRef.current = Math.max(MOST_VISITED_PAGE_SIZE, requestedLimit - MOST_VISITED_PAGE_SIZE);
            } else if (!hasItemsRef.current) {
                setItems([]);
            }

            if (mode !== 'background' || !hasItemsRef.current) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'دریافت نمادهای پرطرفدار ناموفق بود.',
                );
            }

            return false;
        } finally {
            const isCurrentRequest = requestEpoch === requestEpochRef.current
                && requestedMarketId === marketIdRef.current;
            if (mode === 'initial' && isCurrentRequest) {
                setLoading(false);
            } else if (mode === 'more' && isCurrentRequest) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [applyItems]);

    const loadMore = useCallback(() => {
        if (!enabled || loadingMoreRef.current || !hasMore || loading) {
            return;
        }

        const nextLimit = limitRef.current + MOST_VISITED_PAGE_SIZE;
        limitRef.current = nextLimit;
        void fetchPage(
            marketIdRef.current,
            nextLimit,
            'more',
            requestEpochRef.current,
            marketAbortControllerRef.current?.signal,
        );
    }, [enabled, fetchPage, hasMore, loading]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const requestEpoch = ++requestEpochRef.current;
        const controller = new AbortController();
        marketAbortControllerRef.current?.abort();
        marketAbortControllerRef.current = controller;

        limitRef.current = MOST_VISITED_PAGE_SIZE;
        loadingMoreRef.current = false;
        setLoadingMore(false);
        setLoading(true);
        setHasMore(true);
        setItems([]);
        setError(null);

        void fetchPage(marketId, limitRef.current, 'initial', requestEpoch, controller.signal);

        return () => {
            controller.abort();
            if (requestEpochRef.current === requestEpoch) {
                requestEpochRef.current += 1;
            }
        };
    }, [enabled, marketId, fetchPage]);

    return {
        items,
        loading,
        loadingMore,
        error,
        marketId,
        setMarketId,
        loadMore,
        hasMore,
    };
};
