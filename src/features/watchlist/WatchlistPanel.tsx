import {AlertCircle} from 'lucide-react';
import IndustriesTabContent from '../industries/IndustriesTabContent';
import PopularSymbolsTabContent from '../popular-symbols/PopularSymbolsTabContent';
import type {AccountSummary} from '../trading/accountSummary';
import {cardClass} from '../trading-dashboard/styles';
import type {SidebarTab, UserProfile} from '../trading-dashboard/types';
import {WalletTabContent} from '../wallet/WalletTabContent';
import type {SymbolSearchSuggestion} from '../symbol-search/types';
import type {Watchlist} from './api';
import {SidebarTabBar} from './components/SidebarTabBar';
import {WatchlistDropdown} from './components/WatchlistDropdown';
import {WatchlistEmptyState} from './components/WatchlistEmptyState';
import {WatchlistSymbolsTable} from './components/WatchlistSymbolsTable';

export type WatchlistPanelProps = {
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
    /** Hide tab bar when opened from mobile drawer (tabs are in MobileNav). */
    hideTabBar?: boolean;
    /** Expand list height to fill drawer viewport. */
    fillHeight?: boolean;
    watchlists: Watchlist[];
    selectedWatchlistId: number | null;
    onSelectWatchlist: (watchlistId: number) => void;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onRequestCreateWatchlist: () => void;
    onRequestEditWatchlist: (watchlistId: number) => void;
    onRequestDeleteWatchlist: (watchlistId: number) => void;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
    onRemoveSymbol: (symbolId: number) => void;
    onToggleCurrentSymbol: () => void;
    watchlistBusy: boolean;
    currentSymbolLabel: string;
    currentSymbolKey: string | null;
    resolveLivePrice: (instrumentCode: string | null | undefined) => number | null;
    resolveLivePriceChange: (instrumentCode: string | null | undefined) => number | null;
    userProfile?: UserProfile;
    accountSummary: AccountSummary;
    accessToken: string;
    onProfileUpdated?: (profile: UserProfile) => void;
};

export function WatchlistPanel({
                                   activeTab,
                                   onTabChange,
                                   hideTabBar = false,
                                   fillHeight = false,
                                   watchlists,
                                   selectedWatchlistId,
                                   onSelectWatchlist,
                                   loading,
                                   error,
                                   onRetry,
                                   onRequestCreateWatchlist,
                                   onRequestEditWatchlist,
                                   onRequestDeleteWatchlist,
                                   onSelectSymbol,
                                   onRemoveSymbol,
                                   onToggleCurrentSymbol,
                                   watchlistBusy,
                                   currentSymbolLabel,
                                   currentSymbolKey,
                                   resolveLivePrice,
                                   resolveLivePriceChange,
                                   userProfile,
                                   accountSummary,
                                   accessToken,
                                   onProfileUpdated,
                               }: WatchlistPanelProps) {
    const selectedWatchlist =
        watchlists.find((watchlist) => watchlist.id === selectedWatchlistId) ?? watchlists[0] ?? null;
    const showWatchlistContent = activeTab === 'watchlist';

    return (
        <aside className={`${hideTabBar ? '' : cardClass} w-full min-w-0 ${hideTabBar ? '' : 'p-3'}`}>
            {!hideTabBar ? <SidebarTabBar activeTab={activeTab} onTabChange={onTabChange}/> : null}

            {activeTab === 'popular' ? (
                <PopularSymbolsTabContent
                    activeSymbolKey={currentSymbolKey}
                    onSelectSymbol={onSelectSymbol}
                    fillHeight={fillHeight}
                />
            ) : null}

            {activeTab === 'industries' ? (
                <IndustriesTabContent accessToken={accessToken} onSelectSymbol={onSelectSymbol}/>
            ) : null}

            {activeTab === 'wallet' ? (
                <WalletTabContent
                    userProfile={userProfile}
                    accountSummary={accountSummary}
                    accessToken={accessToken}
                    onProfileUpdated={onProfileUpdated}
                />
            ) : null}

            {showWatchlistContent && loading ? (
                <div className="space-y-2">
                    <div className="h-10 animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
                    <div className="h-[250px] animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
                </div>
            ) : null}

            {showWatchlistContent && !loading && error ? (
                <div className="rounded-xl border border-negative/35 bg-negative/10 p-3 text-xs text-negative">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4"/>
                        {error}
                    </div>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : null}

            {showWatchlistContent && !loading && !error && watchlists.length === 0 ? (
                <WatchlistEmptyState
                    title="دیده‌بان ندارید!"
                    help="جهت ساخت دیده‌بان، دکمه زیر را انتخاب کنید."
                    onCreate={onRequestCreateWatchlist}
                />
            ) : null}

            {showWatchlistContent && !loading && !error && watchlists.length > 0 && selectedWatchlist ? (
                <>
                    <WatchlistDropdown
                        watchlists={watchlists}
                        selectedWatchlist={selectedWatchlist}
                        onSelectWatchlist={onSelectWatchlist}
                        onRequestCreateWatchlist={onRequestCreateWatchlist}
                        onRequestEditWatchlist={onRequestEditWatchlist}
                        onRequestDeleteWatchlist={onRequestDeleteWatchlist}
                    />
                    <WatchlistSymbolsTable
                        watchlist={selectedWatchlist}
                        currentSymbolLabel={currentSymbolLabel}
                        watchlistBusy={watchlistBusy}
                        onSelectSymbol={onSelectSymbol}
                        onRemoveSymbol={onRemoveSymbol}
                        onToggleCurrentSymbol={onToggleCurrentSymbol}
                        resolveLivePrice={resolveLivePrice}
                        resolveLivePriceChange={resolveLivePriceChange}
                    />
                </>
            ) : null}
        </aside>
    );
}
