import {useEffect, useMemo, useRef, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {getCodalNotices} from '../symbol-search/api';
import {clamp} from '../trading-dashboard/formatters';
import {CODAL_MAX_PAGE_LENGTH} from './constants';
import {buildCodalNoticeParams, mergeUniqueNotices} from './noticeParams';
import type {CodalNotice, CodalNoticesQuery, CodalNoticesResult} from './types';

export function useCodalNotices(
    query: CodalNoticesQuery,
    options?: {
        enabled?: boolean;
        autoRefresh?: boolean;
        errorMessage?: string;
        pagesPerLoad?: number;
    }
) {
    const enabled = options?.enabled ?? true;
    const autoRefresh = options?.autoRefresh ?? true;
    const errorMessage = options?.errorMessage ?? 'دریافت پیام‌های ناظر با خطا مواجه شد.';
    const pagesPerLoad = clamp(Math.floor(options?.pagesPerLoad ?? 1), 1, 4);

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

    const querySignature = useMemo(() => {
        const params = buildCodalNoticeParams({...query, page: 1});
        params.delete('page');
        return params.toString();
    }, [query]);

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
            setPageToLoad(1);
            loadedPageRef.current = 0;
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
        setPageToLoad(1);
        setReloadKey((prev) => prev + 1);
    }, [enabled, querySignature]);

    useEffect(() => {
        if (!enabled) return;

        let active = true;
        const controller = new AbortController();
        const isFirstPage = pageToLoad === 1;
        const requestLength = clamp(Math.floor(query.length), 1, CODAL_MAX_PAGE_LENGTH);
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
                const pagesToFetch = isFirstPage ? 1 : pagesPerLoad;

                for (let index = 0; index < pagesToFetch; index += 1) {
                    const requestPage = isFirstPage ? 1 : pageToLoad + index;
                    const requestQuery: CodalNoticesQuery = {
                        ...query,
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
                    const pageIncomplete = incoming.length < requestLength;
                    if (reachedTotal || pageIncomplete) break;
                }

                setState((prev) => {
                    const notices = isFirstPage
                        ? mergedNotices
                        : mergeUniqueNotices(prev.notices, mergedNotices);
                    const resolvedTotalCount = totalCount > 0 ? totalCount : prev.totalCount;
                    const hasMore =
                        resolvedTotalCount > 0
                            ? notices.length < resolvedTotalCount
                            : mergedNotices.length >= requestLength;

                    loadedPageRef.current = lastLoadedPage;

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
    }, [enabled, errorMessage, pagesPerLoad, pageToLoad, query, reloadKey]);

    const loadMore = () => {
        if (requestInFlightRef.current) return;
        if (state.loading || state.loadingMore || state.refreshing || !state.hasMore) return;
        setState((prev) => ({...prev, loadingMore: true}));
        requestInFlightRef.current = true;
        setPageToLoad(loadedPageRef.current + 1);
    };

    const refresh = () => {
        setPageToLoad(1);
        setReloadKey((prev) => prev + 1);
    };

    useEffect(() => {
        if (!enabled || !autoRefresh) return;

        let timer: number;
        let active = true;
        const tick = () => {
            if (!active) return;
            if (requestInFlightRef.current) {
                timer = window.setTimeout(tick, 1000);
                return;
            }
            setPageToLoad(1);
            setReloadKey((prev) => prev + 1);
            timer = window.setTimeout(tick, state.error ? appConfig.apiErrorRetryMs : appConfig.codalNoticesRefreshMs);
        };
        timer = window.setTimeout(tick, state.error ? appConfig.apiErrorRetryMs : appConfig.codalNoticesRefreshMs);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [autoRefresh, enabled, querySignature, state.error]);

    return {...state, loadMore, refresh};
}
