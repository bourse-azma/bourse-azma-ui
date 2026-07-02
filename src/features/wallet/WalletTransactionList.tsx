import {Fragment, type RefObject} from 'react';
import {AlertCircle, ArrowDownLeft, ArrowUpRight, ChevronDown, Clock3, Loader2, Wallet} from 'lucide-react';
import {InfiniteScrollSentinel} from '../../hooks/InfiniteScrollSentinel';
import {formatDateTimeFa} from '../../utils/formatDateTime';
import {formatNumberFa, formatSignedNumberFa, ltrNumericClassName} from '../../utils/numberFormat';
import {getWalletTransactionMeta} from './walletUtils';
import type {WalletTx} from './types';

type WalletTransactionListProps = {
    error: string | null;
    loading: boolean;
    txs: WalletTx[];
    sortedTxs: WalletTx[];
    expandedTxId: number | null;
    setExpandedTxId: (updater: (prev: number | null) => number | null) => void;
    hasMore: boolean;
    loadingMore: boolean;
    canPrefetchMore: boolean;
    loadMoreRef: RefObject<HTMLDivElement | null>;
    loadTriggerIndex: number;
};

export default function WalletTransactionList({
                                                  error,
                                                  loading,
                                                  txs,
                                                  sortedTxs,
                                                  expandedTxId,
                                                  setExpandedTxId,
                                                  hasMore,
                                                  loadingMore,
                                                  canPrefetchMore,
                                                  loadMoreRef,
                                                  loadTriggerIndex,
                                              }: WalletTransactionListProps) {
    return (
        <div className="px-4 py-4 sm:px-5">
            {error ? (
                <div
                    className="mb-3 flex items-center gap-2 rounded-xl border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
                    <AlertCircle className="h-4 w-4 shrink-0"/>
                    {error}
                </div>
            ) : null}
            {loading && txs.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                    در حال بارگذاری...
                </div>
            ) : txs.length === 0 ? (
                <div className="py-10 text-center">
                    <Wallet className="mx-auto h-5 w-5 text-muted"/>
                    <p className="mt-2 text-xs font-medium text-text">تراکنشی ثبت نشده</p>
                    <p className="mt-0.5 text-[11px] text-muted">بعد از اولین افزایش یا کاهش موجودی اینجا نمایش داده
                        می‌شود.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {sortedTxs.map((tx, index) => {
                        const {isIncrease, balanceBefore, title, isAutoDescription} = getWalletTransactionMeta(tx);
                        const showDescription = !isAutoDescription && tx.description.trim().length > 0;
                        const isExpanded = expandedTxId === tx.id;

                        return (
                            <Fragment key={tx.id}>
                                <article className="rounded-xl border border-border/60 bg-surface">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedTxId((prev) => (prev === tx.id ? null : tx.id))}
                                        className="flex w-full items-start gap-3 px-3.5 py-3 text-right sm:px-4"
                                    >
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                            isIncrease ? 'bg-positive/12 text-positive' : 'bg-negative/12 text-negative'
                                        }`}
                                    >
                                        {isIncrease ? <ArrowUpRight className="h-3.5 w-3.5"/> :
                                            <ArrowDownLeft className="h-3.5 w-3.5"/>}
                                    </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-bold text-text">{title}</h3>
                                                    <p className="mt-1 inline-flex items-center gap-1 text-[10px] tabular-nums text-muted"
                                                       dir="ltr">
                                                        <Clock3 className="h-3 w-3 shrink-0"/>
                                                        {formatDateTimeFa(tx.createdAt)}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <p className={`text-sm font-bold ${ltrNumericClassName} ${isIncrease ? 'text-positive' : 'text-negative'}`}>
                                                        {formatSignedNumberFa(tx.amount)}
                                                        <span
                                                            className="mr-1 text-[10px] font-medium text-muted">ریال</span>
                                                    </p>
                                                    <span
                                                        className="inline-flex items-center gap-0.5 text-[10px] text-muted">
                                                    جزئیات
                                                    <ChevronDown
                                                        className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    />
                                                </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded ? (
                                        <div
                                            className="space-y-1.5 border-t border-border/50 px-3.5 pb-3 pt-2.5 text-[11px] sm:px-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-muted">موجودی قبلی</span>
                                                <span className="font-medium tabular-nums text-text">
                                                {formatNumberFa(balanceBefore)} ریال
                                            </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-muted">مبلغ تراکنش</span>
                                                <span
                                                    className={`font-medium tabular-nums ${isIncrease ? 'text-positive' : 'text-negative'}`}>
                                                <span
                                                    className={ltrNumericClassName}>{formatSignedNumberFa(tx.amount)}</span> ریال
                                            </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-muted">موجودی جدید</span>
                                                <span className="font-bold tabular-nums text-text">
                                                {formatNumberFa(tx.balanceAfter)} ریال
                                            </span>
                                            </div>
                                            {showDescription ? (
                                                <div className="flex items-start justify-between gap-4 pt-0.5">
                                                    <span className="shrink-0 text-muted">توضیحات</span>
                                                    <span
                                                        className="text-left leading-5 text-text">{tx.description}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </article>

                                {canPrefetchMore && index === loadTriggerIndex ? (
                                    <InfiniteScrollSentinel sentinelRef={loadMoreRef}/>
                                ) : null}
                            </Fragment>
                        );
                    })}
                    {loadingMore ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted">
                            <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                            در حال بارگذاری...
                        </div>
                    ) : null}
                    {!hasMore && !loading && txs.length > 0 ? (
                        <div className="py-2 text-center text-[11px] text-muted">همه تراکنش‌ها نمایش داده شد.</div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
