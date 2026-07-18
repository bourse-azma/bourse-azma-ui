import {useEffect, useMemo, useRef, useState} from 'react';
import {getCodalNotices} from '../symbol-search/api';
import {clamp} from '../trading-dashboard/formatters';
import {CODAL_MAX_PAGE_LENGTH, CODAL_NOTICES_PER_PAGE} from './constants';
import {buildCodalNoticeParams, mergeUniqueNotices} from './noticeParams';
import type {CodalNotice, CodalNoticesQuery, CodalNoticesResult} from './types';

export function useCodalNotices(
    query: CodalNoticesQuery,
    options?: {
        enabled?: boolean;
        errorMessage?: string;
        pagesPerLoad?: number;
        batchSize?: number;
    }
) {
    const enabled = options?.enabled ?? true;
    const errorMessage = options?.errorMessage ?? 'دریافت پیام‌های ناظر با خطا مواجه شد.';
    const batchSize = Math.max(1, Math.floor(options?.batchSize ?? 40));
    // Keep fetching API pages until the configured UI batch is full. CODAL's
    // `length` query parameter is a date range and cannot increase its 20-row pages.
    const pagesPerLoad = clamp(
        Math.floor(options?.pagesPerLoad ?? batchSize),
        1,
        batchSize
    );

    const [state, setState] = useState<{
        notices: CodalNotice[];
        totalCount: number;
        page: number;
        loading: boolean;
        loadingMore: boolean;
        refreshing: boolean;
        hasMore: boolean;
        error: string | null;
    }>({
        notices: [],
        totalCount: 0,
        page: 1,
        loading: true,
        loadingMore: false,
        refreshing: false,
        hasMore: true,
        error: null,
    });

    const [pageToLoad, setPageToLoad] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);
    const didInitRef = useRef(false);
    const requestInFlightRef = useRef(false);
    const loadedPageRef = useRef(0);
    const bufferedNoticesRef = useRef<CodalNotice[]>([]);

    const querySignature = useMemo(() => {
        const params = buildCodalNoticeParams({...query, page: 1});
        params.delete('page');
        return params.toString();
    }, [query]);
    const stableQuery = useMemo(() => query, [querySignature]);

    useEffect(() => {
        if (!enabled) {
            setState({
                notices: [],
                totalCount: 0,
                page: 1,
                loading: false,
                loadingMore: false,
                refreshing: false,
                hasMore: false,
                error: null,
            });
            loadedPageRef.current = 0;
            bufferedNoticesRef.current = [];
            setPageToLoad(1);
            return;
        }

        if (!didInitRef.current) {
            didInitRef.current = true;
            return;
        }

        setState((prev) => ({
            ...prev,
            notices: [],
            totalCount: 0,
            page: 1,
            loading: true,
            loadingMore: false,
            refreshing: false,
            hasMore: true,
            error: null,
        }));
        loadedPageRef.current = 0;
        bufferedNoticesRef.current = [];
        setPageToLoad(1);
        setReloadKey((prev) => prev + 1);
    }, [enabled, querySignature]);

    useEffect(() => {
        if (!enabled) return;

        let active = true;
        const controller = new AbortController();
        const isFirstPage = pageToLoad === 1;
        const requestLength = clamp(Math.floor(stableQuery.length), 1, CODAL_MAX_PAGE_LENGTH);
        requestInFlightRef.current = true;

        setState((prev) => ({
            ...prev,
            loading: isFirstPage && prev.notices.length === 0,
            refreshing: isFirstPage && prev.notices.length > 0,
            loadingMore: !isFirstPage,
            error: null,
        }));

        const fetchNotices = async () => {
            try {
                let mergedNotices: CodalNotice[] = [];
                let totalCount = 0;
                let lastLoadedPage = isFirstPage ? 0 : pageToLoad - 1;
                const visibleTarget = isFirstPage ? batchSize : state.notices.length + batchSize;
                const pagesToFetch = pagesPerLoad;

                for (let index = 0; index < pagesToFetch; index += 1) {
                    const requestPage = pageToLoad + index;
                    const requestQuery: CodalNoticesQuery = {
                        ...stableQuery,
                        page: requestPage,
                        length: requestLength,
                    };
                    const queryString = buildCodalNoticeParams(requestQuery).toString();
                    const payload = await getCodalNotices<CodalNoticesResult>(queryString, controller.signal);
                    if (!active) return;

                    const incoming = payload.notices ?? [];
                    totalCount = payload.totalCount ?? totalCount;
                    mergedNotices = mergeUniqueNotices(mergedNotices, incoming);
                    lastLoadedPage = requestPage;

                    const reachedTotal = totalCount > 0 && mergedNotices.length >= totalCount;
                    const pageIncomplete = incoming.length < CODAL_NOTICES_PER_PAGE;
                    const bufferedCount = isFirstPage
                        ? mergedNotices.length
                        : mergeUniqueNotices(bufferedNoticesRef.current, mergedNotices).length;
                    if (reachedTotal || pageIncomplete || bufferedCount >= visibleTarget) break;
                }

                setState((prev) => {
                    const bufferedNotices = isFirstPage
                        ? mergedNotices
                        : mergeUniqueNotices(bufferedNoticesRef.current, mergedNotices);
                    const resolvedTotalCount = totalCount > 0 ? totalCount : prev.totalCount;
                    const visibleTarget = isFirstPage
                        ? batchSize
                        : prev.notices.length + batchSize;
                    const notices = bufferedNotices.slice(0, visibleTarget);
                    const hasMore = resolvedTotalCount > 0
                        ? notices.length < resolvedTotalCount
                        : notices.length < bufferedNotices.length || mergedNotices.length >= requestLength;

                    loadedPageRef.current = lastLoadedPage;
                    bufferedNoticesRef.current = bufferedNotices;

                    return {
                        notices,
                        totalCount: resolvedTotalCount,
                        page: lastLoadedPage,
                        loading: false,
                        loadingMore: false,
                        refreshing: false,
                        hasMore,
                        error: null,
                    };
                });
            } catch {
                if (!active || controller.signal.aborted) return;
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    loadingMore: false,
                    refreshing: false,
                    error: errorMessage,
                }));
            } finally {
                requestInFlightRef.current = false;
            }
        };

        void fetchNotices();

        return () => {
            active = false;
            requestInFlightRef.current = false;
            controller.abort();
        };
    }, [batchSize, enabled, errorMessage, pagesPerLoad, pageToLoad, stableQuery, reloadKey]);

    const loadMore = () => {
        if (requestInFlightRef.current) return;
        if (state.loading || state.loadingMore || state.refreshing || !state.hasMore) return;

        const bufferedNotices = bufferedNoticesRef.current;
        const bufferedRemaining = bufferedNotices.length - state.notices.length;
        const reachedKnownTotal = state.totalCount > 0 && bufferedNotices.length >= state.totalCount;
        if (bufferedRemaining >= batchSize || (bufferedRemaining > 0 && reachedKnownTotal)) {
            setState((prev) => {
                const notices = bufferedNotices.slice(0, prev.notices.length + batchSize);
                return {
                    ...prev,
                    notices,
                    hasMore: prev.totalCount > 0
                        ? notices.length < prev.totalCount
                        : notices.length < bufferedNotices.length,
                };
            });
            return;
        }

        setState((prev) => ({...prev, loadingMore: true}));
        requestInFlightRef.current = true;
        setPageToLoad(loadedPageRef.current + 1);
    };

    const refresh = () => {
        setPageToLoad(1);
        setReloadKey((prev) => prev + 1);
    };

    return {...state, loadMore, refresh};
}
