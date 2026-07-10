import {AlertCircle} from 'lucide-react';
import {formatDateTimeFa} from '../../utils/formatDateTime';
import {ltrNumericClassName} from '../../utils/numberFormat';
import type {SymbolDetailRow} from './types';

type SymbolDetailsPanelProps = {
    rows: SymbolDetailRow[];
    loading: boolean;
    error: string | null;
    hasSymbolData: boolean;
    onRetry: () => void;
    formatNumber: (value: number | null | undefined, digits?: number) => string;
    formatPercent: (value: number | null | undefined, digits?: number) => string;
    formatCurrency: (value: number | null | undefined) => string;
};

const formatDetailValue = (
    item: SymbolDetailRow,
    formatNumber: SymbolDetailsPanelProps['formatNumber'],
    formatPercent: SymbolDetailsPanelProps['formatPercent'],
    formatCurrency: SymbolDetailsPanelProps['formatCurrency']
): string => {
    if (item.valueType === 'number') {
        return formatNumber(typeof item.value === 'number' ? item.value : null, item.digits ?? 0);
    }
    if (item.valueType === 'percent') {
        return formatPercent(typeof item.value === 'number' ? item.value : null, item.digits ?? 2);
    }
    if (item.valueType === 'currency') {
        return formatCurrency(typeof item.value === 'number' ? item.value : null);
    }
    if (item.valueType === 'currencyMillion') {
        if (typeof item.value !== 'number' || !Number.isFinite(item.value)) {
            return 'ناموجود';
        }
        const formatted = formatNumber(item.value / 1_000_000, 2);
        return formatted === 'ناموجود' ? formatted : `ریال ${formatted}M`;
    }
    if (item.valueType === 'datetime') {
        return formatDateTimeFa(typeof item.value === 'string' ? item.value : null);
    }
    return typeof item.value === 'string' ? item.value || 'ناموجود' : 'ناموجود';
};

export default function SymbolDetailsPanel({
                                               rows,
                                               loading,
                                               error,
                                               hasSymbolData,
                                               onRetry,
                                               formatNumber,
                                               formatPercent,
                                               formatCurrency,
                                           }: SymbolDetailsPanelProps) {
    return (
        <div className="flex flex-col">
            {error && !hasSymbolData ? (
                <div className="rounded-xl border border-negative/30 bg-negative/10 p-3 text-xs text-negative">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4"/>
                        {error}
                    </div>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : null}

            {loading && !hasSymbolData
                ? (
                    <div className="text-xs">
                        {Array.from({length: 6}, (_, index) => (
                            <div key={`symbol-detail-skeleton-${index + 1}`}
                                 className="flex items-center justify-between py-2">
                                <div className="h-3 w-1/3 animate-pulse rounded bg-border/60"/>
                                <div className="h-3 w-1/4 animate-pulse rounded bg-border/45"/>
                            </div>
                        ))}
                    </div>
                )
                : null}

            {!loading && rows.length === 0 && !error ? (
                <div className="py-6 text-center text-xs text-muted">
                    اطلاعات نماد موجود نیست.
                </div>
            ) : null}

            {rows.length > 0 ? (
                <div className="text-xs">
                    {rows.map((item) => {
                        const displayValue = formatDetailValue(
                            item,
                            formatNumber,
                            formatPercent,
                            formatCurrency
                        );

                        return (
                            <div
                                key={item.label}
                                className="flex items-center justify-between gap-4 py-2"
                            >
                                <span className="shrink-0 text-muted">{item.label}</span>
                                <span
                                    className={`min-w-0 text-left font-medium text-text ${
                                        item.valueType === 'percent' || item.valueType === 'number' || item.valueType === 'currencyMillion'
                                            ? ltrNumericClassName
                                            : 'tabular-nums'
                                    }`}
                                    dir={item.valueType === 'datetime' || item.valueType === 'currencyMillion' ? 'ltr' : undefined}
                                >
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
