import {AlertCircle} from 'lucide-react';
import {toExchangeBadge} from '../../symbol-search/mappers';
import {formatPriceWithPercentOrDash, ltrNumericClassName} from '../../../utils/numberFormat';
import {formatNumberOrDash, formatPercentOrDash} from '../formatters';
import type {TradingDashboardVm} from './types';

export function SymbolPriceCard({vm}: { vm: TradingDashboardVm }) {
    if (vm.symbolLoading && !vm.activeSymbolData) {
        return (
            <div className="rounded-2xl border border-border/70 bg-surface-2 p-3 animate-pulse">
                <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-border/60"/>
                        <div className="h-5 w-24 rounded bg-border/60"/>
                    </div>
                    <div className="h-4 w-32 rounded bg-border/45"/>
                </div>
                <div className="mb-3 flex items-center gap-2">
                    <div className="h-6 w-12 rounded-full bg-border/60"/>
                    <div className="h-6 w-12 rounded-full bg-border/60"/>
                </div>
                <div className="mb-2 h-10 w-32 rounded bg-border/60"/>
                <div className="mb-4 h-5 w-16 rounded bg-border/45"/>
                <div className="mt-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-12 rounded bg-border/45"/>
                        <div className="h-4 w-24 rounded bg-border/60"/>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-12 rounded bg-border/45"/>
                        <div className="h-4 w-16 rounded bg-border/60"/>
                    </div>
                </div>
            </div>
        );
    }

    if (vm.symbolError && !vm.activeSymbolData) {
        return (
            <div className="rounded-2xl border border-negative/30 bg-negative/10 p-4 text-center text-negative">
                <AlertCircle className="mx-auto mb-2 h-6 w-6 opacity-80"/>
                <p className="text-sm font-semibold mb-2">اطلاعات یافت نشد یا درخواست با خطا مواجه شد.</p>
                <button
                    type="button"
                    onClick={vm.refreshSymbolDetails}
                    className="rounded-full border border-negative/35 bg-negative/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-negative/15"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border/70 bg-surface-2 p-3">
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${vm.symbolPositive ? 'bg-positive' : 'bg-negative'}`}/>
                    <h2 className="truncate text-base font-semibold text-text">{vm.activeSymbolData?.title ?? vm.selectedSymbol.symbol}</h2>
                </div>
                <span className="hidden max-w-[45%] truncate text-xs text-muted sm:inline">{vm.activeSymbolData?.subtitle ?? vm.selectedSymbol.name}</span>
            </div>

            <div className="mb-3 flex items-center gap-2">
                {vm.codalSymbolUrl ? (
                    <a
                        href={vm.codalSymbolUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-positive/15 px-2.5 py-1 text-[11px] font-medium text-positive transition hover:bg-positive/20"
                    >
                        کدال
                    </a>
                ) : (
                    <span
                        className="rounded-full bg-positive/15 px-2.5 py-1 text-[11px] font-medium text-positive">کدال</span>
                )}

                {(vm.activeSymbolData?.exchangeBadge || vm.selectedSymbol.type !== 'UNKNOWN') && (
                    vm.tsetmcSymbolUrl ? (
                        <a
                            href={vm.tsetmcSymbolUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-border/60 bg-surface px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-primary/40 hover:text-text"
                        >
                            {vm.activeSymbolData?.exchangeBadge || toExchangeBadge(vm.selectedSymbol.type)}
                        </a>
                    ) : (
                        <span
                            className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted border border-border/60">
                            {vm.activeSymbolData?.exchangeBadge || toExchangeBadge(vm.selectedSymbol.type)}
                        </span>
                    )
                )}
            </div>

            <div
                className="text-4xl font-bold tabular-nums tracking-tight text-text">{formatNumberOrDash(vm.symbolPrice)}</div>
            <div
                className={`mt-1 text-sm font-semibold ${ltrNumericClassName} ${
                    vm.symbolPercent === null ? 'text-muted' : vm.symbolPositive ? 'text-positive' : 'text-negative'
                }`}
            >
                {formatPercentOrDash(vm.symbolPercent)}
            </div>

            <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-muted">پایانی</span>
                    <span className={`font-medium text-text ${ltrNumericClassName}`}>
                        {formatPriceWithPercentOrDash(
                            vm.activeSymbolData?.closePrice,
                            vm.activeSymbolData?.closePricePercent,
                            'ناموجود',
                        )}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted">{vm.activeSymbolData?.source === 'fund' ? 'حباب' : 'وضعیت'}</span>
                    <span className="font-medium tabular-nums text-text">
                        {vm.activeSymbolData?.source === 'fund'
                            ? formatPercentOrDash(vm.activeSymbolData?.bubblePercent)
                            : vm.activeSymbolData?.stateTitle ?? 'ناموجود'}
                    </span>
                </div>
            </div>
        </div>
    );
}
