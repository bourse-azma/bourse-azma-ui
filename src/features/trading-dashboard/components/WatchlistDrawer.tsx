import {X} from 'lucide-react';
import {useRef} from 'react';
import {WatchlistPanel} from '../../watchlist/WatchlistPanel';
import type {SidebarTab, TradingDashboardProps} from '../types';
import type {TradingDashboardVm} from './types';

const drawerTitles: Record<SidebarTab, string> = {
    watchlist: 'دیده‌بان',
    popular: 'پرطرفدار',
    industries: 'صنایع',
    wallet: 'کیف پول',
};

export function WatchlistDrawer({vm, accessToken, userProfile, onProfileUpdated}: {
    vm: TradingDashboardVm;
    accessToken: string;
    userProfile?: TradingDashboardProps['userProfile'];
    onProfileUpdated?: TradingDashboardProps['onProfileUpdated']
}) {
    const drawerScrollRef = useRef<HTMLDivElement | null>(null);

    if (!vm.drawerOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
            <header
                className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <h3 className="text-base font-semibold text-text">{drawerTitles[vm.sidebarTab]}</h3>

                <button
                    type="button"
                    onClick={() => vm.setDrawerOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                    aria-label="بستن"
                >
                    <X className="h-4 w-4"/>
                </button>
            </header>

            <div
                ref={drawerScrollRef}
                className="thin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
                <WatchlistPanel
                    activeTab={vm.sidebarTab}
                    onTabChange={vm.setSidebarTab}
                    hideTabBar
                    fillHeight
                    scrollRootRef={drawerScrollRef}
                    watchlists={vm.watchlists}
                    selectedWatchlistId={vm.selectedWatchlistId}
                    onSelectWatchlist={vm.setSelectedWatchlistId}
                    loading={vm.watchlistsLoading}
                    error={vm.watchlistsError}
                    onRetry={() => void vm.loadWatchlists()}
                    onRequestCreateWatchlist={vm.openCreateWatchlistModal}
                    onRequestEditWatchlist={vm.openEditWatchlistModal}
                    onRequestDeleteWatchlist={(watchlistId) => void vm.handleDeleteWatchlist(watchlistId)}
                    onSelectSymbol={vm.handleSelectSymbol}
                    onRemoveSymbol={(symbolId) => void vm.handleRemoveSymbolFromWatchlist(symbolId)}
                    onToggleCurrentSymbol={() => void vm.handleToggleFavorite()}
                    watchlistBusy={vm.watchlistBusy}
                    currentSymbolLabel={vm.selectedSymbol.symbol}
                    currentSymbolKey={vm.selectedSymbol.key}
                    resolveLivePrice={vm.resolveDisplayLivePrice}
                    resolveLivePriceChange={vm.resolveDisplayLivePriceChange}
                    userProfile={userProfile}
                    accountSummary={vm.accountSummary}
                    accessToken={accessToken}
                    maximumWalletAdjustment={vm.tradingRules.maximumWalletAdjustment}
                    onProfileUpdated={onProfileUpdated}
                />
            </div>
        </div>
    );
}
