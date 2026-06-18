import type {OrderSide} from './types';

type BuySellToggleProps = {
    value: OrderSide;
    onChange: (side: OrderSide) => void;
};

export default function BuySellToggle({value, onChange}: BuySellToggleProps) {
    return (
        <div
            role="tablist"
            aria-label="انتخاب خرید یا فروش"
            className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-surface-2 p-1"
        >
            <button
                type="button"
                role="tab"
                aria-selected={value === 'BUY'}
                onClick={() => onChange('BUY')}
                className={`h-9 rounded-lg text-sm font-semibold transition ${
                    value === 'BUY'
                        ? 'bg-positive text-white shadow-glow'
                        : 'text-positive hover:bg-positive/10'
                }`}
            >
                خرید
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={value === 'SELL'}
                onClick={() => onChange('SELL')}
                className={`h-9 rounded-lg text-sm font-semibold transition ${
                    value === 'SELL'
                        ? 'bg-negative text-white'
                        : 'text-negative hover:bg-negative/10'
                }`}
            >
                فروش
            </button>
        </div>
    );
}
