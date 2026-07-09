import {Loader2, Star} from 'lucide-react';
import SymbolSearchCombobox from '../../symbol-search/SymbolSearchCombobox';
import {actionBtnClass} from '../styles';
import type {TradingDashboardVm} from './types';

export function MarketActionBar({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            <section className="border-t border-border/40 px-3 py-1.5 sm:px-4 sm:py-2">
                <div
                    className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center [direction:ltr]">
                    <div dir="rtl" className="order-2 flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 lg:order-1">
                        <button
                            type="button"
                            onClick={() => vm.setOrderModalSide('BUY')}
                            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-positive px-3 text-xs font-semibold text-white shadow-glow transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-positive/50 sm:h-10 sm:flex-none sm:px-4 sm:text-sm lg:h-10 lg:w-24 lg:flex-none"
                        >
                            خرید
                        </button>

                        <button
                            type="button"
                            onClick={() => vm.setOrderModalSide('SELL')}
                            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-negative px-3 text-xs font-semibold text-white transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-negative/50 sm:h-10 sm:flex-none sm:px-4 sm:text-sm lg:h-10 lg:w-24 lg:flex-none"
                        >
                            فروش
                        </button>

                        <button
                            type="button"
                            onClick={() => void vm.handleToggleFavorite()}
                            disabled={vm.watchlistBusy}
                            title={vm.favoriteButtonTitle}
                            className={`${actionBtnClass} h-9 w-9 shrink-0 sm:h-10 sm:w-10 lg:h-10 lg:w-10 disabled:cursor-not-allowed disabled:opacity-70`}
                            aria-label="favorite"
                        >
                            {vm.watchlistBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin text-warning"/>
                            ) : (
                                <Star
                                    className={`h-4 w-4 transition ${
                                        vm.isSymbolInSelectedWatchlist ? 'fill-positive text-positive' : 'text-warning'
                                    }`}
                                />
                            )}
                        </button>
                    </div>

                    <div className="order-1 min-w-0 flex-1 lg:order-2">
                        <SymbolSearchCombobox
                            selectedSymbol={vm.selectedSymbol}
                            onSelectSymbol={vm.setSelectedSymbol}
                            onPreviewSymbolChange={vm.setPreviewSymbol}
                            placeholder="جستجوی نماد یا شرکت"
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
