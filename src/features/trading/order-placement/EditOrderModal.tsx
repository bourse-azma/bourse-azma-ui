import {AlertCircle, Loader2, Pencil, X} from 'lucide-react';
import {useMemo, useState} from 'react';
import {formatNumberFa} from '../../../utils/numberFormat';
import type {TradingOrder, UpdateTradingOrderRequest} from '../api';
import {validateOrderEdit} from './orderEditValidation';

type EditOrderModalProps = {
    order: TradingOrder;
    minimumOrderValue: number;
    submitting: boolean;
    onClose: () => void;
    onSubmit: (orderId: number, payload: UpdateTradingOrderRequest) => Promise<string | null>;
};

export default function EditOrderModal({
                                           order,
                                           minimumOrderValue,
                                           submitting,
                                           onClose,
                                           onSubmit,
                                       }: EditOrderModalProps) {
    const [quantity, setQuantity] = useState(String(order.quantity));
    const [price, setPrice] = useState(String(Math.round(order.orderPrice)));
    const [submitError, setSubmitError] = useState<string | null>(null);

    const validation = useMemo(() => validateOrderEdit({
        quantityText: quantity,
        priceText: price,
        priceType: order.priceType,
        currentOrderPrice: order.orderPrice,
        executedQuantity: order.executedQuantity,
        minimumOrderValue,
    }), [minimumOrderValue, order.executedQuantity, order.orderPrice, order.priceType, price, quantity]);

    const submit = async () => {
        setSubmitError(null);
        if (validation.error || validation.quantity === null || validation.price === null) return;
        const error = await onSubmit(order.id, {
            quantity: validation.quantity,
            price: order.priceType === 'MARKET' ? null : validation.price,
        });
        if (error) setSubmitError(error);
    };

    const isBuy = order.side === 'BUY';
    const inputClass = 'h-11 w-full rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/20';

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5">
            <button type="button" onClick={onClose} className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                    aria-label="بستن پنجره ویرایش سفارش"/>
            <section dir="rtl" role="dialog" aria-modal="true" aria-label={`ویرایش سفارش ${order.symbol}`}
                     className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card">
                <header className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-primary"/>
                        <div>
                            <h3 className="text-sm font-bold text-text">ویرایش سفارش {order.symbol}</h3>
                            <p className={`mt-0.5 text-[11px] font-semibold ${isBuy ? 'text-positive' : 'text-negative'}`}>
                                {order.sideLabel} · {order.statusLabel}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={submitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text disabled:opacity-50"
                            aria-label="بستن">
                        <X className="h-4 w-4"/>
                    </button>
                </header>

                <div className="space-y-4 p-4">
                    {order.executedQuantity > 0 ? (
                        <div
                            className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-xs leading-6 text-warning">
                            تاکنون {formatNumberFa(order.executedQuantity)} سهم اجرا شده است؛ فقط بخش باقیمانده قابل
                            ویرایش است.
                        </div>
                    ) : null}

                    <div className="space-y-1.5">
                        <label htmlFor="edit-order-quantity" className="block text-xs font-medium text-muted">تعداد کل
                            سفارش</label>
                        <input id="edit-order-quantity" inputMode="numeric" dir="ltr" value={quantity}
                               onChange={(event) => {
                                   setQuantity(event.target.value);
                                   setSubmitError(null);
                               }}
                               className={inputClass}/>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="edit-order-price" className="block text-xs font-medium text-muted">قیمت هر
                            سهم</label>
                        <div className="relative">
                            <input id="edit-order-price" inputMode="numeric" dir="ltr" value={price}
                                   disabled={order.priceType === 'MARKET'}
                                   onChange={(event) => {
                                       setPrice(event.target.value);
                                       setSubmitError(null);
                                   }}
                                   className={`${inputClass} pl-12 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted`}/>
                            <span
                                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] text-muted">ریال</span>
                        </div>
                        {order.priceType === 'MARKET' ? (
                            <p className="text-[10px] leading-5 text-muted">قیمت سفارش بازار هنگام ویرایش از بهترین قیمت
                                موجود به‌روزرسانی می‌شود.</p>
                        ) : null}
                    </div>

                    <dl className="space-y-2 rounded-xl border border-border/60 bg-surface-2/70 px-3 py-2.5 text-xs">
                        <div className="flex items-center justify-between">
                            <dt className="text-muted">تعداد باقیمانده جدید</dt>
                            <dd className="font-semibold tabular-nums text-text">
                                {validation.remainingQuantity !== null && validation.remainingQuantity > 0
                                    ? formatNumberFa(validation.remainingQuantity)
                                    : '—'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-2">
                            <dt className="text-muted">ارزش باقیمانده</dt>
                            <dd className="font-semibold tabular-nums text-text">
                                {validation.remainingValue !== null
                                    ? `${formatNumberFa(validation.remainingValue)} ریال`
                                    : '—'}
                            </dd>
                        </div>
                    </dl>

                    {validation.error || submitError ? (
                        <div role="alert"
                             className="flex items-start gap-2 rounded-xl border border-negative/35 bg-negative/10 px-3 py-2 text-xs leading-6 text-negative">
                            <AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0"/>
                            <span>{submitError ?? validation.error}</span>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={onClose} disabled={submitting}
                                className="h-10 rounded-xl border border-border/80 bg-surface-2 text-xs font-semibold text-muted transition hover:text-text disabled:opacity-50">
                            انصراف
                        </button>
                        <button type="button" onClick={() => void submit()}
                                disabled={submitting || Boolean(validation.error)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                <Pencil className="h-3.5 w-3.5"/>}
                            ثبت ویرایش
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
