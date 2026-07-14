import {Fragment, useRef} from 'react';
import {AlertCircle} from 'lucide-react';
import {getInfiniteScrollTriggerIndex} from '../../config/scrollConfig';
import {useCalmVerticalScroll} from '../../hooks/useCalmVerticalScroll';
import {InfiniteScrollSentinel} from '../../hooks/InfiniteScrollSentinel';
import {useInfiniteScrollLoadMore} from '../../hooks/useInfiniteScrollLoadMore';
import type {SymbolSearchSuggestion} from '../symbol-search/types';
import {
    MOST_VISITED_MARKET_OPTIONS,
    type MostVisitedMarketId,
    resolveMostVisitedChangePercent,
    resolveMostVisitedDisplayPrice,
} from './mostVisitedUtils';
import {useMostVisited} from './useMostVisited';

import {
    formatNumberFa,
    formatPercentOrDash as formatPercentOrDashBase,
    ltrNumericClassName,
} from '../../utils/numberFormat';

const formatNumberOrDash = (value: number | null | undefined) =>
    value === null || value === undefined || Number.isNaN(value) ? '—' : formatNumberFa(value);

const formatPercentOrDash = (value: number | null | undefined) =>
    formatPercentOrDashBase(value, 2, '—');

const POPULAR_TABLE_GRID = 'grid grid-cols-[1.5rem_minmax(0,1fr)_3.75rem_3.25rem] items-center gap-x-2 sm:grid-cols-[1.75rem_minmax(0,1fr)_4.5rem_3.75rem]';

type RankBadgeProps = {
    rank: number;
};

const RankBadge = ({rank}: RankBadgeProps) => {
    const baseClass =
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular-nums';

    if (rank === 1) {
        return <span className={`${baseClass} bg-warning/15 text-warning`}>{rank}</span>;
    }

    if (rank === 2) {
        return <span className={`${baseClass} bg-surface-2 text-muted`}>{rank}</span>;
    }

    if (rank === 3) {
        return <span className={`${baseClass} bg-orange-500/12 text-orange-600 dark:text-orange-400`}>{rank}</span>;
    }

    return <span className={`${baseClass} text-muted`}>{rank}</span>;
};

type PopularSymbolsTabContentProps = {
    activeSymbolKey: string | null;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
    fillHeight?: boolean;
};

export default function PopularSymbolsTabContent({
                                                     activeSymbolKey,
                                                     onSelectSymbol,
                                                     fillHeight = false,
                                                 }: PopularSymbolsTabContentProps) {
    const {
        items,
        loading,
        loadingMore,
        error,
        marketId,
        setMarketId,
        loadMore,
        hasMore,
    } = useMostVisited(true);
    const listRef = useRef<HTMLDivElement | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const canPrefetchMore = hasMore && !loading;
    const loadTriggerIndex = getInfiniteScrollTriggerIndex(items.length);

    useCalmVerticalScroll(listRef, {contentLength: items.length});
    useInfiniteScrollLoadMore({
        rootRef: listRef,
        sentinelRef: loadMoreRef,
        enabled: canPrefetchMore,
        isFetching: loadingMore,
        onLoadMore: loadMore,
        itemCount: items.length,
    });

    const handleMarketChange = (nextMarketId: MostVisitedMarketId) => {
        setMarketId(nextMarketId);
    };

    if (loading && items.length === 0) {
        return (
            <div dir="rtl" className="space-y-3">
                <div className="h-10 animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
                <div className="h-9 animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
                <div className="space-y-2">
                    {Array.from({length: 6}).map((_, index) => (
                        <div
                            key={index}
                            className="h-14 animate-pulse rounded-xl border border-border/70 bg-surface-2"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (error && items.length === 0) {
        return (
            <div dir="rtl" className="rounded-xl border border-negative/35 bg-negative/10 p-3 text-xs text-negative">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0"/>
                    <span>{error}</span>
                </div>
                <p className="mt-2 text-[11px] text-negative/80">تلاش مجدد خودکار در حال انجام است...</p>
            </div>
        );
    }

    return (
        <div dir="rtl" className="space-y-3">
            <div className="flex rounded-xl border border-border/70 bg-surface-2 p-1">
                {MOST_VISITED_MARKET_OPTIONS.map((option) => {
                    const isActive = marketId === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleMarketChange(option.id)}
                            className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition ${
                                isActive
                                    ? 'bg-surface text-text shadow-sm ring-1 ring-border/60'
                                    : 'text-muted hover:text-text'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {error ? (
                <div className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-[11px] text-warning">
                    {error}
                </div>
            ) : null}

            <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
                <header
                    className={`${POPULAR_TABLE_GRID} border-b border-border/70 bg-surface-2 px-3 py-2.5 text-[11px] font-semibold text-muted`}
                >
                    <span className="text-center">#</span>
                    <span>نماد</span>
                    <span className="text-center">قیمت</span>
                    <span className="text-center">تغییر</span>
                </header>

                {items.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-8 text-center">
                        <h4 className="text-sm font-semibold text-text">اطلاعاتی برای نمایش وجود ندارد</h4>
                        <p className="mt-1 text-xs leading-5 text-muted">
                            بازار دیگری را انتخاب کنید یا کمی بعد دوباره تلاش کنید.
                        </p>
                    </div>
                ) : (
                    <div
                        ref={listRef}
                        className={`calm-scroll thin-scrollbar ${
                            // The mobile drawer is already the vertical scroll container.
                            // A second, unconstrained overflow container can swallow touch
                            // gestures on iOS/Android without having anywhere to scroll.
                            fillHeight ? 'min-h-[50vh] overflow-visible' : 'max-h-[292px] overflow-y-auto'
                        }`}
                    >
                        {items.map((item, index) => {
                            const isActive = activeSymbolKey === item.suggestion.key;
                            const displayPrice = resolveMostVisitedDisplayPrice(item.instrument);
                            const changePercent = resolveMostVisitedChangePercent(item.instrument);
                            const isPositive = changePercent !== null && changePercent >= 0;

                            return (
                                <Fragment key={item.suggestion.key}>
                                    <button
                                        type="button"
                                        onClick={() => onSelectSymbol(item.suggestion)}
                                        className={`${POPULAR_TABLE_GRID} w-full border-b border-border/60 px-3 py-2 text-xs last:border-b-0 ${
                                            isActive
                                                ? 'bg-primary/8'
                                                : 'hover:bg-surface-2/60'
                                        }`}
                                    >
                                        <div className="flex justify-center">
                                            <RankBadge rank={item.rank}/>
                                        </div>

                                        <div className="min-w-0 text-right">
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate font-semibold leading-5 text-text">
                                                    {item.suggestion.symbol}
                                                </span>
                                                {isActive ? (
                                                    <span
                                                        className="shrink-0 rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-semibold text-primary">
                                                        فعال
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="truncate text-[11px] leading-4 text-muted">
                                                {item.suggestion.name}
                                            </p>
                                        </div>

                                        <span className="text-center tabular-nums text-text">
                                            {formatNumberOrDash(displayPrice)}
                                        </span>

                                        <span
                                            className={`text-center text-[11px] font-semibold ${ltrNumericClassName} ${
                                                changePercent === null
                                                    ? 'text-muted'
                                                    : isPositive
                                                        ? 'text-positive'
                                                        : 'text-negative'
                                            }`}
                                        >
                                            {formatPercentOrDash(changePercent)}
                                        </span>
                                    </button>

                                    {canPrefetchMore && index === loadTriggerIndex ? (
                                        <InfiniteScrollSentinel sentinelRef={loadMoreRef}/>
                                    ) : null}
                                </Fragment>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
