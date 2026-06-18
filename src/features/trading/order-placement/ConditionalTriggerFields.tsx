import {AlertCircle} from 'lucide-react';
import type {OrderSide, TriggerComparator} from './types';
import {TRIGGER_LABELS} from './types';

type ConditionalTriggerFieldsProps = {
    side: OrderSide;
    comparator: TriggerComparator;
    triggerPrice: string;
    error?: string;
    onComparatorChange: (comparator: TriggerComparator) => void;
    onTriggerPriceChange: (value: string) => void;
};

const COMPARATORS: TriggerComparator[] = ['GREATER_THAN', 'LESS_THAN', 'EQUAL'];

export default function ConditionalTriggerFields({
                                                     side,
                                                     comparator,
                                                     triggerPrice,
                                                     error,
                                                     onComparatorChange,
                                                     onTriggerPriceChange,
                                                 }: ConditionalTriggerFieldsProps) {
    const accent = side === 'BUY' ? 'focus:ring-positive/30' : 'focus:ring-negative/30';

    return (
        <div className="space-y-2">
            <label className="block text-xs font-medium text-muted">شرط قیمت</label>
            <div className="grid grid-cols-[auto_1fr] gap-2">
                <select
                    aria-label="شرط قیمت"
                    value={comparator}
                    onChange={(event) => onComparatorChange(event.target.value as TriggerComparator)}
                    className={`h-11 rounded-xl border border-border/80 bg-surface px-2 text-sm text-text outline-none transition focus:ring-2 ${accent}`}
                >
                    {COMPARATORS.map((option) => (
                        <option key={option} value={option}>
                            {TRIGGER_LABELS[option]}
                        </option>
                    ))}
                </select>
                <div className="relative">
                    <input
                        inputMode="numeric"
                        dir="ltr"
                        value={triggerPrice}
                        onChange={(event) => onTriggerPriceChange(event.target.value)}
                        placeholder="قیمت شرط"
                        className={`h-11 w-full rounded-xl border bg-surface px-3 pl-12 text-sm text-text outline-none transition focus:ring-2 ${accent} ${
                            error ? 'border-negative/50' : 'border-border/80'
                        }`}
                    />
                    <span
                        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] text-muted">
                        ریال
                    </span>
                </div>
            </div>
            {error ? (
                <div className="flex items-center gap-1.5 text-xs text-negative">
                    <AlertCircle className="h-3.5 w-3.5"/>
                    {error}
                </div>
            ) : null}
        </div>
    );
}
