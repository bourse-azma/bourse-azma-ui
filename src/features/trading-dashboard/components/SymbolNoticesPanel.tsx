import {Fragment} from 'react';
import {AlertCircle, Loader2} from 'lucide-react';
import {InfiniteScrollSentinel} from '../../../hooks/InfiniteScrollSentinel';
import SymbolDetailsPanel from '../../symbol-search/SymbolDetailsPanel';
import {formatDateTimeFa} from '../../../utils/formatDateTime';
import {formatNumberFa} from '../../../utils/numberFormat';
import {toSingleNoticeGroup} from '../../notices/noticeParams';
import {formatFaInteger, formatNumberOrDash, formatNumberWithUnit, formatPercentOrDash} from '../formatters';
import type {TradingDashboardVm} from './types';

export function SymbolNoticesPanel({vm}: { vm: TradingDashboardVm }) {
    return (
        <div
            className={`mt-3 rounded-2xl border border-border/70 bg-surface-2 p-3 ${vm.symbolTab === 'notices' ? 'flex min-h-[280px] flex-col' : ''}`}>
            {vm.symbolTab === 'notices' ? (
                <div className="flex flex-1 flex-col">
                    <div ref={vm.symbolNoticeListRef}
                         className="calm-scroll thin-scrollbar max-h-[280px] space-y-2 overflow-y-auto pl-1">
                        {(vm.isWaitingForSymbolNoticeResults ||
                            (vm.symbolCodalNotices.length === 0 && vm.canPrefetchMoreSymbolNotices)) &&
                        vm.symbolCodalNotices.length === 0
                            ? Array.from({length: 4}, (_, index) => (
                                <div key={`symbol-codal-skeleton-${index + 1}`}
                                     className="animate-pulse rounded-xl border border-border/70 bg-surface px-3 py-3">
                                    <div className="mb-2 h-4 w-4/5 rounded bg-border/60"/>
                                    <div className="mb-3 h-4 w-3/5 rounded bg-border/60"/>
                                    <div className="h-3 w-2/5 rounded bg-border/45"/>
                                </div>
                            ))
                            : null}

                        {vm.symbolCodalNoticesError ? (
                            <div
                                className="rounded-xl border border-negative/30 bg-negative/10 p-3 text-xs text-negative">
                                <div className="mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4"/>
                                    {vm.symbolCodalNoticesError}
                                </div>
                                <button
                                    type="button"
                                    onClick={vm.refreshSymbolCodalNotices}
                                    className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                                >
                                    تلاش مجدد
                                </button>
                            </div>
                        ) : null}

                        {!vm.isWaitingForSymbolNoticeResults &&
                        !vm.canPrefetchMoreSymbolNotices &&
                        !vm.symbolCodalNoticesHasMore &&
                        vm.symbolCodalNotices.length === 0 &&
                        !vm.symbolCodalNoticesError ? (
                            <div
                                className="rounded-xl border border-dashed border-border/70 bg-surface-2 px-3 py-6 text-center text-xs text-muted">
                                اطلاعیه‌ای برای این نماد پیدا نشد.
                            </div>
                        ) : null}

                        {vm.symbolCodalNotices.map((notice, index) => {
                            const noticeGroup = toSingleNoticeGroup(notice);
                            const visibleSymbols = noticeGroup.symbols.slice(0, 3);
                            const extraSymbolsCount = noticeGroup.symbols.length - visibleSymbols.length;

                            return (
                                <Fragment key={noticeGroup.id}>
                                    <article
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => vm.setActiveNoticeGroup(noticeGroup)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                vm.setActiveNoticeGroup(noticeGroup);
                                            }
                                        }}
                                        className="cursor-pointer rounded-xl border border-border/70 bg-surface px-3 py-2.5 transition hover:border-primary/30 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary/45"
                                    >
                                        <h4 className="text-sm leading-7 font-semibold text-text">{noticeGroup.title}</h4>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                            {visibleSymbols.map((symbol) => (
                                                <span key={`${noticeGroup.id}-${symbol}`}
                                                      className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted">
                                                    {symbol}
                                                </span>
                                            ))}
                                            {extraSymbolsCount > 0 ? (
                                                <span
                                                    className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted">
                                                    + {formatFaInteger(extraSymbolsCount)}
                                                </span>
                                            ) : null}
                                            {noticeGroup.hasUnderSupervision ? (
                                                <span
                                                    className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] text-warning">
                                                    تحت نظارت
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 text-[11px] tabular-nums text-muted" dir="ltr">
                                            {formatDateTimeFa(noticeGroup.publishDateTime)}
                                        </p>
                                    </article>
                                    {vm.canPrefetchMoreSymbolNotices && index === vm.symbolNoticeLoadTriggerIndex ? (
                                        <InfiniteScrollSentinel sentinelRef={vm.symbolNoticeLoadMoreRef}/>
                                    ) : null}
                                </Fragment>
                            );
                        })}

                        {!vm.symbolCodalNoticesHasMore &&
                        !vm.symbolCodalNoticesLoading &&
                        !vm.symbolCodalNoticesLoadingMore &&
                        vm.symbolCodalNotices.length > 0 ? (
                            <div className="py-1 text-center text-[11px] text-muted">همه اطلاعیه‌ها نمایش داده شد.</div>
                        ) : null}
                    </div>

                    <div className="mt-2 flex h-5 items-center justify-between px-1 text-[11px] text-muted">
                        <span className="flex items-center gap-1.5">
                            {vm.symbolCodalNoticesRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : null}
                            <span>تعداد کل: {formatNumberFa(vm.symbolCodalNoticesTotalCount)}</span>
                        </span>
                        <span>نمایش داده شده: {formatNumberFa(vm.symbolCodalNotices.length)}</span>
                    </div>
                </div>
            ) : (
                <SymbolDetailsPanel
                    rows={vm.symbolDetails}
                    loading={vm.symbolLoading}
                    error={vm.symbolError}
                    hasSymbolData={vm.activeSymbolData !== null}
                    onRetry={vm.refreshSymbolDetails}
                    formatNumber={(value, digits) => formatNumberOrDash(value, digits)}
                    formatPercent={(value, digits) => formatPercentOrDash(value, digits)}
                    formatCurrency={(value) => formatNumberWithUnit(value, 'ریال')}
                />
            )}
        </div>
    );
}
