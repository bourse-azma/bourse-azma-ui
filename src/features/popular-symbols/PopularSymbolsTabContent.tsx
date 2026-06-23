import {useEffect, useMemo, useRef, useState} from 'react';
import {AlertCircle, Loader2, Search} from 'lucide-react';
import type {SymbolSearchSuggestion} from '../symbol-search/types';
import {
    MOST_VISITED_MARKET_OPTIONS,
    type MostVisitedMarketId,
    resolveMostVisitedChangePercent,
    resolveMostVisitedDisplayPrice,
} from './mostVisitedUtils';
import {useMostVisited} from './useMostVisited';

const toLtrIsolated = (value: string) => `\u2066${value}\u2069`;

const formatNumberFa = (value: number, digits = 0) =>
    toLtrIsolated(
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(value),
    );

const formatPercentFa = (value: number, digits = 2) => {
    const sign = value > 0 ? '+' : '';
    return toLtrIsolated(
        `${sign}${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(value)}%`,
    );
};

const formatNumberOrDash = (value: number | null | undefined) =>
    value === null || value === undefined || Number.isNaN(value) ? '—' : formatNumberFa(value);

const formatPercentOrDash = (value: number | null | undefined) =>
    value === null || value === undefined || Number.isNaN(value) ? '—' : formatPercentFa(value);

const POPULAR_TABLE_GRID = 'grid grid-cols-[1.75rem_minmax(0,1fr)_4.5rem_3.75rem] items-center gap-x-2';

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
};

export default function PopularSymbolsTabContent({
                                                     activeSymbolKey,
                                                     onSelectSymbol,
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
    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef<HTMLDivElement | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const filteredItems = useMemo(() => {
        const normalized = searchQuery.trim().toLowerCase();
        if (!normalized) {
            return items;
        }

        return items.filter(
            (item) =>
                item.suggestion.symbol.toLowerCase().includes(normalized)
                || item.suggestion.name.toLowerCase().includes(normalized),
        );
    }, [items, searchQuery]);

    const shouldLoadMore = hasMore && !loading && !loadingMore && searchQuery.trim() === '';

    useEffect(() => {
        const root = listRef.current;
        const sentinel = loadMoreRef.current;
        if (!root || !sentinel || !shouldLoadMore) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    loadMore();
                });
            },
            {
                root,
                rootMargin: '80px 0px 80px 0px',
                threshold: 0.1,
            },
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [loadMore, shouldLoadMore, filteredItems.length]);

    const handleMarketChange = (nextMarketId: MostVisitedMarketId) => {
        setMarketId(nextMarketId);
        setSearchQuery('');
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

            <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="جستجو در پرطرفدارها..."
                    className="h-10 w-full rounded-xl border border-border/80 bg-surface px-3 pr-9 text-xs text-text outline-none transition placeholder:text-muted focus:border-primary/35"
                />
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

                {filteredItems.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-8 text-center">
                        <div
                            className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-surface-2 text-muted">
                            <Search className="h-5 w-5"/>
                        </div>
                        <h4 className="text-sm font-semibold text-text">نمادی یافت نشد</h4>
                        <p className="mt-1 text-xs leading-5 text-muted">
                            عبارت جستجو را تغییر دهید یا بازار دیگری را انتخاب کنید.
                        </p>
                    </div>
                ) : (
                    <div ref={listRef} className="thin-scrollbar max-h-[292px] overflow-y-auto">
                        {filteredItems.map((item) => {
                            const isActive = activeSymbolKey === item.suggestion.key;
                            const displayPrice = resolveMostVisitedDisplayPrice(item.instrument);
                            const changePercent = resolveMostVisitedChangePercent(item.instrument);
                            const isPositive = changePercent !== null && changePercent >= 0;

                            return (
                                <button
                                    key={item.suggestion.key}
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
                                        className={`text-center text-[11px] font-semibold tabular-nums ${
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
                            );
                        })}

                        {shouldLoadMore ? (
                            <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true"/>
                        ) : null}

                        {loadingMore ? (
                            <div
                                className="flex items-center justify-center gap-2 border-t border-border/60 py-3 text-[11px] text-muted">
                                <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                در حال بارگذاری...
                            </div>
                        ) : null}
                    </div>
                )}
            </section>
        </div>
    );
}
