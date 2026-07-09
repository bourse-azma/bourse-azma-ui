import AccountStatusBar from './features/trading/AccountStatusBar';
import OrderPlacementModal from './features/trading/order-placement/OrderPlacementModal';
import AdminSupportPanel from './features/support/AdminSupportPanel';
import SupportRequestsPanel from './features/support/SupportRequestsPanel';
import {WalletReportsPanel} from './features/wallet/WalletReportsPanel';
import {WatchlistPanel} from './features/watchlist/WatchlistPanel';
import {formatNumberFa} from './utils/numberFormat';
import {BottomTradingPanel} from './features/trading-dashboard/components/BottomTradingPanel';
import {DashboardHeader} from './features/trading-dashboard/components/DashboardHeader';
import {MarketActionBar} from './features/trading-dashboard/components/MarketActionBar';
import {MobileMainNav} from './features/trading-dashboard/components/MobileMainNav';
import {NoticeDetailModal} from './features/trading-dashboard/components/NoticeDetailModal';
import {NoticeFilterModal} from './features/trading-dashboard/components/NoticeFilterModal';
import {OrderBookSection} from './features/trading-dashboard/components/OrderBookSection';
import {SupervisorNoticesPanel} from './features/trading-dashboard/components/SupervisorNoticesPanel';
import {SymbolInfoSection} from './features/trading-dashboard/components/SymbolInfoSection';
import {WatchlistDrawer} from './features/trading-dashboard/components/WatchlistDrawer';
import {WatchlistModals} from './features/trading-dashboard/components/WatchlistModals';
import {WatchlistToast} from './features/trading-dashboard/components/WatchlistToast';
import type {TradingDashboardProps} from './features/trading-dashboard/types';
import {useTradingDashboard} from './features/trading-dashboard/useTradingDashboard';

export default function TradingDashboard(props: TradingDashboardProps) {
    const {
        loginEpoch,
        theme,
        accessToken,
        onToggleTheme,
        profileDisplayName,
        onOpenProfile,
        onLogout,
        userProfile,
        onProfileUpdated,
    } = props;

    const vm = useTradingDashboard({loginEpoch, accessToken, userProfile, onProfileUpdated});

    return (
        <div className="min-h-screen overflow-x-clip bg-bg text-text transition-colors duration-300">
            <div
                className="sticky top-0 z-50 border-b border-border/70 bg-surface/85 pt-[env(safe-area-inset-top,0px)] shadow-card backdrop-blur-xl dark:shadow-none">
                <DashboardHeader
                    vm={vm}
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                    profileDisplayName={profileDisplayName}
                    onOpenProfile={onOpenProfile}
                    onLogout={onLogout}
                />
                <MarketActionBar vm={vm}/>
                <MobileMainNav vm={vm}/>
            </div>

            <main
                className="mx-auto w-full min-w-0 max-w-[1800px] space-y-4 px-3 py-3 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 sm:pb-28">
                {vm.mainNavTab === 'گزارشات' ? (
                    <WalletReportsPanel
                        accessToken={accessToken}
                        walletBalance={userProfile?.balance ?? 0}
                        enabled={vm.mainNavTab === 'گزارشات'}
                    />
                ) : vm.isSupportTabActive && vm.isAdmin ? (
                    <AdminSupportPanel accessToken={accessToken} enabled={vm.isSupportTabActive}/>
                ) : vm.isSupportTabActive ? (
                    <SupportRequestsPanel accessToken={accessToken} enabled={vm.isSupportTabActive}/>
                ) : (
                    <>
                        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 [direction:ltr]">
                            <OrderBookSection vm={vm}/>
                            <SymbolInfoSection vm={vm}/>
                            <div className="hidden self-start md:col-span-2 md:block xl:col-span-3">
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
                        </section>

                        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 [direction:ltr]">
                            <BottomTradingPanel vm={vm}/>
                            <SupervisorNoticesPanel vm={vm}/>
                        </section>
                    </>
                )}
            </main>

            <AccountStatusBar summary={vm.accountSummary} onDepositClick={vm.openWalletPanel}/>

            {vm.orderModalSide ? (
                <OrderPlacementModal
                    open
                    initialSide={vm.orderModalSide}
                    symbol={vm.orderSymbolContext}
                    orderBookRows={vm.orderBookRows}
                    context={vm.orderValidationContext}
                    accessToken={accessToken}
                    formatNumber={(value, digits) =>
                        value === null || value === undefined || Number.isNaN(value)
                            ? '—'
                            : formatNumberFa(value, digits)
                    }
                    onClose={() => vm.setOrderModalSide(null)}
                    onOrderPlaced={vm.handleOrderPlaced}
                />
            ) : null}

            <WatchlistToast vm={vm}/>
            <WatchlistModals vm={vm}/>
            <WatchlistDrawer vm={vm} accessToken={accessToken} userProfile={userProfile}
                             onProfileUpdated={onProfileUpdated}/>
            <NoticeFilterModal vm={vm}/>
            <NoticeDetailModal vm={vm}/>
        </div>
    );
}

// Re-export for backwards compatibility
export {useClock} from './hooks/useClock';
