import {X} from 'lucide-react';
import OrderBookPanel from '../../symbol-search/OrderBookPanel';
import type {SymbolOrderBookRow} from '../../symbol-search/types';
import type {CreateOrderResult} from '../api';
import OrderForm from './OrderForm';
import {useOrderPlacement} from './useOrderPlacement';
import type {OrderSide, OrderSymbolContext, OrderValidationContext} from './types';

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
    const sign = value > 0 ? '+' : '';
    return {text: `(${sign}${value.toFixed(2)}%)`, positive: value >= 0};
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
    const controller = useOrderPlacement({
        open,
        initialSide,
        symbol,
        context,
        accessToken,
        onSuccess: (result, closeAfter) => {
            onOrderPlaced(result, closeAfter);
            if (closeAfter) onClose();
        },
    });

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
                    <h3 className="text-base font-bold text-text">{headerTitle}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                        aria-label="بستن"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                <div className="thin-scrollbar grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2">
                    {/* Left (RTL: appears second): symbol information + order book */}
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
                                        className={`text-xs tabular-nums ${
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

                    {/* Right (RTL: appears first): order form */}
                    <section className="order-1">
                        <OrderForm controller={controller} context={context} formatNumber={formatNumber}/>
                    </section>
                </div>
            </div>
        </div>
    );
}
