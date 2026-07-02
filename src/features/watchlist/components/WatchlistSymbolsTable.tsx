import {Eye, Loader2, Star, Trash2} from 'lucide-react';
import {WATCHLIST_TABLE_GRID} from '../../trading-dashboard/constants';
import {formatNumberOrDash, formatPercentOrDash} from '../../trading-dashboard/formatters';
import {ltrNumericClassName} from '../../../utils/numberFormat';
import type {SymbolSearchSuggestion} from '../../symbol-search/types';
import type {Watchlist} from '../api';

type WatchlistSymbolsTableProps = {
    watchlist: Watchlist;
    currentSymbolLabel: string;
    watchlistBusy: boolean;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
    onRemoveSymbol: (symbolId: number) => void;
    onToggleCurrentSymbol: () => void;
    resolveLivePrice: (instrumentCode: string | null | undefined) => number | null;
    resolveLivePriceChange: (instrumentCode: string | null | undefined) => number | null;
};

const toSuggestion = (symbol: Watchlist['symbols'][number]): SymbolSearchSuggestion => ({
    key: symbol.symbolKey,
    type: symbol.sourceType || 'TSE',
    symbol: symbol.symbol,
    name: symbol.name,
    instrumentCode: symbol.instrumentCode,
    isin: symbol.isin,
    oldInstrumentCodes: [],
});

export function WatchlistSymbolsTable({
                                          watchlist,
                                          currentSymbolLabel,
                                          watchlistBusy,
                                          onSelectSymbol,
                                          onRemoveSymbol,
                                          onToggleCurrentSymbol,
                                          resolveLivePrice,
                                          resolveLivePriceChange,
                                      }: WatchlistSymbolsTableProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
            <header
                className={`${WATCHLIST_TABLE_GRID} border-b border-border/70 bg-surface-2 px-3 py-2.5 text-[11px] font-semibold text-muted`}>
                <span>نام نماد</span>
                <span className="text-center">قیمت لحظه‌ای</span>
                <span className="text-center">تغییر</span>
                <span className="text-center">عملیات</span>
            </header>

            {watchlist.symbols.length === 0 ? (
                <div className="flex min-h-[230px] flex-col items-center justify-center px-4 py-7 text-center">
                    <div
                        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-surface-2 text-warning shadow-sm">
                        <Star className="h-6 w-6"/>
                    </div>
                    <h4 className="text-sm font-bold text-text">هنوز نمادی اضافه نکرده‌اید</h4>
                    <p className="mt-1 max-w-[260px] text-xs leading-6 text-muted">
                        نمادهای موردنظرتان را اینجا اضافه کنید تا قیمت لحظه‌ای ببینید و با یک کلیک به آن‌ها دسترسی داشته
                        باشید.
                    </p>
                    <button
                        type="button"
                        onClick={onToggleCurrentSymbol}
                        disabled={watchlistBusy}
                        className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-warning px-4 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {watchlistBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> :
                            <Star className="h-3.5 w-3.5"/>}
                        افزودن {currentSymbolLabel}
                    </button>
                </div>
            ) : (
                <div className="thin-scrollbar max-h-[245px] overflow-y-auto">
                    {watchlist.symbols.map((symbol) => {
                        const livePrice = resolveLivePrice(symbol.instrumentCode);
                        const changePercent = resolveLivePriceChange(symbol.instrumentCode);
                        const isPositive = changePercent !== null && changePercent >= 0;
                        const suggestion = toSuggestion(symbol);

                        return (
                            <div
                                key={symbol.id}
                                className={`${WATCHLIST_TABLE_GRID} border-b border-border/60 px-2 py-2.5 text-xs last:border-b-0 transition hover:bg-surface-2/60`}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelectSymbol(suggestion)}
                                    className="min-w-0 text-right"
                                >
                                    <div className="truncate font-semibold text-text">{symbol.symbol}</div>
                                    <div className="truncate text-[11px] text-muted">{symbol.name}</div>
                                </button>
                                <span className="text-center tabular-nums text-text">
                                    {formatNumberOrDash(livePrice)}
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
                                <div className="flex items-center justify-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onSelectSymbol(suggestion)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface text-muted transition hover:border-primary/35 hover:text-text"
                                        aria-label={`مشاهده ${symbol.symbol}`}
                                    >
                                        <Eye className="h-4 w-4"/>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={watchlistBusy}
                                        onClick={() => onRemoveSymbol(symbol.id)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface text-muted transition hover:border-negative/35 hover:text-negative disabled:cursor-not-allowed disabled:opacity-60"
                                        aria-label={`حذف ${symbol.symbol} از دیده‌بان`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
