import {useEffect, useRef, useState} from 'react';
import {Check, ChevronDown} from 'lucide-react';
import type {PriceType} from './types';

type PriceTypeSelectProps = {
    value: PriceType;
    onChange: (value: PriceType) => void;
    disabled?: boolean;
};

const OPTIONS: Array<{ value: PriceType; label: string; description: string }> = [
    {
        value: 'CUSTOM',
        label: 'قیمت دلخواه',
        description: 'سفارش شما در زمان ارسال، بر اساس قیمتی که خودتان تعیین کرده‌اید ارسال می‌شود.',
    },
    {
        value: 'MARKET',
        label: 'قیمت بازار',
        description: 'سفارش شما در زمان ارسال، بر اساس بهترین قیمت موجود در سفارشات آن لحظه ارسال می‌شود.',
    },
];

export default function PriceTypeSelect({value, onChange, disabled}: PriceTypeSelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

    useEffect(() => {
        if (!open) return;
        const handlePointer = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
                <span className="font-medium">{selected.label}</span>
                <ChevronDown
                    className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open ? (
                <ul
                    role="listbox"
                    aria-label="نوع قیمت"
                    className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-surface shadow-card"
                >
                    {OPTIONS.map((option) => {
                        const active = option.value === value;
                        return (
                            <li key={option.value} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-start gap-2 px-3 py-3 text-right transition hover:bg-surface-2"
                                >
                                    <Check
                                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                                            active ? 'text-positive' : 'text-transparent'
                                        }`}
                                    />
                                    <span className="space-y-1">
                                        <span className="block text-sm font-semibold text-text">{option.label}</span>
                                        <span className="block text-xs leading-6 text-muted">{option.description}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
}
