import {Check, X} from 'lucide-react';
import type {OrderSuccessDetails} from './orderSuccess';

type OrderSuccessOverlayProps = {
    details: OrderSuccessDetails;
    formatNumber: (value: number | null | undefined, digits?: number) => string;
    onContinue: () => void;
    onViewOrders: () => void;
    onClose: () => void;
    continueLabel?: string;
};

export default function OrderSuccessOverlay({
                                                details,
                                                formatNumber,
                                                onContinue,
                                                onViewOrders,
                                                onClose,
                                                continueLabel = 'سفارش جدید',
                                            }: OrderSuccessOverlayProps) {
    const isBuy = details.tone === 'buy';
    const accentBg = isBuy ? 'bg-positive' : 'bg-negative';
    const cardBorder = isBuy ? 'border-positive/40' : 'border-negative/40';

    return (
        <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-5"
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <div
                className={`pointer-events-auto relative w-full max-w-md animate-success-pop rounded-2xl border-2 bg-surface-2 px-6 py-7 text-center shadow-card ${cardBorder}`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-surface text-muted shadow-sm transition hover:border-border hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-label="بستن پنجره"
                    title="بستن پنجره"
                >
                    <X className="h-4.5 w-4.5" aria-hidden="true"/>
                </button>

                <div
                    className={`mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full ${accentBg} text-white shadow-card`}
                >
                    <Check className="h-9 w-9 animate-success-check stroke-[2.5]" aria-hidden="true"/>
                </div>

                <h4 className="text-lg font-bold leading-8 text-text">{details.title}</h4>
                <p className="mt-2 text-sm font-medium leading-7 text-text">{details.message}</p>

                <dl className="mt-5 space-y-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                        <dt className="font-medium text-text">نماد</dt>
                        <dd className="font-bold text-text">{details.symbol}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <dt className="font-medium text-text">تعداد</dt>
                        <dd className="tabular-nums font-bold text-text">
                            {formatNumber(details.quantity)} سهم
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                        <dt className="font-medium text-text">وضعیت</dt>
                        <dd className="font-bold text-text">{details.statusLabel}</dd>
                    </div>
                </dl>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={onViewOrders}
                        className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${accentBg}`}
                    >
                        مشاهده سفارش‌ها
                    </button>
                    <button
                        type="button"
                        onClick={onContinue}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        {continueLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
