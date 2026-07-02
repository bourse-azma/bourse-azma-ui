import {AlertCircle, Check, Loader2, Plus, X} from 'lucide-react';
import {WATCHLIST_NAME_MAX_LENGTH} from '../constants';
import type {TradingDashboardVm} from './types';

export function WatchlistModals({vm}: { vm: TradingDashboardVm }) {
    const addToWatchlistModal = vm.addToWatchlistModal;
    return (
        <>
            {vm.watchlistModal ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={vm.closeWatchlistModal}
                        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                        aria-label="close watchlist modal"
                    />
                    <form
                        dir="rtl"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void vm.submitWatchlistModal();
                        }}
                        className="relative w-full max-w-[360px] rounded-2xl border border-border/70 bg-surface shadow-card"
                    >
                        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                            <h3 className="text-base font-bold text-text">
                                {vm.watchlistModal.mode === 'create'
                                    ? 'ساخت دیده‌بان جدید'
                                    : `ویرایش دیده‌بان ${vm.watchlistModal.originalName}`}
                            </h3>
                            <button
                                type="button"
                                onClick={vm.closeWatchlistModal}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close watchlist form"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                            <label htmlFor="watchlist-name" className="block text-sm font-medium text-text">
                                نام دیده‌بان
                            </label>
                            <input
                                id="watchlist-name"
                                value={vm.watchlistNameDraft}
                                autoFocus
                                maxLength={WATCHLIST_NAME_MAX_LENGTH}
                                onChange={(event) => {
                                    vm.setWatchlistNameDraft(event.target.value);
                                    vm.setWatchlistNameError(null);
                                }}
                                type="text"
                                placeholder="مثال: خریدهای آینده"
                                className={`h-10 w-full rounded-xl border bg-surface-2 px-3 text-sm text-text outline-none transition placeholder:text-muted focus:ring-2 ${
                                    vm.watchlistNameError
                                        ? 'border-negative/45 focus:border-negative/50 focus:ring-negative/25'
                                        : 'border-border/80 focus:border-primary/45 focus:ring-primary/30'
                                }`}
                            />

                            {vm.watchlistNameError ? (
                                <div className="flex items-center gap-1.5 text-xs text-negative">
                                    <AlertCircle className="h-3.5 w-3.5"/>
                                    {vm.watchlistNameError}
                                </div>
                            ) : null}
                        </div>

                        <div className="px-4 pb-4">
                            <button
                                type="submit"
                                disabled={vm.watchlistSubmitting}
                                className="flex h-10 w-full items-center justify-center rounded-lg bg-positive text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {vm.watchlistSubmitting ? (
                                    <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    در حال ذخیره...
                  </span>
                                ) : vm.watchlistModal.mode === 'create' ? (
                                    'ساخت دیده‌بان'
                                ) : (
                                    'ذخیره تغییرات'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {addToWatchlistModal ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={vm.closeAddToWatchlistModal}
                        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                        aria-label="close add to watchlist modal"
                    />
                    <div
                        dir="rtl"
                        className="relative w-full max-w-[360px] rounded-2xl border border-border/70 bg-surface shadow-card"
                    >
                        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-text">افزودن به دیده‌بان</h3>
                                <p className="mt-0.5 truncate text-xs text-muted">
                                    نماد {addToWatchlistModal.symbol.symbol}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={vm.closeAddToWatchlistModal}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close add to watchlist form"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                            <p className="text-sm text-text">می‌خواهید این نماد را در کدام دیده‌بان اضافه کنید؟</p>

                            <button
                                type="button"
                                onClick={vm.openCreateWatchlistFromAddModal}
                                disabled={vm.watchlistBusy}
                                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-positive/30 bg-positive/10 text-xs font-semibold text-positive transition hover:bg-positive/15 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Plus className="h-3.5 w-3.5"/>
                                ساخت دیده‌بان جدید
                            </button>

                            <div className="max-h-56 overflow-y-auto rounded-xl border border-border/70">
                                {vm.watchlists.map((watchlist) => {
                                    const alreadyAdded = watchlist.symbols.some(
                                        (item) => item.symbolKey === addToWatchlistModal.symbol.key
                                    );
                                    const isSelected = watchlist.id === vm.selectedWatchlistId;

                                    return (
                                        <button
                                            key={watchlist.id}
                                            type="button"
                                            disabled={alreadyAdded || vm.watchlistBusy}
                                            onClick={() => {
                                                void vm.handleAddSymbolToWatchlist(
                                                    watchlist.id,
                                                    addToWatchlistModal.symbol
                                                );
                                            }}
                                            className={`flex w-full items-center justify-between border-b border-border/60 px-3 py-2.5 text-right text-sm transition last:border-b-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                                                isSelected
                                                    ? 'bg-surface-2 text-text'
                                                    : 'text-muted hover:bg-surface-2 hover:text-text'
                                            }`}
                                        >
                                            <span className="truncate">{watchlist.name}</span>
                                            {alreadyAdded ? (
                                                <span className="mr-2 shrink-0 text-[11px] text-muted">اضافه شده</span>
                                            ) : isSelected ? (
                                                <Check className="mr-2 h-3.5 w-3.5 shrink-0 text-positive"/>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
