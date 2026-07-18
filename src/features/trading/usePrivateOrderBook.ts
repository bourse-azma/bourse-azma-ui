import {useCallback, useEffect, useRef, useState} from 'react';
import type {TradingOrder} from './api';
import {getPrivateOrderBook, type PrivateOrderBook} from './api';
import {type MarketDataUpdate, marketTopic, ORDER_UPDATES_QUEUE} from '../../services/realtimeTypes';
import {webSocketService} from '../../services/webSocketService';

export const usePrivateOrderBook = (
    accessToken: string,
    instrumentCode: string,
    enabled: boolean,
    refreshKey: string
) => {
    const [data, setData] = useState<PrivateOrderBook | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasDataRef = useRef(false);
    const requestIdRef = useRef(0);
    const bookIdentityRef = useRef('');

    const fetchBook = useCallback(async (signal?: AbortSignal) => {
        if (!enabled || !instrumentCode) return;
        const requestId = ++requestIdRef.current;
        if (!hasDataRef.current) setLoading(true);
        try {
            const result = await getPrivateOrderBook(accessToken, instrumentCode, signal);
            if (signal?.aborted || requestId !== requestIdRef.current) return;
            hasDataRef.current = true;
            setData(result);
            setError(null);
        } catch (cause) {
            if (signal?.aborted || requestId !== requestIdRef.current) return;
            setError(cause instanceof Error ? cause.message : 'دریافت دفتر سفارش اختصاصی ناموفق بود.');
        } finally {
            if (!signal?.aborted && requestId === requestIdRef.current) setLoading(false);
        }
    }, [accessToken, enabled, instrumentCode]);

    useEffect(() => {
        const bookIdentity = `${accessToken}\u0000${instrumentCode}`;
        if (bookIdentityRef.current !== bookIdentity) {
            bookIdentityRef.current = bookIdentity;
            hasDataRef.current = false;
            setData(null);
        }
        setError(null);
        if (!enabled || !instrumentCode) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let timer: number | undefined;
        const scheduleRefresh = () => {
            if (timer !== undefined) window.clearTimeout(timer);
            timer = window.setTimeout(() => void fetchBook(controller.signal), 50);
        };
        void fetchBook(controller.signal);
        const unsubscribeMarket = webSocketService.subscribeJson<MarketDataUpdate>(
            accessToken,
            marketTopic(instrumentCode),
            (update) => {
                if (update.instrumentCode === instrumentCode) scheduleRefresh();
            },
            {onReconnect: scheduleRefresh}
        );
        const unsubscribeOrders = webSocketService.subscribeJson<TradingOrder>(
            accessToken,
            ORDER_UPDATES_QUEUE,
            (order) => {
                if (order.instrumentCode === instrumentCode) scheduleRefresh();
            },
            {onReconnect: scheduleRefresh}
        );

        return () => {
            controller.abort();
            requestIdRef.current += 1;
            if (timer !== undefined) window.clearTimeout(timer);
            unsubscribeMarket();
            unsubscribeOrders();
        };
    }, [accessToken, enabled, fetchBook, instrumentCode, refreshKey]);

    return {data, loading, error, refresh: fetchBook};
};
