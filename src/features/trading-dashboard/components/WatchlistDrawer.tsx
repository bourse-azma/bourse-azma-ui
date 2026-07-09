import {X} from 'lucide-react';
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
    return (
        <>
            {vm.drawerOpen ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        onClick={() => vm.setDrawerOpen(false)}
                        className="absolute inset-0 bg-black/40"
                        aria-label="close drawer"
                    />

                    <div
                        className="thin-scrollbar absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto border-l border-border/70 bg-surface p-3 shadow-card">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-text">{drawerTitles[vm.sidebarTab]}</h3>

                            <button
                                type="button"
                                onClick={() => vm.setDrawerOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <WatchlistPanel
                            activeTab={vm.sidebarTab}
                            onTabChange={vm.setSidebarTab}
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
                            onProfileUpdated={onProfileUpdated}
                        />
                    </div>
                </div>
            ) : null}
        </>
    );
}
