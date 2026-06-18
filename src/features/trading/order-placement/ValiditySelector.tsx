import type {OrderSide, OrderValidity} from './types';
import {VALIDITY_LABELS} from './types';

type ValiditySelectorProps = {
    value: OrderValidity;
    side: OrderSide;
    onChange: (value: OrderValidity) => void;
};

const ORDER: OrderValidity[] = ['TODAY', 'DAY', 'DAYS_30', 'DAYS_90'];

export default function ValiditySelector({value, side, onChange}: ValiditySelectorProps) {
    const activeClass =
        side === 'BUY'
            ? 'border-positive bg-positive/10 text-positive'
            : 'border-negative bg-negative/10 text-negative';

    return (
        <div className="flex flex-wrap items-center gap-2">
            {ORDER.map((validity) => {
                const active = value === validity;
                return (
                    <button
                        key={validity}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(validity)}
                        className={`h-8 rounded-full border px-3 text-xs font-medium transition ${
                            active ? activeClass : 'border-border/70 bg-surface text-muted hover:text-text'
                        }`}
                    >
                        {VALIDITY_LABELS[validity]}
                    </button>
                );
            })}
        </div>
    );
}
