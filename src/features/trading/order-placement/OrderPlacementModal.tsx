import {X} from 'lucide-react';
import {useEffect, useMemo, useRef} from 'react';
import OrderBookPanel from '../../symbol-search/OrderBookPanel';
import type {SymbolOrderBookRow} from '../../symbol-search/types';
import type {CreateOrderResult} from '../api';
import OrderForm from './OrderForm';
import OrderSuccessOverlay from './OrderSuccessOverlay';
import {buildOrderSuccessDetails} from './orderSuccess';
import {useOrderPlacement} from './useOrderPlacement';
import type {OrderSide, OrderSymbolContext, OrderValidationContext} from './types';
import {formatPercentFa, ltrNumericClassName} from '../../../utils/numberFormat';

type OrderPlacementModalProps = {
    open: boolean;
    initialSide: OrderSide;
    symbol: OrderSymbolContext;
    orderBookRows: SymbolOrderBookRow[];
    context: OrderValidationContext;
    accessToken: string;
    formatNumber: (value: number | null | undefined, digits?: number) => string;
    onClose: () => void;
    onOrderPlaced: (result: CreateOrderResult, closeAfter: boolean) => void;
};

const formatPercent = (value: number | null): { text: string; positive: boolean } => {
    if (value === null || Number.isNaN(value)) return {text: '—', positive: true};
    return {text: `(${formatPercentFa(value)})`, positive: value >= 0};
};

const formatNumberOrDash = (
    value: number | null,
    formatNumber: (value: number | null | undefined, digits?: number) => string
) => (value === null || Number.isNaN(value) ? '—' : formatNumber(value));

export default function OrderPlacementModal({
                                                open,
                                                initialSide,
                                                symbol,
                                                orderBookRows,
                                                context,
                                                accessToken,
                                                formatNumber,
                                                onClose,
                                                onOrderPlaced,
                                            }: OrderPlacementModalProps) {
    const closeAfterSuccessRef = useRef(false);

    const controller = useOrderPlacement({
        open,
        initialSide,
        symbol,
        context,
        accessToken,
        onSuccess: (result, closeAfter) => {
            closeAfterSuccessRef.current = closeAfter;
            onOrderPlaced(result, closeAfter);
        },
    });

    const successDetails = useMemo(
        () =>
            controller.successResult
                ? buildOrderSuccessDetails(controller.successResult, formatNumber)
                : null,
        [controller.successResult, formatNumber]
    );

    useEffect(() => {
        if (!controller.successResult) return;

        const closeAfter = closeAfterSuccessRef.current;
        const {clearSuccess} = controller;
        const timer = window.setTimeout(() => {
            if (closeAfter) {
                onClose();
            } else {
                clearSuccess();
            }
        }, closeAfter ? 1400 : 2600);

        return () => window.clearTimeout(timer);
    }, [controller.clearSuccess, controller.successResult, onClose]);

    if (!open) return null;

    const isBuy = controller.values.side === 'BUY';
    const lastChange = formatPercent(symbol.changePercent);
    const headerTitle = `${isBuy ? 'خرید' : 'فروش'} ${symbol.symbol}`;

    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-5">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                aria-label="بستن پنجره سفارش"
            />

            <div
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-label={headerTitle}
                className="relative flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card"
            >
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <h3 className="text-base font-bold text-text">{headerTitle}</h3>
                        {context.marketOpen === null ? (
                            <span className="h-5 w-20 animate-pulse rounded-full bg-surface-2"/>
                        ) : !context.marketOpen ? (
                            <span
                                className="shrink-0 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                                بازار بسته
                            </span>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                        aria-label="بستن"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col">
                    {successDetails ? (
                        <OrderSuccessOverlay details={successDetails} formatNumber={formatNumber}/>
                    ) : null}

                    <div className="thin-scrollbar grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2">
                        <section className="order-2 space-y-3">
                            <div className="rounded-2xl border border-border/70 bg-surface-2 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-lg font-bold text-text">{symbol.symbol}</div>
                                        <p className="mt-0.5 text-xs text-muted">{symbol.name}</p>
                                    </div>
                                    <div className="text-left">
                                        <div
                                            className={`text-2xl font-bold tabular-nums ${
                                                lastChange.positive ? 'text-positive' : 'text-negative'
                                            }`}
                                        >
                                            {formatNumberOrDash(symbol.lastPrice, formatNumber)}
                                        </div>
                                        <div
                                            className={`text-xs ${ltrNumericClassName} ${
                                                lastChange.positive ? 'text-positive' : 'text-negative'
                                            }`}
                                        >
                                            {lastChange.text}
                                        </div>
                                    </div>
                                </div>

                                <dl className="mt-4 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-muted">قیمت پایانی</dt>
                                        <dd className="tabular-nums font-medium text-text">
                                            {formatNumberOrDash(symbol.closePrice, formatNumber)}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-muted">حجم معاملات</dt>
                                        <dd className="tabular-nums font-medium text-text">
                                            {formatNumberOrDash(symbol.tradeVolume, formatNumber)}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-muted">تعداد معاملات</dt>
                                        <dd className="tabular-nums font-medium text-text">
                                            {formatNumberOrDash(symbol.tradeCount, formatNumber)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {orderBookRows.length > 0 ? (
                                <OrderBookPanel
                                    rows={orderBookRows}
                                    formatNumber={(value, digits) =>
                                        value === null || value === undefined || Number.isNaN(value)
                                            ? '—'
                                            : formatNumber(value, digits)
                                    }
                                    onSelectPrice={controller.fillPrice}
                                />
                            ) : (
                                <div
                                    className="rounded-2xl border border-border/70 bg-surface-2 px-4 py-6 text-center text-xs text-muted">
                                    دفتر سفارشات برای این نماد در دسترس نیست.
                                </div>
                            )}
                        </section>

                        <section className="order-1">
                            <OrderForm controller={controller} context={context} formatNumber={formatNumber}/>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
