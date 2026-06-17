import type {SymbolDepthRow} from './types';
import {clampDepthPercent} from './orderBookUtils';

type OrderBookDepthPanelProps = {
    rows: SymbolDepthRow[];
    formatCount: (value: number | null | undefined) => string;
    formatVolume: (value: number | null | undefined) => string;
    formatPercent: (value: number | null | undefined) => string;
};

const formatDepthLine = (
    count: number | null | undefined,
    volume: number | null | undefined,
    percent: number | null | undefined,
    formatCount: OrderBookDepthPanelProps['formatCount'],
    formatVolume: OrderBookDepthPanelProps['formatVolume'],
    formatPercent: OrderBookDepthPanelProps['formatPercent']
) => `${formatCount(count)} * ${formatVolume(volume)} (${formatPercent(percent)})`;

export default function OrderBookDepthPanel({
                                                rows,
                                                formatCount,
                                                formatVolume,
                                                formatPercent,
                                            }: OrderBookDepthPanelProps) {
    if (rows.length === 0) {
        return (
            <div
                className="rounded-xl border border-dashed border-border/70 bg-surface px-3 py-4 text-center text-xs text-muted">
                اطلاعات ورود/خروج حقیقی و حقوقی موجود نیست.
            </div>
        );
    }

    return (
        <div dir="ltr" className="space-y-3.5">
            {rows.map((row) => {
                const sellWidth = clampDepthPercent(row.sellPercent);
                const buyWidth = clampDepthPercent(row.buyPercent);

                return (
                    <div key={row.id} className="space-y-1">
                        <div
                            className="grid grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)] items-end gap-2 text-[11px] leading-tight">
                            <div className="min-w-0 truncate text-right tabular-nums text-negative">
                                {formatDepthLine(
                                    row.sellCount,
                                    row.sellVolume,
                                    row.sellPercent,
                                    formatCount,
                                    formatVolume,
                                    formatPercent
                                )}
                            </div>

                            <span className="pb-0.5 text-center text-xs font-medium text-muted">{row.label}</span>

                            <div className="min-w-0 truncate text-left tabular-nums text-positive">
                                {formatDepthLine(
                                    row.buyCount,
                                    row.buyVolume,
                                    row.buyPercent,
                                    formatCount,
                                    formatVolume,
                                    formatPercent
                                )}
                            </div>
                        </div>

                        <div className="relative h-2 overflow-hidden rounded-full bg-border/50">
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] w-px -translate-x-1/2 bg-border/80"
                            />
                            {sellWidth > 0 ? (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-y-0 right-1/2 bg-negative/35 transition-[width] duration-500 ease-out"
                                    style={{width: `${sellWidth / 2}%`}}
                                />
                            ) : null}
                            {buyWidth > 0 ? (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-y-0 left-1/2 bg-positive/35 transition-[width] duration-500 ease-out"
                                    style={{width: `${buyWidth / 2}%`}}
                                />
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
