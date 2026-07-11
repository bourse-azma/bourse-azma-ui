import {AlertCircle, AlertTriangle} from 'lucide-react';
import BuySellToggle from './BuySellToggle';
import OrderTypeToggle from './OrderTypeToggle';
import PriceTypeSelect from './PriceTypeSelect';
import ConditionalTriggerFields from './ConditionalTriggerFields';
import {MARKET_CLOSED_ERROR} from './orderValidation';
import type {useOrderPlacement} from './useOrderPlacement';
import type {OrderValidationContext} from './types';

type OrderFormProps = {
    controller: ReturnType<typeof useOrderPlacement>;
    context: OrderValidationContext;
    formatNumber: (value: number | null | undefined, digits?: number) => string;
};

export default function OrderForm({controller, context, formatNumber}: OrderFormProps) {
    const {
        values,
        validation,
        submitError,
        instrumentMissing,
        setSide,
        setOrderType,
        setPriceType,
        setQuantity,
        setPrice,
        setTriggerComparator,
        setTriggerPrice,
    } = controller;

    const isBuy = values.side === 'BUY';
    const isConditional = values.orderType === 'CONDITIONAL';
    const isMarket = values.priceType === 'MARKET';

    const themeBg = isBuy ? 'border-positive/30 bg-positive/5' : 'border-negative/30 bg-negative/5';
    const accentRing = isBuy ? 'focus:ring-positive/30' : 'focus:ring-negative/30';

    const inputClass = (hasError?: boolean) =>
        `h-11 w-full rounded-xl border bg-surface px-3 pl-12 text-sm text-text outline-none transition focus:ring-2 ${accentRing} ${
            hasError ? 'border-negative/50' : 'border-border/80'
        }`;

    return (
        <div dir="rtl" className="flex h-full flex-col gap-4">
            {context.marketOpen === null ? (
                <div className="space-y-2 rounded-2xl border border-border/70 bg-surface-2/60 p-4">
                    <div className="h-4 w-32 animate-pulse rounded-full bg-surface-2"/>
                    <div className="h-3 w-full animate-pulse rounded-full bg-surface-2"/>
                </div>
            ) : !context.marketOpen ? (
                <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border border-warning/45 bg-warning/10 px-4 py-3 text-sm leading-7 text-warning"
                >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0"/>
                    <div>
                        <p className="font-semibold text-text">بازار بسته است</p>
                        <p className="mt-0.5 text-xs leading-6 text-muted">{MARKET_CLOSED_ERROR}</p>
                    </div>
                </div>
            ) : null}

            <BuySellToggle value={values.side} onChange={setSide}/>
            <OrderTypeToggle value={values.orderType} side={values.side} onChange={setOrderType}/>

            <div className={`flex flex-1 flex-col gap-3 rounded-2xl border p-4 ${themeBg}`}>
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted">نوع قیمت</label>
                    <PriceTypeSelect value={values.priceType} onChange={setPriceType}/>
                </div>

                {values.priceType === 'CUSTOM' ? (
                    <div className="space-y-1.5">
                        <label htmlFor="order-price" className="block text-xs font-medium text-muted">
                            قیمت
                        </label>
                        <div className="relative">
                            <input
                                id="order-price"
                                inputMode="numeric"
                                dir="ltr"
                                value={isMarket ? '' : values.price}
                                disabled={isMarket}
                                onChange={(event) => setPrice(event.target.value)}
                                placeholder={isMarket ? 'قیمت بازار' : 'قیمت هر سهم'}
                                className={`${inputClass(Boolean(validation.errors.price))} disabled:cursor-not-allowed disabled:bg-surface-2/60 disabled:text-muted`}
                            />
                            <span
                                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] text-muted">
                                ریال
                            </span>
                        </div>
                        {validation.errors.price ? (
                            <div className="flex items-center gap-1.5 text-xs text-negative">
                                <AlertCircle className="h-3.5 w-3.5"/>
                                {validation.errors.price}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <p className="text-xs leading-6 text-muted">
                        {isConditional
                            ? 'پس از فعال‌شدن شرط، سفارش با بهترین قیمت موجود بازار اجرا می‌شود.'
                            : 'سفارش با بهترین قیمت موجود بازار اجرا می‌شود.'}
                    </p>
                )}

                <div className="space-y-1.5">
                    <label htmlFor="order-quantity" className="block text-xs font-medium text-muted">
                        تعداد
                    </label>
                    <input
                        id="order-quantity"
                        inputMode="numeric"
                        dir="ltr"
                        value={values.quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        placeholder="تعداد سهم"
                        className={inputClass(Boolean(validation.errors.quantity)).replace('pl-12', 'pl-3')}
                    />
                    {validation.errors.quantity ? (
                        <div className="flex items-center gap-1.5 text-xs text-negative">
                            <AlertCircle className="h-3.5 w-3.5"/>
                            {validation.errors.quantity}
                        </div>
                    ) : null}
                </div>

                {isConditional ? (
                    <ConditionalTriggerFields
                        side={values.side}
                        comparator={values.triggerComparator}
                        triggerPrice={values.triggerPrice}
                        error={validation.errors.triggerPrice}
                        onComparatorChange={setTriggerComparator}
                        onTriggerPriceChange={setTriggerPrice}
                    />
                ) : null}

                <dl className="space-y-2 rounded-xl border border-border/60 bg-surface/70 px-3 py-2.5 text-xs">
                    {!isBuy ? (
                        <div className="flex items-center justify-between">
                            <dt className="text-muted">موجودی قابل فروش</dt>
                            <dd className="tabular-nums font-semibold text-text">
                                {context.availableToSell === null
                                    ? 'ناموجود'
                                    : `${formatNumber(context.availableToSell)} سهم`}
                            </dd>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <dt className="text-muted">قدرت خرید</dt>
                            <dd className="tabular-nums font-semibold text-text">
                                {context.buyingPower === null
                                    ? 'ناموجود'
                                    : `${formatNumber(context.buyingPower)} ریال`}
                            </dd>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border/50 pt-2">
                        <dt className="text-muted">ارزش</dt>
                        <dd className="tabular-nums font-semibold text-text">
                            {validation.orderValue === null
                                ? '0 ریال'
                                : `${formatNumber(validation.orderValue)} ریال`}
                        </dd>
                    </div>
                </dl>

                {instrumentMissing ? (
                    <div
                        className="flex items-center gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0"/>
                        کد ابزار این نماد در دسترس نیست؛ امکان ثبت سفارش وجود ندارد.
                    </div>
                ) : null}

                {validation.errors.general ? (
                    <div
                        className="flex items-center gap-1.5 rounded-lg border border-negative/35 bg-negative/10 px-3 py-2 text-xs text-negative">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0"/>
                        {validation.errors.general}
                    </div>
                ) : null}

                {submitError ? (
                    <div
                        className="flex items-center gap-1.5 rounded-lg border border-negative/35 bg-negative/10 px-3 py-2 text-xs text-negative">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0"/>
                        {submitError}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
