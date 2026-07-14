import type {CreateOrderResult} from '../api';

export type OrderSuccessTone = 'buy' | 'sell';

export type OrderSuccessDetails = {
    title: string;
    message: string;
    tone: OrderSuccessTone;
    symbol: string;
    quantity: number;
    executedQuantity: number;
    statusLabel: string;
};

const formatQuantity = (value: number): string =>
    new Intl.NumberFormat('en-US', {maximumFractionDigits: 0}).format(value);

export const buildOrderSuccessDetails = (
    result: CreateOrderResult,
    formatNumber: (value: number | null | undefined, digits?: number) => string = (value) =>
        value === null || value === undefined ? '—' : formatQuantity(value),
    edited = false,
): OrderSuccessDetails => {
    const {order, trades} = result;
    const tone: OrderSuccessTone = order.side === 'BUY' ? 'buy' : 'sell';
    const sideLabel = order.sideLabel;
    const symbol = order.symbol;
    const quantity = order.quantity;
    const executedQuantity = order.executedQuantity;

    let title: string;
    let message: string;

    if (order.status === 'COMPLETED') {
        title = edited ? 'سفارش ویرایش و اجرا شد' : 'سفارش با موفقیت اجرا شد';
        message = `${sideLabel} ${formatNumber(executedQuantity)} سهم از نماد ${symbol} انجام شد.`;
    } else if (order.status === 'PARTIALLY_FILLED') {
        title = edited ? 'سفارش ویرایش و بخشی اجرا شد' : 'سفارش بخشی اجرا شد';
        if (order.remainingQuantity > 0) {
            message = `${formatNumber(executedQuantity)} سهم اجرا شد و ${formatNumber(order.remainingQuantity)} سهم در صف باقی ماند.`;
        } else {
            message = `${formatNumber(executedQuantity)} سهم از ${formatNumber(quantity)} سهم اجرا شد و باقیمانده سفارش بازار لغو شد.`;
        }
    } else if (order.status === 'TRIGGER_PENDING') {
        title = edited ? 'سفارش شرطی ویرایش شد' : 'سفارش شرطی ثبت شد';
        message = edited
            ? `تغییرات سفارش ${sideLabel} نماد ${symbol} ذخیره شد و سفارش همچنان در انتظار شرط است.`
            : `سفارش ${sideLabel} نماد ${symbol} پس از برقراری شرط فعال می‌شود.`;
    } else if (trades.length > 0) {
        title = 'سفارش ثبت و بخشی اجرا شد';
        message = `${sideLabel} نماد ${symbol}: ${formatNumber(executedQuantity)} سهم در معاملات اولیه اجرا شد.`;
    } else {
        title = edited ? 'سفارش با موفقیت ویرایش شد' : 'سفارش ثبت شد';
        message = edited
            ? `تغییرات سفارش ${sideLabel} نماد ${symbol} ذخیره شد و ${formatNumber(order.remainingQuantity)} سهم در صف قرار دارد.`
            : `${sideLabel} ${formatNumber(quantity)} سهم نماد ${symbol} در صف قرار گرفت.`;
    }

    return {
        title,
        message,
        tone,
        symbol,
        quantity,
        executedQuantity,
        statusLabel: order.statusLabel,
    };
};

export const buildOrderSuccessToastMessage = (
    result: CreateOrderResult,
    formatNumber: (value: number | null | undefined, digits?: number) => string
): string => buildOrderSuccessDetails(result, formatNumber).message;
