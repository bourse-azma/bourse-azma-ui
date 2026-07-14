import {useCallback, useEffect, useRef, useState} from 'react';
import {appConfig} from '../../../config/appConfig';
import {withAuthRequest} from '../../../lib/authRequest';
import {
    cancelTradingOrder,
    type CreateOrderResult,
    DEFAULT_TRADING_RULES,
    getPortfolioHoldings,
    getTradingOrders,
    getTradingRules,
    type OrderSide,
    type PortfolioHolding,
    type TradingOrder,
    type TradingRules,
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
    const ordersLoadingMoreRef = useRef(false);
    const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([]);
    const [tradingAccountLoading, setTradingAccountLoading] = useState(true);
    const [tradingAccountError, setTradingAccountError] = useState<string | null>(null);
    const [orderModalSide, setOrderModalSide] = useState<OrderSide | null>(null);
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const cancellingOrderIdRef = useRef<number | null>(null);
    const [editingOrder, setEditingOrder] = useState<TradingOrder | null>(null);
    const [tradingRules, setTradingRules] = useState<TradingRules>(DEFAULT_TRADING_RULES);
    const accountRequestIdRef = useRef(0);
    const ordersListGenerationRef = useRef(0);
    const profileRequestIdRef = useRef(0);

    const loadTradingAccount = useCallback(async (silent = false, appendOrders = false) => {
        if (appendOrders) {
            const listGeneration = ordersListGenerationRef.current;
            const pageToLoad = ordersPageRef.current + 1;
            try {
                const ordersResult = await getTradingOrders(accessToken, pageToLoad, ORDERS_PAGE_SIZE);
                if (listGeneration !== ordersListGenerationRef.current) return;
                setTradingOrders((prev) => {
                    const existingIds = new Set(prev.map((order) => order.id));
                    return [...prev, ...ordersResult.items.filter((order) => !existingIds.has(order.id))];
                });
                ordersPageRef.current = ordersResult.page;
                setOrdersHasMore(ordersResult.hasNext);
            } catch {
                // Keep the already loaded orders. A later scroll or account refresh can retry.
            }
            return;
        }

        const requestId = ++accountRequestIdRef.current;
        ordersListGenerationRef.current += 1;
        if (!silent && !appendOrders) {
            setTradingAccountLoading(true);
            setTradingAccountError(null);
        }
        try {
            const [ordersResult, activeOrdersResult, holdings] = await Promise.all([
                getTradingOrders(accessToken, 0, ORDERS_PAGE_SIZE),
                getTradingOrders(accessToken, 0, 100, ACTIVE_ORDER_STATUSES),
                getPortfolioHoldings(accessToken),
            ]);
            // A slower, older response must never overwrite a newer post-trade snapshot.
            if (requestId !== accountRequestIdRef.current) return;
            setTradingOrders(ordersResult.items);
            ordersPageRef.current = ordersResult.page;
            setOrdersHasMore(ordersResult.hasNext);
            setActiveOrdersForSummary(
                activeOrdersResult.items.filter((order) => order.remainingQuantity > 0)
            );
            setPortfolioHoldings(holdings);
            setTradingAccountError(null);
        } catch (error) {
            if (requestId !== accountRequestIdRef.current) return;
            if (!silent) {
                setTradingAccountError(error instanceof Error ? error.message : 'دریافت اطلاعات معاملاتی ناموفق بود.');
                setTradingOrders([]);
                setActiveOrdersForSummary([]);
                setPortfolioHoldings([]);
                setOrdersHasMore(false);
                ordersPageRef.current = 0;
            }
        } finally {
            if (requestId === accountRequestIdRef.current && !silent) {
                setTradingAccountLoading(false);
            }
        }
    }, [accessToken]);

    const loadMoreOrders = useCallback(async () => {
        if (ordersLoadingMoreRef.current || !ordersHasMore) {
            return;
        }
        ordersLoadingMoreRef.current = true;
        setOrdersLoadingMore(true);
        try {
            await loadTradingAccount(true, true);
        } finally {
            ordersLoadingMoreRef.current = false;
            setOrdersLoadingMore(false);
        }
    }, [loadTradingAccount, ordersHasMore]);

    const refreshAccountStatus = useCallback(async () => {
        const tasks: Promise<void>[] = [loadTradingAccount(true)];

        if (onProfileUpdated) {
            const profileRequestId = ++profileRequestIdRef.current;
            tasks.push(
                (async () => {
                    try {
                        const response = await fetch('/api/v1/users/me', withAuthRequest(accessToken, {
                            method: 'GET',
                        }));
                        if (!response.ok) return;
                        const data = (await response.json()) as { result?: UserProfile };
                        if (data.result && profileRequestId === profileRequestIdRef.current) {
                            onProfileUpdated(data.result);
                        }
                    } catch {
                        // Portfolio/orders have their own refresh lifecycle; a transient profile
                        // request failure must not stop polling or turn a successful edit into an error.
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
            if (cancellingOrderIdRef.current !== null) return;
            cancellingOrderIdRef.current = orderId;
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
                cancellingOrderIdRef.current = null;
                setCancellingOrderId(null);
            }
        },
        [accessToken, refreshAccountStatus, showWatchlistToast]
    );

    const openEditOrder = useCallback((orderId: number) => {
        const order = tradingOrders.find((candidate) => candidate.id === orderId);
        if (order?.cancellable) {
            setEditingOrder(order);
        }
    }, [tradingOrders]);

    useEffect(() => {
        void loadTradingAccount();
        return () => {
            accountRequestIdRef.current += 1;
            ordersListGenerationRef.current += 1;
            profileRequestIdRef.current += 1;
            ordersLoadingMoreRef.current = false;
            cancellingOrderIdRef.current = null;
        };
    }, [loadTradingAccount]);

    useEffect(() => {
        let active = true;
        void getTradingRules(accessToken)
            .then((rules) => {
                if (active) setTradingRules(rules);
            })
            .catch(() => {
                // Keep safe UI defaults; the API remains the source of truth on submission.
            });
        return () => {
            active = false;
        };
    }, [accessToken]);

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
        editingOrder,
        setEditingOrder,
        openEditOrder,
        tradingRules,
    };
}
