import {ChevronDown} from 'lucide-react';

type WatchlistEmptyStateProps = {
    title: string;
    help: string;
    onCreate: () => void;
};

export function WatchlistEmptyState({title, help, onCreate}: WatchlistEmptyStateProps) {
    return (
        <>
            <button
                type="button"
                className="mb-4 flex h-10 w-full items-center justify-between rounded-xl border border-border/80 bg-surface-2 px-3 text-xs text-muted"
                disabled
            >
                انتخاب کنید
                <ChevronDown className="h-4 w-4"/>
            </button>

            <div
                className="flex min-h-[292px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-2 px-5 text-center">
                <div className="mb-4 grid grid-cols-2 gap-2 opacity-70">
                    <div className="h-11 w-11 rounded-lg bg-border/60"/>
                    <div className="h-11 w-11 rounded-lg bg-border/75"/>
                    <div className="h-11 w-11 rounded-lg bg-border/75"/>
                    <div className="h-11 w-11 rounded-lg bg-border/60"/>
                </div>

                <h3 className="text-sm font-semibold text-text">{title}</h3>
                <p className="mt-1 text-xs text-muted">{help}</p>

                <button
                    type="button"
                    onClick={onCreate}
                    className="mt-4 rounded-full border border-positive/30 bg-positive/10 px-4 py-1.5 text-xs font-semibold text-positive transition hover:bg-positive/15 focus-visible:ring-2 focus-visible:ring-positive/45"
                >
                    ساخت دیده‌بان
                </button>
            </div>
        </>
    );
}
