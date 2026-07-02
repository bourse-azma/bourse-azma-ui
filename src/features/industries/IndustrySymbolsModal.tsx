import {useMemo} from 'react';
import {AlertCircle, ChevronLeft, Eye, Loader2, Search, X} from 'lucide-react';
import type {IndustrySummary, IndustrySymbol} from './types';
import type {SymbolSearchSuggestion} from '../symbol-search/types';

type IndustrySymbolsModalProps = {
    selectedIndustry: IndustrySummary;
    symbols: IndustrySymbol[];
    symbolsLoading: boolean;
    symbolsError: string | null;
    symbolSearchQuery: string;
    onSymbolSearchQueryChange: (value: string) => void;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
    onRetry: () => void;
    onClose: () => void;
    formatFaInteger: (value: number) => string;
};

const toSymbolSuggestion = (item: IndustrySymbol): SymbolSearchSuggestion => ({
    key: `TSE:${item.symbol}:${item.instrumentCode || 'none'}`,
    type: 'TSE',
    symbol: item.symbol,
    name: item.name,
    instrumentCode: item.instrumentCode || null,
    isin: null,
    oldInstrumentCodes: [],
});

export default function IndustrySymbolsModal({
                                                 selectedIndustry,
                                                 symbols,
                                                 symbolsLoading,
                                                 symbolsError,
                                                 symbolSearchQuery,
                                                 onSymbolSearchQueryChange,
                                                 onSelectSymbol,
                                                 onRetry,
                                                 onClose,
                                                 formatFaInteger,
                                             }: IndustrySymbolsModalProps) {
    const filteredSymbols = useMemo(() => {
        const normalized = symbolSearchQuery.trim().toLowerCase();
        if (!normalized) return symbols;
        return symbols.filter(
            (symbol) =>
                symbol.symbol.toLowerCase().includes(normalized) ||
                symbol.name.toLowerCase().includes(normalized)
        );
    }, [symbolSearchQuery, symbols]);

    const selectSymbol = (symbol: IndustrySymbol) => {
        onSelectSymbol(toSymbolSuggestion(symbol));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                aria-label="بستن پنجره صنعت"
            />
            <div
                dir="rtl"
                className="relative flex max-h-[min(80vh,640px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card"
            >
                <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-[11px] text-muted">نمادهای صنعت</p>
                        <h3 className="mt-0.5 text-sm font-bold text-text">{selectedIndustry.name}</h3>
                        <p className="mt-1 text-[11px] text-muted">
                            {formatFaInteger(selectedIndustry.symbolCount)} نماد
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface-2 text-muted transition hover:text-text"
                        aria-label="بستن"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                <div className="border-b border-border/70 px-4 py-3">
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>
                        <input
                            type="search"
                            value={symbolSearchQuery}
                            onChange={(event) => onSymbolSearchQueryChange(event.target.value)}
                            placeholder="جستجوی نماد..."
                            className="h-9 w-full rounded-xl border border-border/80 bg-surface px-3 pr-9 text-xs text-text outline-none transition placeholder:text-muted focus:border-primary/35"
                        />
                    </div>
                </div>

                {symbolsLoading ? (
                    <div className="flex min-h-[240px] items-center justify-center gap-2 px-4 py-8 text-xs text-muted">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        در حال دریافت نمادها...
                    </div>
                ) : symbolsError ? (
                    <div className="px-4 py-6 text-xs text-negative">
                        <div className="mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4"/>
                            {symbolsError}
                        </div>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : (
                    <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
                        <header
                            className="sticky top-0 z-10 grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border/70 bg-surface-2 px-3 py-2 text-[11px] font-semibold text-muted">
                            <span>نام نماد</span>
                            <span className="pl-1">عملیات</span>
                        </header>

                        {filteredSymbols.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-muted">نمادی یافت نشد.</div>
                        ) : (
                            filteredSymbols.map((symbol) => (
                                <div
                                    key={`${symbol.symbol}-${symbol.instrumentCode}`}
                                    className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border/60 px-3 py-2.5 text-xs last:border-b-0"
                                >
                                    <button
                                        type="button"
                                        onClick={() => selectSymbol(symbol)}
                                        className="min-w-0 text-right"
                                    >
                                        <div className="truncate font-semibold text-text">{symbol.symbol}</div>
                                        <div className="truncate text-[11px] text-muted">{symbol.name}</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSymbol(symbol)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface text-muted transition hover:border-primary/35 hover:text-text"
                                        aria-label={`مشاهده ${symbol.symbol}`}
                                    >
                                        <Eye className="h-4 w-4"/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="border-t border-border/70 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 px-3 py-2 text-xs font-semibold text-text transition hover:border-primary/30"
                    >
                        <ChevronLeft className="h-4 w-4"/>
                        بازگشت به لیست صنایع
                    </button>
                </div>
            </div>
        </div>
    );
}
