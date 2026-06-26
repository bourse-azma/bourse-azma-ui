import {Star} from 'lucide-react';

type StarRatingProps = {
    value: number;
    onChange?: (value: number) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
};

export default function StarRating({value, onChange, disabled = false, size = 'md'}: StarRatingProps) {
    const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

    return (
        <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="امتیاز">
            {Array.from({length: 5}, (_, index) => {
                const score = index + 1;
                const active = score <= value;
                return (
                    <button
                        key={score}
                        type="button"
                        disabled={disabled || !onChange}
                        onClick={() => onChange?.(score)}
                        className={`rounded-md p-0.5 transition ${
                            disabled || !onChange ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                        }`}
                        aria-label={`${score} ستاره`}
                    >
                        <Star
                            className={`${iconClass} ${
                                active ? 'fill-warning text-warning' : 'text-muted/50'
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
