import {useCallback, useEffect, useRef, useState} from 'react';
import {appConfig} from '../../../config/appConfig';
import {withAuthRequest} from '../../../lib/authRequest';
import {
    cancelTradingOrder,
    type CreateOrderResult,
    getPortfolioHoldings,
    getTradingOrders,
    type OrderSide,
    type PortfolioHolding,
    type TradingOrder,
} from '../../trading/api';
import {ACTIVE_ORDER_STATUSES, ORDERS_PAGE_SIZE} from '../constants';
import type {BottomPanelTab, UserProfile} from '../types';

type UseTradingAccountStateParams = {
    accessToken: string;
    onProfileUpdated?: (profile: UserProfile) => void;
    isMarketViewActive: boolean;
    setBottomPanelTab: (tab: BottomPanelTab) => void;
    showWatchlistToast: (message: string, tone?: 'success' | 'error', title?: string) => void;
};

export function useTradingAccountState({
                                           accessToken,
                                           onProfileUpdated,
                                           isMarketViewActive,
                                           setBottomPanelTab,
                                           showWatchlistToast,
                                       }: UseTradingAccountStateParams) {
    const [tradingOrders, setTradingOrders] = useState<TradingOrder[]>([]);
    const [activeOrdersForSummary, setActiveOrdersForSummary] = useState<TradingOrder[]>([]);
    const [ordersHasMore, setOrdersHasMore] = useState(false);
    const [ordersLoadingMore, setOrdersLoadingMore] = useState(false);
    const ordersPageRef = useRef(0);
    const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([]);
    const [tradingAccountLoading, setTradingAccountLoading] = useState(true);
    const [tradingAccountError, setTradingAccountError] = useState<string | null>(null);
    const [orderModalSide, setOrderModalSide] = useState<OrderSide | null>(null);
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

    const loadTradingAccount = useCallback(async (silent = false, appendOrders = false) => {
        if (!silent && !appendOrders) {
            setTradingAccountLoading(true);
            setTradingAccountError(null);
        }
        const pageToLoad = appendOrders ? ordersPageRef.current + 1 : 0;
        try {
            const [ordersResult, activeOrdersResult, holdings] = await Promise.all([
                getTradingOrders(accessToken, pageToLoad, ORDERS_PAGE_SIZE),
                appendOrders
                    ? Promise.resolve(null)
                    : getTradingOrders(accessToken, 0, 100, ACTIVE_ORDER_STATUSES),
                getPortfolioHoldings(accessToken),
            ]);
            setTradingOrders((prev) => (appendOrders ? [...prev, ...ordersResult.items] : ordersResult.items));
            ordersPageRef.current = ordersResult.page;
            setOrdersHasMore(ordersResult.hasNext);
            if (!appendOrders && activeOrdersResult) {
                setActiveOrdersForSummary(
                    activeOrdersResult.items.filter((order) => order.remainingQuantity > 0)
                );
            }
            setPortfolioHoldings(holdings);
            setTradingAccountError(null);
        } catch (error) {
            if (!silent && !appendOrders) {
                setTradingAccountError(error instanceof Error ? error.message : 'دریافت اطلاعات معاملاتی ناموفق بود.');
                setTradingOrders([]);
                setActiveOrdersForSummary([]);
                setPortfolioHoldings([]);
                setOrdersHasMore(false);
                ordersPageRef.current = 0;
            }
        } finally {
            if (!silent && !appendOrders) {
                setTradingAccountLoading(false);
            }
        }
    }, [accessToken]);

    const loadMoreOrders = useCallback(async () => {
        if (ordersLoadingMore || !ordersHasMore) {
            return;
        }
        setOrdersLoadingMore(true);
        try {
            await loadTradingAccount(true, true);
        } finally {
            setOrdersLoadingMore(false);
        }
    }, [loadTradingAccount, ordersHasMore, ordersLoadingMore]);

    const refreshAccountStatus = useCallback(async () => {
        const tasks: Promise<void>[] = [loadTradingAccount(true)];

        if (onProfileUpdated) {
            tasks.push(
                (async () => {
                    const response = await fetch('/api/v1/users/me', withAuthRequest(accessToken, {
                        method: 'GET',
                    }));
                    if (!response.ok) return;
                    const data = (await response.json()) as { result?: UserProfile };
                    if (data.result) {
                        onProfileUpdated(data.result);
                    }
                })()
            );
        }

        await Promise.all(tasks);
    }, [accessToken, loadTradingAccount, onProfileUpdated]);

    const handleOrderPlaced = useCallback(
        (_result: CreateOrderResult, _closeAfter: boolean) => {
            void _result;
            void _closeAfter;
            setBottomPanelTab('orders');
            void refreshAccountStatus();
        },
        [refreshAccountStatus, setBottomPanelTab]
    );

    const handleCancelOrder = useCallback(
        async (orderId: number) => {
            if (cancellingOrderId !== null) return;
            setCancellingOrderId(orderId);
            try {
                const result = await cancelTradingOrder(accessToken, orderId);
                showWatchlistToast(`سفارش ${result.order.sideLabel} نماد ${result.order.symbol} لغو شد.`, 'success');
                void refreshAccountStatus();
            } catch (error) {
                showWatchlistToast(
                    error instanceof Error ? error.message : 'لغو سفارش ناموفق بود.',
                    'error'
                );
            } finally {
                setCancellingOrderId(null);
            }
        },
        [accessToken, cancellingOrderId, refreshAccountStatus, showWatchlistToast]
    );

    useEffect(() => {
        void loadTradingAccount();
    }, [loadTradingAccount]);

    useEffect(() => {
        if (!isMarketViewActive) {
            return;
        }

        let timer: number | undefined;

        const tick = async () => {
            await refreshAccountStatus();
            timer = window.setTimeout(tick, appConfig.tradingOrdersRefreshMs);
        };

        timer = window.setTimeout(tick, appConfig.tradingOrdersRefreshMs);
        return () => {
            if (timer !== undefined) {
                window.clearTimeout(timer);
            }
        };
    }, [isMarketViewActive, refreshAccountStatus]);

    return {
        tradingOrders,
        activeOrdersForSummary,
        portfolioHoldings,
        tradingAccountLoading,
        tradingAccountError,
        ordersHasMore,
        ordersLoadingMore,
        loadMoreOrders,
        refreshAccountStatus,
        orderModalSide,
        setOrderModalSide,
        handleOrderPlaced,
        cancellingOrderId,
        handleCancelOrder,
    };
}
