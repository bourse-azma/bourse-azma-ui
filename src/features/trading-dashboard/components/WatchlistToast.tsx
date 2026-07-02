import {AlertCircle, Check, X} from 'lucide-react';
import type {TradingDashboardVm} from './types';

export function WatchlistToast({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            {vm.watchlistToast ? (
                <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-3">
                    <div
                        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-card animate-toast-in ${
                            vm.watchlistToast.tone === 'error'
                                ? 'border-negative/35 bg-negative/10 text-negative'
                                : 'border-positive/35 bg-surface text-text shadow-[0_10px_30px_-12px_hsl(var(--positive)/0.45)]'
                        }`}
                        role="status"
                        aria-live="polite"
                    >
                        <span
                            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                vm.watchlistToast.tone === 'error'
                                    ? 'bg-negative/15 text-negative'
                                    : 'bg-positive/15 text-positive'
                            }`}
                        >
                            {vm.watchlistToast.tone === 'error' ? (
                                <AlertCircle className="h-4 w-4" aria-hidden="true"/>
                            ) : (
                                <Check className="h-4 w-4" aria-hidden="true"/>
                            )}
                        </span>
                        <div className="min-w-0 flex-1">
                            {vm.watchlistToast.title ? (
                                <p className="font-semibold text-text">{vm.watchlistToast.title}</p>
                            ) : null}
                            <p className={vm.watchlistToast.title ? 'mt-0.5 text-xs text-muted' : 'text-text'}>
                                {vm.watchlistToast.message}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => vm.setWatchlistToast(null)}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface-2 text-muted transition hover:text-text"
                            aria-label="بستن اعلان"
                        >
                            <X className="h-3.5 w-3.5"/>
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    );
}
