import {Loader2, Star} from 'lucide-react';
import SymbolSearchCombobox from '../../symbol-search/SymbolSearchCombobox';
import {actionBtnClass} from '../styles';
import type {TradingDashboardVm} from './types';

export function MarketActionBar({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            <section className="border-t border-border/40 px-3 py-1.5 sm:px-4 sm:py-2">
                <div
                    className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-[auto_1fr] lg:items-center [direction:ltr]">
                    <div dir="rtl" className="flex min-w-0 items-center gap-1.5 sm:gap-2 lg:justify-start">
                        <button
                            type="button"
                            onClick={() => vm.setOrderModalSide('BUY')}
                            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-positive px-3 text-xs font-semibold text-white shadow-glow transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-positive/50 sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
                        >
                            خرید
                        </button>

                        <button
                            type="button"
                            onClick={() => vm.setOrderModalSide('SELL')}
                            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-negative px-3 text-xs font-semibold text-white transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-negative/50 sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
                        >
                            فروش
                        </button>

                        <button
                            type="button"
                            onClick={() => void vm.handleToggleFavorite()}
                            disabled={vm.watchlistBusy}
                            title={vm.favoriteButtonTitle}
                            className={`${actionBtnClass} h-9 w-9 shrink-0 sm:h-10 sm:w-10 disabled:cursor-not-allowed disabled:opacity-70`}
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

                    <SymbolSearchCombobox
                        selectedSymbol={vm.selectedSymbol}
                        onSelectSymbol={vm.setSelectedSymbol}
                        onPreviewSymbolChange={vm.setPreviewSymbol}
                        placeholder="جستجوی نماد یا شرکت"
                    />
                </div>
            </section>
        </>
    );
}
