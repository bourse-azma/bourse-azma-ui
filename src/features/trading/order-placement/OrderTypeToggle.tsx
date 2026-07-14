import type {OrderSide, OrderType} from './types';

type OrderTypeToggleProps = {
    value: OrderType;
    side: OrderSide;
    onChange: (type: OrderType) => void;
    disabled?: boolean;
};

const options: Array<{ value: OrderType; label: string }> = [
    {value: 'CONDITIONAL', label: 'سفارش شرطی'},
    {value: 'NORMAL', label: 'سفارش عادی'},
];

export default function OrderTypeToggle({value, side, onChange, disabled = false}: OrderTypeToggleProps) {
    const accent = side === 'BUY' ? 'border-positive text-positive' : 'border-negative text-negative';

    return (
        <div role="tablist" aria-label="نوع سفارش" className="flex items-center gap-4 border-b border-border/60">
            {options.map((option) => {
                const active = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        disabled={disabled}
                        onClick={() => onChange(option.value)}
                        className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            active ? accent : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
