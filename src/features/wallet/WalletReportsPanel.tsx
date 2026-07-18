import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Loader2, Wallet,} from 'lucide-react';
import {getInfiniteScrollTriggerIndex} from '../../config/scrollConfig';
import {useInfiniteScrollLoadMore} from '../../hooks/useInfiniteScrollLoadMore';
import {type PagedResult, withAuthRequest} from '../../lib/authRequest';
import {cardClass} from '../trading-dashboard/styles';
import type {WalletTx, WalletTxSummary} from './types';
import WalletReportsSummary from './WalletReportsSummary';
import WalletTransactionList from './WalletTransactionList';
import type {TradingOrder} from '../trading/api';
import {ORDER_UPDATES_QUEUE} from '../../services/realtimeTypes';
import {webSocketService} from '../../services/webSocketService';

export function WalletReportsPanel({
                                       accessToken,
                                       walletBalance,
                                       enabled,
                                   }: {
    accessToken: string;
    walletBalance: number;
    enabled: boolean;
}) {
    const [txs, setTxs] = useState<WalletTx[]>([]);
    const [summary, setSummary] = useState<WalletTxSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
    const hasLoadedOnceRef = useRef(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await fetch('/api/v1/wallet/transactions/summary', withAuthRequest(accessToken, {
                method: 'GET',
            }));
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.result?.detail ?? data?.message ?? 'دریافت خلاصه تراکنش‌ها ناموفق بود.');
            }
            if (data.result) {
                setSummary(data.result as WalletTxSummary);
            }
        } catch {
            // Summary is supplementary; keep the transaction list usable if this call fails.
        }
    }, [accessToken]);

    const fetchTxs = useCallback(async (silent = false, pageToLoad = 0, append = false) => {
        if (!silent && !append) {
            setLoading(true);
            setError(null);
        }
        if (append) {
            setLoadingMore(true);
        }
        try {
            const res = await fetch(`/api/v1/wallet/transactions?page=${pageToLoad}&size=20`, withAuthRequest(accessToken, {
                method: 'GET',
            }));
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.result?.detail ?? data?.message ?? 'دریافت تراکنش‌ها ناموفق بود.');
            }
            if (data.result) {
                const result = data.result as PagedResult<WalletTx>;
                setTxs((prev) => (append ? [...prev, ...result.items] : result.items));
                setPage(result.page);
                setHasMore(result.hasNext);
                hasLoadedOnceRef.current = true;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'دریافت تراکنش‌ها ناموفق بود.';
            if (!silent) {
                setError(message);
            }
        } finally {
            if (!silent && !append) {
                setLoading(false);
            }
            if (append) {
                setLoadingMore(false);
            }
        }
    }, [accessToken]);

    useEffect(() => {
        void fetchTxs(hasLoadedOnceRef.current, 0, false);
        void fetchSummary();
    }, [fetchSummary, fetchTxs, walletBalance]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let timer: number | undefined;
        const reconcile = () => {
            void fetchTxs(true, 0, false);
            void fetchSummary();
        };
        const unsubscribe = webSocketService.subscribeJson<TradingOrder>(
            accessToken,
            ORDER_UPDATES_QUEUE,
            () => {
                if (timer !== undefined) window.clearTimeout(timer);
                timer = window.setTimeout(() => {
                    void fetchTxs(true, 0, false);
                    void fetchSummary();
                }, 100);
            },
            {onReconnect: reconcile}
        );

        return () => {
            unsubscribe();
            if (timer !== undefined) {
                window.clearTimeout(timer);
            }
        };
    }, [enabled, fetchSummary, fetchTxs]);

    const sortedTxs = useMemo(
        () => [...txs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [txs],
    );
    const currentBalance = sortedTxs[0]?.balanceAfter ?? walletBalance;
    const totalCount = summary?.totalCount ?? 0;
    const totalNet = summary?.totalNet ?? 0;
    const inflowCount = summary?.inflowCount ?? 0;
    const outflowCount = summary?.outflowCount ?? 0;
    const canPrefetchMore = hasMore && !loading && !error;
    const loadTriggerIndex = getInfiniteScrollTriggerIndex(sortedTxs.length);

    const handleLoadMore = useCallback(() => {
        if (!hasMore || loadingMore || loading) {
            return;
        }
        void fetchTxs(false, page + 1, true);
    }, [fetchTxs, hasMore, loading, loadingMore, page]);

    useInfiniteScrollLoadMore({
        sentinelRef: loadMoreRef,
        enabled: canPrefetchMore,
        isFetching: loadingMore,
        onLoadMore: handleLoadMore,
        itemCount: sortedTxs.length,
    });

    return (
        <section dir="rtl" className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Wallet className="h-4 w-4"/>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-text">گزارشات کیف پول</h2>
                        <p className="text-[11px] text-muted">تراکنش‌ها و موجودی</p>
                    </div>
                </div>
                {loading && txs.length > 0 ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted"/>
                ) : null}
            </div>

            <WalletReportsSummary
                currentBalance={currentBalance}
                totalCount={totalCount}
                totalNet={totalNet}
                inflowCount={inflowCount}
                outflowCount={outflowCount}
            />

            <WalletTransactionList
                error={error}
                loading={loading}
                txs={txs}
                sortedTxs={sortedTxs}
                expandedTxId={expandedTxId}
                setExpandedTxId={setExpandedTxId}
                hasMore={hasMore}
                loadingMore={loadingMore}
                canPrefetchMore={canPrefetchMore}
                loadMoreRef={loadMoreRef}
                loadTriggerIndex={loadTriggerIndex}
            />
        </section>
    );
}
