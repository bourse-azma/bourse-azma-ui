import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {appConfig} from '../../../config/appConfig';
import {getInfiniteScrollTriggerIndex} from '../../../config/scrollConfig';
import {useCalmVerticalScroll} from '../../../hooks/useCalmVerticalScroll';
import {useInfiniteScrollLoadMore} from '../../../hooks/useInfiniteScrollLoadMore';
import {
    createDefaultNoticeFilters,
    type JalaliDateParts,
    type NoticeUiFilters,
    toAppliedNoticeFilters,
    toNoticeQuery,
    withNoticeSymbol,
} from '../../notices/filterState';
import {CODAL_MAX_LENGTH, DEFAULT_CODAL_NOTICE_QUERY} from '../../notices/constants';
import {useCodalNotices} from '../../notices/useCodalNotices';
import type {CodalNoticesQuery, NoticeGroup} from '../../notices/types';
import {useSymbolSearch} from '../../symbol-search/useSymbolSearch';
import type {SymbolSearchSuggestion} from '../../symbol-search/types';
import {dateKeyFromParts, parseNumberish, stripHtml} from '../jalaliNoticeUtils';
import {collectNoticeYearOptions, earliestNoticeDateKey, groupCodalNotices} from '../noticeGrouping';
import type {SymbolTab} from '../types';

type UseNoticeBoardStateParams = {
    isMarketViewActive: boolean;
    selectedSymbol: SymbolSearchSuggestion;
    symbolTab: SymbolTab;
};

export function useNoticeBoardState({
                                        isMarketViewActive,
                                        selectedSymbol,
                                        symbolTab,
                                    }: UseNoticeBoardStateParams) {
    const [codalQuery, setCodalQuery] = useState<CodalNoticesQuery>(() => ({
        ...DEFAULT_CODAL_NOTICE_QUERY,
        symbol: '',
    }));
    const [noticeFilters, setNoticeFilters] = useState<NoticeUiFilters>(() => createDefaultNoticeFilters());
    const [noticeFilterDraft, setNoticeFilterDraft] = useState<NoticeUiFilters>(() => createDefaultNoticeFilters());
    const [noticeFilterOpen, setNoticeFilterOpen] = useState(false);
    const [noticeSymbolDropdownOpen, setNoticeSymbolDropdownOpen] = useState(false);
    const [activeNoticeGroup, setActiveNoticeGroup] = useState<NoticeGroup | null>(null);

    const boardNotices = useCodalNotices(codalQuery, {
        enabled: isMarketViewActive,
        batchSize: appConfig.supervisorNoticesBatchSize,
    });

    const noticeSymbolQuery = noticeFilterDraft.symbol.trim();
    const noticeSymbolSearch = useSymbolSearch(noticeSymbolQuery, noticeFilterOpen && noticeSymbolDropdownOpen);

    const noticeListRef = useRef<HTMLDivElement | null>(null);
    const noticeLoadMoreRef = useRef<HTMLDivElement | null>(null);
    const symbolNoticeListRef = useRef<HTMLDivElement | null>(null);
    const symbolNoticeLoadMoreRef = useRef<HTMLDivElement | null>(null);

    const codalSymbol = selectedSymbol.symbol.trim();
    const symbolCodalQuery = useMemo<CodalNoticesQuery>(
        () => ({...DEFAULT_CODAL_NOTICE_QUERY, symbol: codalSymbol, length: CODAL_MAX_LENGTH}),
        [codalSymbol]
    );
    const symbolNoticesEnabled = codalSymbol !== '' && isMarketViewActive && symbolTab === 'notices';
    const symbolNotices = useCodalNotices(symbolCodalQuery, {
        enabled: symbolNoticesEnabled,
        errorMessage: 'دریافت اطلاعیه‌های نماد با خطا مواجه شد.',
        batchSize: appConfig.symbolNoticesBatchSize,
    });

    const noticeYearOptions = useMemo(
        () => collectNoticeYearOptions(boardNotices.notices),
        [boardNotices.notices]
    );
    const dayOptions = useMemo(() => Array.from({length: 31}, (_, index) => index + 1), []);
    const groupedNotices = useMemo(
        () => groupCodalNotices(boardNotices.notices, noticeFilters),
        [boardNotices.notices, noticeFilters]
    );
    const hasActiveNoticeFilters = useMemo(
        () =>
            noticeFilters.symbol.trim() !== '' ||
            noticeFilters.fromDate !== null ||
            noticeFilters.toDate !== null ||
            noticeFilters.underSupervisionOnly,
        [noticeFilters]
    );
    const earliestLoadedDateKey = useMemo(
        () => earliestNoticeDateKey(boardNotices.notices),
        [boardNotices.notices]
    );
    const fromDateKey = useMemo(
        () => (noticeFilters.fromDate ? dateKeyFromParts(noticeFilters.fromDate) : null),
        [noticeFilters.fromDate]
    );
    const canPrefetchMoreNotices = useMemo(() => {
        if (boardNotices.error || !boardNotices.hasMore) return false;
        if (boardNotices.loading || boardNotices.refreshing) return false;
        if (fromDateKey !== null && earliestLoadedDateKey !== null && earliestLoadedDateKey < fromDateKey) {
            return false;
        }
        return true;
    }, [boardNotices, earliestLoadedDateKey, fromDateKey]);

    const activeNoticeDetails = useMemo(() => {
        if (!activeNoticeGroup) return null;
        const primary = activeNoticeGroup.notices[0];
        const additionalInfo = activeNoticeGroup.notices
            .map((notice) => stripHtml(notice.supervision?.additionalInfo ?? ''))
            .filter((text) => text !== '')
            .join('\n');
        const reasons = Array.from(
            new Set(
                activeNoticeGroup.notices
                    .flatMap((notice) => notice.supervision?.reasons ?? [])
                    .map((reason) => reason.trim())
                    .filter((reason) => reason !== '')
            )
        );
        return {primary, additionalInfo, reasons};
    }, [activeNoticeGroup]);

    const openNoticeFilter = useCallback(() => {
        setNoticeFilterDraft(noticeFilters);
        setNoticeSymbolDropdownOpen(false);
        setNoticeFilterOpen(true);
    }, [noticeFilters]);

    const updateDraftDatePart = useCallback((
        field: 'fromDate' | 'toDate',
        part: keyof JalaliDateParts,
        rawValue: string
    ) => {
        setNoticeFilterDraft((prev) => {
            if (rawValue === '') return {...prev, [field]: null};
            const parsed = parseNumberish(rawValue);
            if (!Number.isFinite(parsed)) return prev;
            const fallbackYear = noticeYearOptions[0] ?? 1404;
            const currentDate = prev[field] ?? {year: fallbackYear, month: 1, day: 1};
            return {...prev, [field]: {...currentDate, [part]: parsed}};
        });
    }, [noticeYearOptions]);

    const applyNoticeFilters = useCallback((draft: NoticeUiFilters, options?: { closeModal?: boolean }) => {
        const nextFilters = toAppliedNoticeFilters(draft);
        setNoticeFilters(nextFilters);
        setCodalQuery((prev) => toNoticeQuery(prev, nextFilters));
        if (options?.closeModal ?? true) setNoticeFilterOpen(false);
        setNoticeSymbolDropdownOpen(false);
    }, []);

    const clearNoticeFilters = useCallback(() => {
        const cleared = createDefaultNoticeFilters();
        setNoticeFilterDraft(cleared);
        setNoticeFilters(cleared);
        setCodalQuery((prev) => toNoticeQuery(prev, cleared));
        setNoticeSymbolDropdownOpen(false);
    }, []);

    const applyNoticeSymbolSuggestion = useCallback((symbol: string) => {
        const nextDraft = withNoticeSymbol(noticeFilterDraft, symbol);
        setNoticeFilterDraft(nextDraft);
        applyNoticeFilters(nextDraft);
    }, [applyNoticeFilters, noticeFilterDraft]);

    const canPrefetchMoreSymbolNotices = useMemo(() => {
        if (symbolNotices.error || !symbolNotices.hasMore) return false;
        if (symbolNotices.loading || symbolNotices.refreshing) return false;
        return symbolTab === 'notices';
    }, [symbolNotices, symbolTab]);

    const isWaitingForSymbolNoticeResults =
        symbolNotices.loading || symbolNotices.loadingMore || symbolNotices.refreshing;

    const symbolNoticeLoadTriggerIndex = getInfiniteScrollTriggerIndex(symbolNotices.notices.length);
    const noticeLoadTriggerIndex = getInfiniteScrollTriggerIndex(groupedNotices.length);

    useCalmVerticalScroll(symbolNoticeListRef, {contentLength: symbolNotices.notices.length});
    useCalmVerticalScroll(noticeListRef, {contentLength: groupedNotices.length});
    useInfiniteScrollLoadMore({
        rootRef: symbolNoticeListRef,
        sentinelRef: symbolNoticeLoadMoreRef,
        enabled: canPrefetchMoreSymbolNotices,
        isFetching: symbolNotices.loadingMore,
        onLoadMore: symbolNotices.loadMore,
        itemCount: symbolNotices.notices.length,
    });
    useInfiniteScrollLoadMore({
        rootRef: noticeListRef,
        sentinelRef: noticeLoadMoreRef,
        enabled: canPrefetchMoreNotices,
        isFetching: boardNotices.loadingMore,
        onLoadMore: boardNotices.loadMore,
        itemCount: groupedNotices.length,
    });

    useEffect(() => {
        if (!noticeFilterOpen) setNoticeSymbolDropdownOpen(false);
    }, [noticeFilterOpen]);

    return {
        codalNotices: boardNotices.notices,
        codalNoticesTotalCount: boardNotices.totalCount,
        codalNoticesLoading: boardNotices.loading,
        codalNoticesLoadingMore: boardNotices.loadingMore,
        codalNoticesRefreshing: boardNotices.refreshing,
        codalNoticesHasMore: boardNotices.hasMore,
        codalNoticesError: boardNotices.error,
        refreshCodalNotices: boardNotices.refresh,
        groupedNotices,
        hasActiveNoticeFilters,
        canPrefetchMoreNotices,
        noticeListRef,
        noticeLoadMoreRef,
        noticeLoadTriggerIndex,
        activeNoticeGroup,
        setActiveNoticeGroup,
        activeNoticeDetails,
        openNoticeFilter,
        noticeFilterOpen,
        setNoticeFilterOpen,
        noticeFilterDraft,
        setNoticeFilterDraft,
        noticeSymbolDropdownOpen,
        setNoticeSymbolDropdownOpen,
        noticeSymbolLoading: noticeSymbolSearch.loading,
        noticeSymbolError: noticeSymbolSearch.error,
        noticeSymbolResults: noticeSymbolSearch.results,
        retryNoticeSymbolSearch: noticeSymbolSearch.retry,
        noticeYearOptions,
        dayOptions,
        updateDraftDatePart,
        applyNoticeFilters,
        clearNoticeFilters,
        applyNoticeSymbolSuggestion,
        symbolCodalNotices: symbolNotices.notices,
        symbolCodalNoticesTotalCount: symbolNotices.totalCount,
        symbolCodalNoticesLoading: symbolNotices.loading,
        symbolCodalNoticesLoadingMore: symbolNotices.loadingMore,
        symbolCodalNoticesRefreshing: symbolNotices.refreshing,
        symbolCodalNoticesHasMore: symbolNotices.hasMore,
        symbolCodalNoticesError: symbolNotices.error,
        refreshSymbolCodalNotices: symbolNotices.refresh,
        symbolNoticeListRef,
        symbolNoticeLoadMoreRef,
        canPrefetchMoreSymbolNotices,
        isWaitingForSymbolNoticeResults,
        symbolNoticeLoadTriggerIndex,
        codalSymbolUrl: codalSymbol
            ? `https://codal.ir/ReportList.aspx?search&Symbol=${encodeURIComponent(codalSymbol)}&LetterType=-1&AuditorRef=-1&PageNumber=1&Audited&NotAudited&IsNotAudited=false&Childs&Mains&Publisher=false&CompanyState=-1&ReportingType=-1&Category=-1&CompanyType=-1&Consolidatable&NotConsolidatable`
            : null,
    };
}
