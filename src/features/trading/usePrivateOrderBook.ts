import {useCallback, useEffect, useRef, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {getPrivateOrderBook, type PrivateOrderBook} from './api';

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
        let disposed = false;
        let timer: number | undefined;
        const poll = async () => {
            await fetchBook(controller.signal);
            if (!disposed) {
                timer = window.setTimeout(poll, appConfig.tsetmcBestLimitsRefreshMs);
            }
        };
        void poll();

        return () => {
            disposed = true;
            controller.abort();
            requestIdRef.current += 1;
            if (timer !== undefined) window.clearTimeout(timer);
        };
    }, [enabled, fetchBook, instrumentCode, refreshKey]);

    return {data, loading, error, refresh: fetchBook};
};
