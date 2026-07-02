import {type Dispatch, Fragment, type SetStateAction, useRef} from 'react';
import {AlertCircle, Loader2, MessageSquare} from 'lucide-react';
import {getInfiniteScrollTriggerIndex} from '../../config/scrollConfig';
import {InfiniteScrollSentinel} from '../../hooks/InfiniteScrollSentinel';
import {useInfiniteScrollLoadMore} from '../../hooks/useInfiniteScrollLoadMore';
import TicketListItem from './TicketListItem';
import {AdminTicketStatsStrip} from './TicketStatsStrip';
import {SUPPORT_CATEGORY_OPTIONS, SUPPORT_PRIORITY_OPTIONS, SUPPORT_STATUS_OPTIONS,} from './supportMeta';
import type {AdminTicketStats} from './supportStats';
import type {
    SupportRequestCategory,
    SupportRequestPriority,
    SupportRequestStatus,
    SupportTicket,
    SupportTicketFilters,
} from './types';

type AdminTicketListViewProps = {
    cardClass: string;
    stats: AdminTicketStats;
    filters: SupportTicketFilters;
    setFilters: Dispatch<SetStateAction<SupportTicketFilters>>;
    error: string | null;
    loading: boolean;
    sortedTickets: SupportTicket[];
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
    onSelectTicket: (ticketId: number) => void;
};

export default function AdminTicketListView({
                                                cardClass,
                                                stats,
                                                filters,
                                                setFilters,
                                                error,
                                                loading,
                                                sortedTickets,
                                                hasMore,
                                                loadingMore,
                                                onLoadMore,
                                                onSelectTicket,
                                            }: AdminTicketListViewProps) {
    const listRef = useRef<HTMLDivElement | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const canPrefetchMore = hasMore && !loading && !error;
    const loadTriggerIndex = getInfiniteScrollTriggerIndex(sortedTickets.length);

    useInfiniteScrollLoadMore({
        rootRef: listRef,
        sentinelRef: loadMoreRef,
        enabled: canPrefetchMore,
        isFetching: loadingMore,
        onLoadMore,
        itemCount: sortedTickets.length,
    });

    return (
        <section dir="rtl" className={`${cardClass} overflow-hidden`}>
            <div className="border-b border-border/50 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-bold text-text">درخواست‌ها</h2>
            </div>

            <AdminTicketStatsStrip stats={stats}/>

            <div className="grid grid-cols-1 gap-2 border-b border-border/50 px-4 py-3 sm:grid-cols-3 sm:px-5">
                <select
                    value={filters.status ?? ''}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            status: (event.target.value || undefined) as SupportRequestStatus | undefined,
                        }))
                    }
                    className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none"
                >
                    <option value="">همه وضعیت‌ها</option>
                    {SUPPORT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <select
                    value={filters.category ?? ''}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            category: (event.target.value || undefined) as SupportRequestCategory | undefined,
                        }))
                    }
                    className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none"
                >
                    <option value="">همه دسته‌ها</option>
                    {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <select
                    value={filters.priority ?? ''}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            priority: (event.target.value || undefined) as SupportRequestPriority | undefined,
                        }))
                    }
                    className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none"
                >
                    <option value="">همه اولویت‌ها</option>
                    {SUPPORT_PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {error ? (
                <div
                    className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative sm:mx-5">
                    <AlertCircle className="h-4 w-4 shrink-0"/>
                    {error}
                </div>
            ) : null}

            <div className="p-4 sm:px-5">
                {loading && sortedTickets.length === 0 ? (
                    <div className="space-y-2">
                        {Array.from({length: 4}, (_, index) => (
                            <div key={index} className="h-20 animate-pulse rounded-xl bg-surface-2"/>
                        ))}
                    </div>
                ) : sortedTickets.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-2/60 px-5 py-12 text-center">
                        <MessageSquare className="h-7 w-7 text-muted"/>
                        <p className="mt-2 text-sm font-semibold text-text">تیکتی یافت نشد</p>
                    </div>
                ) : (
                    <div ref={listRef} className="thin-scrollbar max-h-[620px] space-y-2 overflow-y-auto">
                        {sortedTickets.map((item, index) => (
                            <Fragment key={item.id}>
                                <TicketListItem
                                    ticket={item}
                                    showUser
                                    onClick={() => onSelectTicket(item.id)}
                                />
                                {canPrefetchMore && index === loadTriggerIndex ? (
                                    <InfiniteScrollSentinel sentinelRef={loadMoreRef}/>
                                ) : null}
                            </Fragment>
                        ))}
                        {loadingMore ? (
                            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted">
                                <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                در حال بارگذاری...
                            </div>
                        ) : null}
                        {!hasMore && !loading && sortedTickets.length > 0 ? (
                            <div className="py-2 text-center text-[11px] text-muted">همه تیکت‌ها نمایش داده شد.</div>
                        ) : null}
                    </div>
                )}
            </div>
        </section>
    );
}
