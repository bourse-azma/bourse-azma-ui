import {Fragment} from 'react';
import {AlertCircle, Filter, Loader2} from 'lucide-react';
import {InfiniteScrollSentinel} from '../../../hooks/InfiniteScrollSentinel';
import {formatDateTimeFa} from '../../../utils/formatDateTime';
import {cardClass} from '../styles';
import {formatFaInteger} from '../formatters';
import {formatNumberFa} from '../../../utils/numberFormat';
import type {TradingDashboardVm} from './types';

export function SupervisorNoticesPanel({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            <section dir="rtl" className={`${cardClass} p-3 xl:col-span-4`}>
                <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">پیام‌های ناظر</h3>
                        <span
                            className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-muted">
                  {formatNumberFa(vm.groupedNotices.length)}
                </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {vm.codalNoticesRefreshing ?
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted"/> : null}
                        <button
                            type="button"
                            onClick={vm.openNoticeFilter}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-surface-2 text-muted transition hover:text-text focus-visible:ring-2 focus-visible:ring-primary/45 ${
                                vm.hasActiveNoticeFilters ? 'border-primary/45 text-primary' : 'border-border/80'
                            }`}
                            aria-label="open notice filters"
                        >
                            <Filter className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                <div ref={vm.noticeListRef}
                     className="calm-scroll thin-scrollbar h-[324px] space-y-2 overflow-y-auto pl-1">
                    {(vm.codalNoticesLoading || (vm.groupedNotices.length === 0 && vm.canPrefetchMoreNotices)) &&
                    vm.groupedNotices.length === 0 ? (
                        Array.from({length: 4}, (_, index) => (
                            <div
                                key={`notice-skeleton-${index + 1}`}
                                className="animate-pulse rounded-xl border border-border/70 bg-surface px-3 py-3"
                            >
                                <div className="mb-2 h-4 w-4/5 rounded bg-border/60"/>
                                <div className="mb-3 h-4 w-3/5 rounded bg-border/60"/>
                                <div className="h-3 w-2/5 rounded bg-border/45"/>
                            </div>
                        ))
                    ) : null}

                    {vm.codalNoticesError ? (
                        <div
                            className="rounded-xl border border-negative/30 bg-negative/10 p-3 text-xs text-negative">
                            <div className="mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4"/>
                                {vm.codalNoticesError}
                            </div>
                            <button
                                type="button"
                                onClick={vm.refreshCodalNotices}
                                className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                            >
                                تلاش مجدد
                            </button>
                        </div>
                    ) : null}

                    {!vm.codalNoticesLoading &&
                    !vm.codalNoticesLoadingMore &&
                    !vm.canPrefetchMoreNotices &&
                    !vm.codalNoticesHasMore &&
                    vm.groupedNotices.length === 0 &&
                    !vm.codalNoticesError ? (
                        <div
                            className="rounded-xl border border-dashed border-border/70 bg-surface-2 px-3 py-6 text-center text-xs text-muted">
                            موردی با فیلتر فعلی پیدا نشد.
                        </div>
                    ) : null}

                    {vm.groupedNotices.map((group, index) => {
                        const visibleSymbols = group.symbols.slice(0, 4);
                        const extraSymbolsCount = group.symbols.length - visibleSymbols.length;

                        return (
                            <Fragment key={group.id}>
                                <article
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => vm.setActiveNoticeGroup(group)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            vm.setActiveNoticeGroup(group);
                                        }
                                    }}
                                    className="cursor-pointer rounded-xl border border-border/70 bg-surface px-3 py-2.5 transition hover:border-primary/30 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary/45"
                                >
                                    <h4 className="text-sm leading-7 font-semibold text-text">{group.title}</h4>

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        {visibleSymbols.map((symbol) => (
                                            <span
                                                key={`${group.id}-${symbol}`}
                                                className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted"
                                            >
                          {symbol}
                        </span>
                                        ))}

                                        {extraSymbolsCount > 0 ? (
                                            <span
                                                className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted">
                          + {formatFaInteger(extraSymbolsCount)}
                        </span>
                                        ) : null}

                                        {group.hasUnderSupervision ? (
                                            <span
                                                className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] text-warning">
                          تحت نظارت
                        </span>
                                        ) : null}
                                    </div>

                                    <p className="mt-2 text-[11px] tabular-nums text-muted"
                                       dir="ltr">{formatDateTimeFa(group.publishDateTime)}</p>
                                </article>

                                {vm.canPrefetchMoreNotices && index === vm.noticeLoadTriggerIndex ? (
                                    <InfiniteScrollSentinel sentinelRef={vm.noticeLoadMoreRef}/>
                                ) : null}
                            </Fragment>
                        );
                    })}

                    {!vm.codalNoticesHasMore &&
                    !vm.codalNoticesLoading &&
                    !vm.codalNoticesLoadingMore &&
                    vm.groupedNotices.length > 0 ? (
                        <div className="py-1 text-center text-[11px] text-muted">همه پیام‌ها نمایش داده
                            شد.</div>
                    ) : null}
                </div>

                <div className="mt-2 flex h-5 items-center justify-between px-1 text-[11px] text-muted">
                    <span>تعداد کل: {formatNumberFa(vm.codalNoticesTotalCount)}</span>
                    <span>نمایش داده شده: {formatNumberFa(vm.groupedNotices.length)}</span>
                </div>
            </section>
        </>
    );
}
