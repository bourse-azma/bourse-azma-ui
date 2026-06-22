import type {PeerGroupRow, SymbolSearchSuggestion} from './types';

/** Shared height for order-book slot (info / peers / technical tabs). */
export const ORDERBOOK_SLOT_HEIGHT_CLASS = 'h-[512px]';

const PEER_GRID_COLS =
    'grid-cols-[minmax(3.25rem,0.75fr)_minmax(5.25rem,1.05fr)_minmax(5.25rem,1.05fr)_minmax(2.85rem,0.62fr)_minmax(2.85rem,0.62fr)_minmax(3.75rem,0.82fr)_minmax(3.75rem,0.82fr)_minmax(3.75rem,0.82fr)]';

type PeerGroupPanelProps = {
    rows: PeerGroupRow[];
    sectorName: string | null;
    activeSymbol: string;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onSelectSymbol?: (symbol: SymbolSearchSuggestion) => void;
    formatNumber: (value: number | null | undefined, digits?: number) => string;
    formatCompactAmount: (value: number | null | undefined) => string;
    formatPercent: (value: number | null | undefined, digits?: number) => string;
};

const formatPeerPercent = (
    value: number | null | undefined,
    formatPercent: PeerGroupPanelProps['formatPercent']
) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }
    if (value < 0) {
        return `(${formatPercent(Math.abs(value))})`;
    }
    return formatPercent(value);
};

const percentClassName = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'text-muted';
    if (value > 0) return 'text-positive';
    if (value < 0) return 'text-negative';
    return 'text-muted';
};

const panelShellClass = `flex ${ORDERBOOK_SLOT_HEIGHT_CLASS} flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-2`;
const compactPanelShellClass = 'flex min-h-[168px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-2';

const headerCellClass = 'px-1.5 py-2 text-center text-[11px] font-medium text-muted';
const bodyCellClass = 'flex items-center justify-center px-1.5 py-2 tabular-nums';

type PriceCellProps = {
    price: number | null;
    percent: number | null;
    formatNumber: PeerGroupPanelProps['formatNumber'];
    formatPercent: PeerGroupPanelProps['formatPercent'];
};

function PriceCell({price, percent, formatNumber, formatPercent}: PriceCellProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
            <span className="text-xs font-semibold text-text">{formatNumber(price)}</span>
            <span className={`text-[10px] ${percentClassName(percent)}`}>
                {formatPeerPercent(percent, formatPercent)}
            </span>
        </div>
    );
}

export default function PeerGroupPanel({
                                           rows,
                                           sectorName,
                                           activeSymbol,
                                           loading,
                                           error,
                                           onRetry,
                                           onSelectSymbol,
                                           formatNumber,
                                           formatCompactAmount,
                                           formatPercent,
                                       }: PeerGroupPanelProps) {
    if (loading && rows.length === 0) {
        return (
            <div className={`${compactPanelShellClass} animate-pulse p-4`}>
                <div className="mb-3 h-4 w-40 rounded bg-border/60"/>
                <div className="flex-1 space-y-2">
                    {Array.from({length: 3}).map((_, index) => (
                        <div key={index} className="h-8 rounded bg-border/45"/>
                    ))}
                </div>
            </div>
        );
    }

    if (error && rows.length === 0) {
        return (
            <div className={`${compactPanelShellClass} items-center justify-center px-4 text-center text-xs text-negative`}>
                <p className="font-medium">{error}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className={`${compactPanelShellClass} items-center justify-center px-4 text-center text-xs text-muted`}>
                نماد هم‌گروهی برای نمایش موجود نیست.
            </div>
        );
    }

    return (
        <div dir="rtl" className={panelShellClass}>
            <div className="border-b border-border/60 bg-surface-2/95 px-3 py-2 text-[11px] text-muted">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text">
                        {sectorName ? `هم‌گروه · ${sectorName}` : 'هم‌گروه'}
                    </span>
                    <span>{rows.length} نماد</span>
                </div>
            </div>

            <div className={`grid shrink-0 border-b border-border/60 bg-surface-2/95 ${PEER_GRID_COLS}`}>
                <span className={headerCellClass}>نماد</span>
                <span className={headerCellClass}>پایانی</span>
                <span className={headerCellClass}>آخرین</span>
                <span className={headerCellClass}>کمترین</span>
                <span className={headerCellClass}>بیشترین</span>
                <span className={headerCellClass}>تعداد</span>
                <span className={headerCellClass}>حجم</span>
                <span className={headerCellClass}>ارزش</span>
            </div>

            <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                {rows.map((row) => {
                    const isActive = row.symbol === activeSymbol;
                    const handleSelect = () => {
                        if (!onSelectSymbol) return;
                        onSelectSymbol({
                            key: `${row.instrumentCode}:${row.symbol}`,
                            type: 'UNKNOWN',
                            symbol: row.symbol,
                            name: row.fullName ?? row.symbol,
                            instrumentCode: row.instrumentCode,
                            isin: null,
                            oldInstrumentCodes: [],
                        });
                    };

                    return (
                        <div
                            key={row.instrumentCode}
                            className={`grid border-b border-border/40 last:border-b-0 ${PEER_GRID_COLS} ${
                                isActive ? 'bg-primary/5' : ''
                            }`}
                        >
                            <div className={`${bodyCellClass} justify-center`}>
                                {onSelectSymbol ? (
                                    <button
                                        type="button"
                                        onClick={handleSelect}
                                        title={row.fullName ?? undefined}
                                        className="truncate text-xs font-semibold text-text transition hover:text-primary"
                                    >
                                        {row.symbol}
                                    </button>
                                ) : (
                                    <span
                                        className="truncate text-xs font-semibold text-text"
                                        title={row.fullName ?? undefined}
                                    >
                                        {row.symbol}
                                    </span>
                                )}
                            </div>

                            <div className={bodyCellClass}>
                                <PriceCell
                                    price={row.closingPrice}
                                    percent={row.closingPercent}
                                    formatNumber={formatNumber}
                                    formatPercent={formatPercent}
                                />
                            </div>

                            <div className={bodyCellClass}>
                                <PriceCell
                                    price={row.lastPrice}
                                    percent={row.lastPercent}
                                    formatNumber={formatNumber}
                                    formatPercent={formatPercent}
                                />
                            </div>

                            <div className={`${bodyCellClass} text-[11px] text-muted`}>
                                {formatNumber(row.dayMinPrice)}
                            </div>

                            <div className={`${bodyCellClass} text-[11px] text-muted`}>
                                {formatNumber(row.dayMaxPrice)}
                            </div>

                            <div className={`${bodyCellClass} text-[11px] text-text`}>
                                {formatNumber(row.tradeCount)}
                            </div>

                            <div className={`${bodyCellClass} text-[11px] text-text`}>
                                {formatCompactAmount(row.tradeVolume)}
                            </div>

                            <div className={`${bodyCellClass} text-[11px] text-text`}>
                                {formatCompactAmount(row.tradeValue)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** @deprecated Use ORDERBOOK_SLOT_HEIGHT_CLASS */
export const PEER_GROUP_PANEL_HEIGHT_CLASS = ORDERBOOK_SLOT_HEIGHT_CLASS;
