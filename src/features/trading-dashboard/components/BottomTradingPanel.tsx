import {Fragment, useRef} from 'react';
import {AlertCircle, FileText, Loader2, Pencil, Wallet, X} from 'lucide-react';
import {getInfiniteScrollTriggerIndex} from '../../../config/scrollConfig';
import {InfiniteScrollSentinel} from '../../../hooks/InfiniteScrollSentinel';
import {useInfiniteScrollLoadMore} from '../../../hooks/useInfiniteScrollLoadMore';
import {formatNumberFa, ltrNumericClassName} from '../../../utils/numberFormat';
import {cardClass} from '../styles';
import {formatNumberOrDash, formatNumberWithUnit, formatPercentOrDash} from '../formatters';
import type {TradingDashboardVm} from './types';

export function BottomTradingPanel({vm}: { vm: TradingDashboardVm }) {
    const ordersListRef = useRef<HTMLDivElement | null>(null);
    const ordersLoadMoreRef = useRef<HTMLDivElement | null>(null);
    const canPrefetchMoreOrders =
        vm.bottomPanelTab === 'orders' &&
        vm.ordersHasMore &&
        !vm.tradingAccountLoading &&
        !vm.tradingAccountError;
    const ordersLoadTriggerIndex = getInfiniteScrollTriggerIndex(vm.filteredOrders.length);
    const openSymbol = (symbol: string, instrumentCode: string) => {
        vm.openTradingSymbol(symbol, instrumentCode);
    };

    useInfiniteScrollLoadMore({
        rootRef: ordersListRef,
        sentinelRef: ordersLoadMoreRef,
        enabled: canPrefetchMoreOrders,
        isFetching: vm.ordersLoadingMore,
        onLoadMore: () => void vm.loadMoreOrders(),
        itemCount: vm.filteredOrders.length,
    });

    return (
        <>
            <section id="trading-orders-panel" dir="rtl" className={`${cardClass} scroll-mt-32 p-3 xl:col-span-8`}>
                <div
                    className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div
                        className="inline-flex rounded-xl border border-border/80 bg-surface-2 p-1 text-xs">
                        {vm.bottomPanelTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => vm.setBottomPanelTab(tab.key)}
                                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 font-semibold transition ${
                                    vm.bottomPanelTab === tab.key
                                        ? 'bg-surface text-text shadow-sm'
                                        : 'text-muted hover:text-text'
                                }`}
                            >
                                {tab.key === 'orders' ? <FileText className="h-3.5 w-3.5"/> :
                                    <Wallet className="h-3.5 w-3.5"/>}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {vm.bottomPanelTab === 'orders' ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {vm.orderFilters.map((chip) => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => vm.setOrderFilter(chip.key)}
                                    className={`rounded-full border px-3 py-1 text-[11px] transition ${
                                        vm.orderFilter === chip.key
                                            ? 'border-primary/40 bg-primary/15 text-primary'
                                            : 'border-border/80 bg-surface-2 text-muted hover:text-text'
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[11px] text-muted">
                                    <span className="rounded-full border border-border/70 bg-surface-2 px-2.5 py-1">
                                        تعداد دارایی‌ها {formatNumberFa(vm.demoPortfolioRows.length)}
                                    </span>
                            <span
                                className="rounded-full border border-positive/25 bg-positive/10 px-2.5 py-1 text-positive">
                                        ارزش خالص {formatNumberFa(
                                vm.demoPortfolioRows.reduce(
                                    (sum, row) => sum + row.quantity * (row.livePrice ?? row.buyPrice),
                                    0
                                )
                            )} ریال
                                    </span>
                        </div>
                    )}
                </div>

                <div
                    ref={ordersListRef}
                    className="thin-scrollbar max-h-[360px] min-h-[255px] overflow-auto rounded-2xl border border-border/70 bg-surface-2/70">
                    {vm.tradingAccountLoading ? (
                        <div
                            className="flex min-h-[255px] items-center justify-center gap-2 text-xs text-muted">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            در حال دریافت اطلاعات معاملاتی...
                        </div>
                    ) : vm.tradingAccountError ? (
                        <div
                            className="flex min-h-[255px] flex-col items-center justify-center gap-3 px-4 text-center text-xs text-negative">
                            <AlertCircle className="h-5 w-5"/>
                            {vm.tradingAccountError}
                        </div>
                    ) : vm.bottomPanelTab === 'orders' && vm.filteredOrders.length === 0 ? (
                        <div
                            className="flex min-h-[255px] items-center justify-center px-4 text-center text-xs text-muted">
                            سفارشی با فیلتر فعلی پیدا نشد.
                        </div>
                    ) : vm.bottomPanelTab === 'portfolio' && vm.demoPortfolioRows.length === 0 ? (
                        <div
                            className="flex min-h-[255px] items-center justify-center px-4 text-center text-xs text-muted">
                            سبد سهام شما خالی است.
                        </div>
                    ) : vm.bottomPanelTab === 'orders' ? (
                        <>
                            <div className="space-y-2 p-2 md:hidden">
                                {vm.filteredOrders.map((order, index) => {
                                    const isBuy = order.type === 'buy';
                                    const statusClass =
                                        order.status === 'COMPLETED'
                                            ? 'border-positive/35 bg-positive/10 text-positive'
                                            : order.status === 'FAILED'
                                                ? 'border-negative/35 bg-negative/10 text-negative'
                                                : order.status === 'CANCELLED'
                                                    ? 'border-warning/35 bg-warning/10 text-warning'
                                                    : order.status === 'PARTIALLY_FILLED'
                                                        ? 'border-amber-400/35 bg-amber-400/10 text-amber-600 dark:text-amber-400'
                                                        : 'border-primary/35 bg-primary/10 text-primary';
                                    const isCancelling = vm.cancellingOrderId === order.id;

                                    return (
                                        <Fragment key={order.id}>
                                            <div
                                                onClick={() => openSymbol(order.symbol, order.instrumentCode)}
                                                className="cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-surface transition hover:border-primary/35">
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center justify-between gap-2 border-b border-border/60 bg-surface-2/55 px-3 py-2.5 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-text">{order.symbol}</span>
                                                        <span
                                                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                                                isBuy
                                                                    ? 'border-positive/35 bg-positive/10 text-positive'
                                                                    : 'border-negative/35 bg-negative/10 text-negative'
                                                            }`}
                                                        >
                                                            {isBuy ? 'خرید' : 'فروش'}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}
                                                    >
                                                        {order.statusLabel}
                                                    </span>
                                                </button>
                                                <div className="divide-y divide-border/50 px-3 text-[11px]">
                                                    <div className="flex items-center justify-between gap-3 py-2">
                                                        <span className="text-muted">تعداد سفارش</span>
                                                        <span
                                                            className="font-semibold tabular-nums text-text">{formatNumberFa(order.quantity)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3 py-2">
                                                        <span className="text-muted">قیمت سفارش</span>
                                                        <span
                                                            className="font-semibold tabular-nums text-text">{formatNumberFa(order.orderPrice)}
                                                            <small
                                                                className="font-normal text-muted">ریال</small></span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3 py-2">
                                                        <span className="text-muted">اجرا شده</span>
                                                        <span
                                                            className="font-semibold tabular-nums text-text">{formatNumberFa(order.executedQuantity)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3 py-2">
                                                        <span className="text-muted">زمان ثبت</span>
                                                        <span className="font-medium tabular-nums text-muted"
                                                              dir="ltr">{order.time}</span>
                                                    </div>
                                                </div>
                                                {order.cancellable ? (
                                                    <div className="mx-3 mb-3 mt-1 grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={isCancelling}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                vm.openEditOrder(order.id);
                                                            }}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Pencil className="h-3 w-3"/>
                                                            ویرایش
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isCancelling}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                if (confirm('آیا از لغو این سفارش اطمینان دارید؟')) {
                                                                    void vm.handleCancelOrder(order.id);
                                                                }
                                                            }}
                                                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-negative/40 bg-negative/10 px-2.5 py-1.5 text-[11px] font-semibold text-negative transition hover:bg-negative/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isCancelling ?
                                                                <Loader2 className="h-3 w-3 animate-spin"/> :
                                                                <X className="h-3 w-3"/>}
                                                            لغو سفارش
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                            {canPrefetchMoreOrders && index === ordersLoadTriggerIndex ? (
                                                <InfiniteScrollSentinel sentinelRef={ordersLoadMoreRef}/>
                                            ) : null}
                                        </Fragment>
                                    );
                                })}
                            </div>

                            <table className="hidden w-full min-w-[1020px] border-collapse text-right text-xs md:table">
                                <thead>
                                <tr className="border-b border-border/70 bg-surface text-[11px] font-semibold text-muted">
                                    <th className="px-3 py-3">نوع</th>
                                    <th className="px-3 py-3">نماد</th>
                                    <th className="px-3 py-3">تعداد کل</th>
                                    <th className="px-3 py-3">اجرا شده</th>
                                    <th className="px-3 py-3">باقیمانده</th>
                                    <th className="px-3 py-3">قیمت سفارش</th>
                                    <th className="px-3 py-3">میانگین اجرا</th>
                                    <th className="px-3 py-3">زمان</th>
                                    <th className="px-3 py-3">وضعیت</th>
                                    <th className="px-3 py-3">عملیات</th>
                                </tr>
                                </thead>
                                <tbody>
                                {vm.filteredOrders.map((order, index) => {
                                    const isBuy = order.type === 'buy';
                                    const statusClass =
                                        order.status === 'COMPLETED'
                                            ? 'border-positive/35 bg-positive/10 text-positive'
                                            : order.status === 'FAILED'
                                                ? 'border-negative/35 bg-negative/10 text-negative'
                                                : order.status === 'CANCELLED'
                                                    ? 'border-warning/35 bg-warning/10 text-warning'
                                                    : order.status === 'PARTIALLY_FILLED'
                                                        ? 'border-amber-400/35 bg-amber-400/10 text-amber-600 dark:text-amber-400'
                                                        : 'border-primary/35 bg-primary/10 text-primary';
                                    const isCancelling = vm.cancellingOrderId === order.id;

                                    return (
                                        <Fragment key={order.id}>
                                            <tr
                                                onClick={() => openSymbol(order.symbol, order.instrumentCode)}
                                                className="cursor-pointer border-b border-border/50 bg-surface/35 transition last:border-b-0 hover:bg-surface"
                                            >
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex min-w-14 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                                                            isBuy
                                                                ? 'border-positive/35 bg-positive/10 text-positive'
                                                                : 'border-negative/35 bg-negative/10 text-negative'
                                                        }`}
                                                    >
                                                        {isBuy ? 'خرید' : 'فروش'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 font-bold text-text">
                                                    <button
                                                        type="button"
                                                        className="rounded text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                                                    >
                                                        {order.symbol}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.quantity)}</td>
                                                <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.executedQuantity)}</td>
                                                <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.remainingQuantity)}</td>
                                                <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.orderPrice)}</td>
                                                <td className="px-3 py-3 tabular-nums text-text">{order.averageExecutedPrice ? formatNumberFa(order.averageExecutedPrice) : '—'}</td>
                                                <td className="px-3 py-3 tabular-nums text-muted"
                                                    dir="ltr">{order.time}</td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>
                                                        {order.statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {order.cancellable ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={isCancelling}
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    vm.openEditOrder(order.id);
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Pencil className="h-3 w-3"/>
                                                                ویرایش
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isCancelling}
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    if (confirm('آیا از لغو این سفارش اطمینان دارید؟')) {
                                                                        void vm.handleCancelOrder(order.id);
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-negative/40 bg-negative/10 px-2.5 py-1 text-[11px] font-semibold text-negative transition hover:bg-negative/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isCancelling ?
                                                                    <Loader2 className="h-3 w-3 animate-spin"/> :
                                                                    <X className="h-3 w-3"/>}
                                                                لغو
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-muted">—</span>
                                                    )}
                                                </td>
                                            </tr>

                                            {canPrefetchMoreOrders && index === ordersLoadTriggerIndex ? (
                                                <tr aria-hidden="true">
                                                    <td colSpan={10} className="p-0">
                                                        <InfiniteScrollSentinel sentinelRef={ordersLoadMoreRef}/>
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </Fragment>
                                    );
                                })}
                                </tbody>
                            </table>
                            {vm.ordersLoadingMore ? (
                                <div
                                    className="flex items-center justify-center gap-2 border-t border-border/60 px-3 py-3 text-xs text-muted">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                    در حال بارگذاری...
                                </div>
                            ) : null}
                            {!vm.ordersHasMore && !vm.tradingAccountLoading && vm.filteredOrders.length > 0 ? (
                                <div className="border-t border-border/60 py-2 text-center text-[11px] text-muted">
                                    همه سفارش‌ها نمایش داده شد.
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <div className="space-y-2 p-2 md:hidden">
                                {vm.demoPortfolioRows.map((row) => {
                                    const livePrice = row.livePrice ?? row.buyPrice;
                                    const netValue = row.quantity * livePrice;
                                    const gainPercent = row.buyPrice > 0 ? ((livePrice - row.buyPrice) / row.buyPrice) * 100 : null;

                                    return (
                                        <button
                                            key={row.id}
                                            type="button"
                                            onClick={() => openSymbol(row.symbol, row.instrumentCode)}
                                            className="w-full rounded-xl border border-border/70 bg-surface p-3 text-right transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <span className="font-bold text-text">{row.symbol}</span>
                                                <span
                                                    className={`text-[11px] font-semibold ${ltrNumericClassName} ${
                                                        gainPercent === null
                                                            ? 'text-muted'
                                                            : gainPercent >= 0
                                                                ? 'text-positive'
                                                                : 'text-negative'
                                                    }`}
                                                >
                                                    {formatPercentOrDash(gainPercent)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                                                <div>
                                                    <span className="text-muted">تعداد</span>
                                                    <p className="font-semibold tabular-nums text-text">{formatNumberFa(row.quantity)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted">قیمت لحظه‌ای</span>
                                                    <p className="font-semibold tabular-nums text-text">{formatNumberOrDash(row.livePrice)}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-muted">ارزش خالص</span>
                                                    <p className="font-bold tabular-nums text-text">{formatNumberWithUnit(netValue, 'ریال')}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <table className="hidden w-full min-w-[760px] border-collapse text-right text-xs md:table">
                                <thead>
                                <tr className="border-b border-border/70 bg-surface text-[11px] font-semibold text-muted">
                                    <th className="px-3 py-3">نماد</th>
                                    <th className="px-3 py-3">زمان</th>
                                    <th className="px-3 py-3">تعداد</th>
                                    <th className="px-3 py-3">قیمت خرید</th>
                                    <th className="px-3 py-3">قیمت لحظه‌ای</th>
                                    <th className="px-3 py-3">ارزش خالص</th>
                                </tr>
                                </thead>
                                <tbody>
                                {vm.demoPortfolioRows.map((row) => {
                                    const livePrice = row.livePrice ?? row.buyPrice;
                                    const netValue = row.quantity * livePrice;
                                    const gainPercent = row.buyPrice > 0 ? ((livePrice - row.buyPrice) / row.buyPrice) * 100 : null;

                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => openSymbol(row.symbol, row.instrumentCode)}
                                            className="cursor-pointer border-b border-border/50 bg-surface/35 transition last:border-b-0 hover:bg-surface"
                                        >
                                            <td className="px-3 py-3 font-bold text-text">
                                                <button
                                                    type="button"
                                                    className="rounded text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                                                >
                                                    {row.symbol}
                                                </button>
                                            </td>
                                            <td className="px-3 py-3 tabular-nums text-muted"
                                                dir="ltr">{row.time}</td>
                                            <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(row.quantity)}</td>
                                            <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(row.buyPrice)}</td>
                                            <td className="px-3 py-3 tabular-nums text-text">{formatNumberOrDash(row.livePrice)}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-col gap-1">
                                                                <span
                                                                    className="font-bold tabular-nums text-text">{formatNumberWithUnit(netValue, 'ریال')}</span>
                                                    <span
                                                        className={`text-[11px] font-semibold ${ltrNumericClassName} ${
                                                            gainPercent === null
                                                                ? 'text-muted'
                                                                : gainPercent >= 0
                                                                    ? 'text-positive'
                                                                    : 'text-negative'
                                                        }`}
                                                    >
                                                            {formatPercentOrDash(gainPercent)}
                                                        </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </section>
        </>
    );
}
