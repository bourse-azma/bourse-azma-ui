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

    const fetchBook = useCallback(async (signal?: AbortSignal) => {
        if (!enabled || !instrumentCode) return;
        if (!hasDataRef.current) setLoading(true);
        try {
            const result = await getPrivateOrderBook(accessToken, instrumentCode, signal);
            if (signal?.aborted) return;
            hasDataRef.current = true;
            setData(result);
            setError(null);
        } catch (cause) {
            if (signal?.aborted) return;
            setError(cause instanceof Error ? cause.message : 'دریافت دفتر سفارش اختصاصی ناموفق بود.');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [accessToken, enabled, instrumentCode]);

    useEffect(() => {
        hasDataRef.current = false;
        setData(null);
        setError(null);
        if (!enabled || !instrumentCode) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        void fetchBook(controller.signal);
        const timer = window.setInterval(
            () => void fetchBook(controller.signal),
            appConfig.tsetmcBestLimitsRefreshMs
        );
        return () => {
            controller.abort();
            window.clearInterval(timer);
        };
    }, [enabled, fetchBook, instrumentCode, refreshKey]);

    return {data, loading, error, refresh: fetchBook};
};
