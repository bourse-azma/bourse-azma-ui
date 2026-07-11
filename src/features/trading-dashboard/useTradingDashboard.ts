import {useMemo} from 'react';
import {formatNumberFa} from '../../utils/numberFormat';
import {useDashboardNavigation} from './hooks/useDashboardNavigation';
import {useSelectedSymbolState} from './hooks/useSelectedSymbolState';
import {useWatchlistManagement} from './hooks/useWatchlistManagement';
import {useTradingAccountState} from './hooks/useTradingAccountState';
import {useNoticeBoardState} from './hooks/useNoticeBoardState';
import {useMarketMetrics} from './hooks/useMarketMetrics';
import type {OrderFilter, TradingDashboardProps} from './types';

export function useTradingDashboard({
                                        loginEpoch,
                                        accessToken,
                                        userProfile,
                                        onProfileUpdated,
                                    }: Pick<TradingDashboardProps, 'loginEpoch' | 'accessToken' | 'userProfile' | 'onProfileUpdated'>) {
    const navigation = useDashboardNavigation({userProfile});
    const {resetSymbolTab, ...nav} = navigation;

    const symbol = useSelectedSymbolState({
        loginEpoch,
        setDrawerOpen: navigation.setDrawerOpen,
        resetSymbolTab,
    });

    const watchlist = useWatchlistManagement({
        accessToken,
        selectedSymbol: symbol.selectedSymbol,
        setMainNavTab: navigation.setMainNavTab,
        setSidebarTab: navigation.setSidebarTab,
        setDrawerOpen: navigation.setDrawerOpen,
    });
    const {selectedWatchlist, showWatchlistToast, ...watchlistVm} = watchlist;

    const account = useTradingAccountState({
        accessToken,
        onProfileUpdated,
        isMarketViewActive: navigation.isMarketViewActive,
        setBottomPanelTab: navigation.setBottomPanelTab,
        showWatchlistToast,
    });
    const {activeOrdersForSummary, ...accountVm} = account;

    const metrics = useMarketMetrics({
        accessToken,
        selectedSymbol: symbol.selectedSymbol,
        isMarketViewActive: navigation.isMarketViewActive,
        orderbookTab: navigation.orderbookTab,
        symbolTab: navigation.symbolTab,
        bottomPanelTab: navigation.bottomPanelTab,
        sidebarTab: navigation.sidebarTab,
        orderFilter: navigation.orderFilter,
        tradingOrders: account.tradingOrders,
        activeOrdersForSummary,
        portfolioHoldings: account.portfolioHoldings,
        tradingAccountError: account.tradingAccountError,
        selectedWatchlist,
        userProfile,
    });

    const notices = useNoticeBoardState({
        isMarketViewActive: navigation.isMarketViewActive,
        selectedSymbol: symbol.selectedSymbol,
        symbolTab: navigation.symbolTab,
    });

    const orderFilters: Array<{ key: OrderFilter; label: string }> = useMemo(
        () => [
            {
                key: 'open',
                label: `فعال ${formatNumberFa(metrics.demoOrders.filter((o) => o.status === 'REQUESTED' || o.status === 'TRIGGER_PENDING').length)}`
            },
            {
                key: 'partial',
                label: `اجرای جزئی ${formatNumberFa(metrics.demoOrders.filter((o) => o.status === 'PARTIALLY_FILLED').length)}`
            },
            {
                key: 'done',
                label: `انجام شده ${formatNumberFa(metrics.demoOrders.filter((o) => o.status === 'COMPLETED').length)}`
            },
            {
                key: 'cancelled',
                label: `لغو شده ${formatNumberFa(metrics.demoOrders.filter((o) => o.status === 'CANCELLED').length)}`
            },
            {
                key: 'failed',
                label: `ناموفق ${formatNumberFa(metrics.demoOrders.filter((o) => o.status === 'FAILED').length)}`
            },
            {key: 'all', label: `همه ${formatNumberFa(metrics.demoOrders.length)}`},
        ],
        [metrics.demoOrders]
    );

    return {...nav, ...symbol, ...metrics, ...accountVm, ...watchlistVm, ...notices, orderFilters};
}
