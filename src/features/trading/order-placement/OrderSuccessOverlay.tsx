import {Check} from 'lucide-react';
import type {OrderSuccessDetails} from './orderSuccess';

type OrderSuccessOverlayProps = {
    details: OrderSuccessDetails;
    formatNumber: (value: number | null | undefined, digits?: number) => string;
};

export default function OrderSuccessOverlay({details, formatNumber}: OrderSuccessOverlayProps) {
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
                className={`pointer-events-auto w-full max-w-md animate-success-pop rounded-2xl border-2 bg-surface-2 px-6 py-7 text-center shadow-card ${cardBorder}`}
            >
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
            </div>
        </div>
    );
}
