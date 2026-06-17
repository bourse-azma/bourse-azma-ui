import type {SymbolOrderBookRow} from './types';
import {DepthFill} from './PowerBar';
import {getOrderBookMaxVolumes, volumeToBarPercent} from './orderBookUtils';

type OrderBookPanelProps = {
    rows: SymbolOrderBookRow[];
    formatNumber: (value: number | null | undefined, digits?: number) => string;
};

const hasPositiveValue = (value: number | null | undefined) => (value ?? 0) > 0;

export default function OrderBookPanel({rows, formatNumber}: OrderBookPanelProps) {
    const maxVolumes = getOrderBookMaxVolumes(rows);

    return (
        <div dir="ltr" className="overflow-hidden rounded-2xl border border-border/70">
            <div className="grid grid-cols-2 border-b border-border/60 bg-surface-2/95 text-[11px] text-muted">
                <div className="grid grid-cols-[minmax(3.5rem,0.9fr)_1fr_1fr] border-l border-border/60">
                    <span className="px-2 py-2 text-center font-medium">تعداد</span>
                    <span className="px-2 py-2 text-center font-medium">حجم</span>
                    <span className="px-2 py-2 text-center font-medium text-negative">قیمت</span>
                </div>
                <div className="grid grid-cols-[1fr_1fr_minmax(3.5rem,0.9fr)]">
                    <span className="px-2 py-2 text-center font-medium text-positive">قیمت</span>
                    <span className="px-2 py-2 text-center font-medium">حجم</span>
                    <span className="px-2 py-2 text-center font-medium">تعداد</span>
                </div>
            </div>

            <div className="thin-scrollbar max-h-[280px] overflow-y-auto">
                {rows.map((row) => {
                    const askPower = volumeToBarPercent(row.askVolume ?? 0, maxVolumes.ask);
                    const bidPower = volumeToBarPercent(row.bidVolume ?? 0, maxVolumes.bid);

                    return (
                        <div
                            key={row.id}
                            className="grid grid-cols-2 border-t border-border/50 text-xs first:border-t-0"
                        >
                            {/* sell side */}
                            <div className="grid grid-cols-[minmax(3.5rem,0.9fr)_1fr_1fr] border-l border-border/60">
                                <span className="flex items-center justify-center px-2 py-2.5 tabular-nums text-muted">
                                    {formatNumber(row.askCount)}
                                </span>
                                <div className="relative col-span-2 grid grid-cols-2 overflow-hidden">
                                    <DepthFill percent={askPower} tone="negative" origin="right"/>
                                    <span
                                        className={`relative z-[1] flex items-center justify-center px-2 py-2.5 tabular-nums ${hasPositiveValue(row.askVolume) ? 'font-medium text-text' : 'text-muted/60'}`}
                                    >
                                        {formatNumber(row.askVolume)}
                                    </span>
                                    <span
                                        className="relative z-[1] flex items-center justify-center px-2 py-2.5 tabular-nums font-semibold text-negative">
                                        {formatNumber(row.askPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* buy side */}
                            <div className="grid grid-cols-[1fr_1fr_minmax(3.5rem,0.9fr)]">
                                <div className="relative col-span-2 grid grid-cols-2 overflow-hidden">
                                    <DepthFill percent={bidPower} tone="positive" origin="left"/>
                                    <span
                                        className="relative z-[1] flex items-center justify-center px-2 py-2.5 tabular-nums font-semibold text-positive">
                                        {formatNumber(row.bidPrice)}
                                    </span>
                                    <span
                                        className={`relative z-[1] flex items-center justify-center px-2 py-2.5 tabular-nums ${hasPositiveValue(row.bidVolume) ? 'font-medium text-text' : 'text-muted/60'}`}
                                    >
                                        {formatNumber(row.bidVolume)}
                                    </span>
                                </div>
                                <span className="flex items-center justify-center px-2 py-2.5 tabular-nums text-muted">
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
