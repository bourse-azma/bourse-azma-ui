import type {SymbolOrderBookRow} from './types';
import {DepthFill} from './PowerBar';
import {getOrderBookMaxVolumes, volumeToBarPercent} from './orderBookUtils';

type OrderBookPanelProps = {
    rows: SymbolOrderBookRow[];
    formatNumber: (value: number | null | undefined, digits?: number) => string;
    onSelectPrice?: (price: number) => void;
    fillHeight?: boolean;
    embedded?: boolean;
};

const hasPositiveValue = (value: number | null | undefined) => (value ?? 0) > 0;

const cellClass = 'flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap px-0.5 py-2 tabular-nums sm:px-1 sm:py-2.5';
const valueCellClass = 'text-[9px] leading-none sm:text-[10px] lg:text-[11px] 2xl:text-xs';
const priceBtnClass = `${cellClass} font-semibold transition disabled:cursor-default disabled:hover:bg-transparent`;

export default function OrderBookPanel({
                                           rows,
                                           formatNumber,
                                           onSelectPrice,
                                           fillHeight = false,
                                           embedded = false,
                                       }: OrderBookPanelProps) {
    const maxVolumes = getOrderBookMaxVolumes(rows);
    const isInteractive = typeof onSelectPrice === 'function';

    const handleSelect = (price: number | null) => {
        if (isInteractive && price !== null && Number.isFinite(price) && price > 0) {
            onSelectPrice?.(price);
        }
    };

    const renderPriceCell = (price: number | null, tone: 'positive' | 'negative') => {
        const colorClass = tone === 'positive' ? 'text-positive' : 'text-negative';
        const hoverClass = tone === 'positive' ? 'hover:bg-positive/10' : 'hover:bg-negative/10';

        if (isInteractive) {
            return (
                <button
                    type="button"
                    onClick={() => handleSelect(price)}
                    disabled={!hasPositiveValue(price)}
                    title={hasPositiveValue(price) ? 'انتخاب این قیمت' : undefined}
                    className={`${priceBtnClass} ${colorClass} ${hoverClass}`}
                >
                    {formatNumber(price)}
                </button>
            );
        }

        return (
            <span className={`${cellClass} font-semibold ${colorClass}`}>
                {formatNumber(price)}
            </span>
        );
    };

    return (
        <div
            dir="ltr"
            className={`overflow-hidden ${embedded ? '' : 'rounded-2xl border border-border/70'} ${fillHeight ? 'flex min-h-0 flex-1 flex-col' : ''}`}
        >
            {/* Header */}
            <div
                className="grid grid-cols-2 border-b border-border/60 bg-surface-2/95 text-[10px] text-muted sm:text-[11px]">
                <div className="grid grid-cols-2 border-l border-border/60 sm:grid-cols-[minmax(3rem,0.85fr)_1fr_1fr]">
                    <span className="hidden px-2 py-2 text-center font-medium sm:block">تعداد</span>
                    <span className={`${cellClass} font-medium text-negative`}>قیمت</span>
                    <span className={`${cellClass} font-medium`}>حجم</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_minmax(3rem,0.85fr)]">
                    <span className={`${cellClass} font-medium`}>حجم</span>
                    <span className={`${cellClass} font-medium text-positive`}>قیمت</span>
                    <span className="hidden px-2 py-2 text-center font-medium sm:block">تعداد</span>
                </div>
            </div>

            {/* Rows */}
            <div
                className={`thin-scrollbar ${fillHeight ? 'min-h-0 flex-1 overflow-y-auto' : embedded ? 'overflow-visible' : 'max-h-[280px] overflow-y-auto sm:max-h-[320px]'}`}
            >
                {rows.map((row) => {
                    const askPower = volumeToBarPercent(row.askVolume ?? 0, maxVolumes.ask);
                    const bidPower = volumeToBarPercent(row.bidVolume ?? 0, maxVolumes.bid);

                    return (
                        <div
                            key={row.id}
                            className="grid grid-cols-2 border-t border-border/50 text-[11px] first:border-t-0 sm:text-xs"
                        >
                            {/* Sell side */}
                            <div
                                className="grid grid-cols-2 border-l border-border/60 sm:grid-cols-[minmax(3rem,0.85fr)_1fr_1fr]">
                                <span className={`${cellClass} ${valueCellClass} hidden text-muted sm:flex`}>
                                    {formatNumber(row.askCount)}
                                </span>
                                <div className="relative overflow-hidden">
                                    {renderPriceCell(row.askPrice, 'negative')}
                                </div>
                                <div className="relative overflow-hidden">
                                    <DepthFill percent={askPower} tone="negative" origin="right"/>
                                    <span
                                        className={`relative z-[1] ${cellClass} ${valueCellClass} ${hasPositiveValue(row.askVolume) ? 'font-medium text-text' : 'text-muted/60'}`}
                                        title={formatNumber(row.askVolume)}
                                    >
                                        {formatNumber(row.askVolume)}
                                    </span>
                                </div>
                            </div>

                            {/* Buy side */}
                            <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_minmax(3rem,0.85fr)]">
                                <div className="relative overflow-hidden">
                                    <DepthFill percent={bidPower} tone="positive" origin="left"/>
                                    <span
                                        className={`relative z-[1] ${cellClass} ${valueCellClass} ${hasPositiveValue(row.bidVolume) ? 'font-medium text-text' : 'text-muted/60'}`}
                                        title={formatNumber(row.bidVolume)}
                                    >
                                        {formatNumber(row.bidVolume)}
                                    </span>
                                </div>
                                <div className="relative overflow-hidden">
                                    {renderPriceCell(row.bidPrice, 'positive')}
                                </div>
                                <span className={`${cellClass} ${valueCellClass} hidden text-muted sm:flex`}>
                                    {formatNumber(row.bidCount)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
