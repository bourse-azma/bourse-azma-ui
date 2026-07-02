import {Bell, Loader2, Star} from 'lucide-react';
import SymbolSearchCombobox from '../../symbol-search/SymbolSearchCombobox';
import {actionBtnClass} from '../styles';
import type {TradingDashboardVm} from './types';

export function MarketActionBar({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            <section className="px-3 py-2 sm:px-4">
                <div
                    className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center [direction:ltr]">
                    <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
                        <button
                            type="button"
                            onClick={() => vm.setOrderModalSide('BUY')}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-positive px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-positive/50"
                        >
                            خرید
                        </button>

                        <button
                            type="button"
                            onClick={() => vm.setOrderModalSide('SELL')}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-negative px-4 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-negative/50"
                        >
                            فروش
                        </button>

                        <button
                            type="button"
                            onClick={() => void vm.handleToggleFavorite()}
                            disabled={vm.watchlistBusy}
                            title={vm.favoriteButtonTitle}
                            className={`${actionBtnClass} w-10 disabled:cursor-not-allowed disabled:opacity-70`}
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

                        <button
                            type="button"
                            onClick={vm.openWatchlistDrawer}
                            className={`${actionBtnClass} w-10 md:hidden`}
                            aria-label="open watchlist"
                        >
                            <Bell className="h-4 w-4"/>
                        </button>
                    </div>

                    <SymbolSearchCombobox
                        selectedSymbol={vm.selectedSymbol}
                        onSelectSymbol={vm.setSelectedSymbol}
                        onPreviewSymbolChange={vm.setPreviewSymbol}
                        placeholder="جستجوی نماد یا شرکت"
                    />

                    <div className="hidden lg:flex lg:col-span-2 lg:justify-end">
                        <button
                            type="button"
                            onClick={vm.openWatchlistSection}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-3 text-xs text-muted transition hover:text-text"
                            aria-label="open watchlist"
                        >
                            <Bell className="h-4 w-4"/>
                            دیده‌بان
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}
