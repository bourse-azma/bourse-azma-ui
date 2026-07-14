import {withAuthRequest} from '../../lib/authRequest';
import {toApiErrorMessage} from '../../lib/apiError';

type ApiEnvelope<T> = {
    message?: string;
    result?: T;
};

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'NORMAL' | 'CONDITIONAL';
export type PriceType = 'CUSTOM' | 'MARKET';
export type TriggerComparator = 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL';
export type OrderStatusType =
    'REQUESTED'
    | 'PARTIALLY_FILLED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'FAILED'
    | 'TRIGGER_PENDING';

export type TradingOrder = {
    id: number;
    side: OrderSide;
    sideLabel: string;
    symbol: string;
    instrumentCode: string;
    quantity: number;
    remainingQuantity: number;
    executedQuantity: number;
    orderPrice: number;
    livePrice: number;
    averageExecutedPrice: number | null;
    orderValue?: number;
    orderTime: string;
    cancelledAt: string | null;
    status: OrderStatusType;
    statusLabel: string;
    cancellable: boolean;
    orderType?: OrderType;
    orderTypeLabel?: string;
    priceType?: PriceType;
    triggerComparator?: TriggerComparator | null;
    triggerPrice?: number | null;
};

export type PortfolioHolding = {
    id: number;
    acquiredAt: string;
    symbol: string;
    instrumentCode: string;
    quantity: number;
    buyPrice: number;
    livePrice: number;
    netValue: number;
};

export type TradeRecord = {
    id: number;
    quantity: number;
    price: number;
    value: number;
    executedAt: string;
};

export type CreateOrderResult = {
    order: TradingOrder;
    trades: TradeRecord[];
};

export type CancelOrderResult = {
    order: TradingOrder;
};

export type UpdateTradingOrderRequest = {
    quantity: number;
    price: number | null;
};

export type UpdateOrderResult = {
    order: TradingOrder;
    trades: TradeRecord[];
};

export type PrivateOrderBookRow = {
    level: number;
    askPrice: number | null;
    askVolume: number;
    askOrderCount: number;
    ownAskVolume: number;
    bidPrice: number | null;
    bidVolume: number;
    bidOrderCount: number;
    ownBidVolume: number;
};

export type PrivateOrderBook = {
    instrumentCode: string;
    rows: PrivateOrderBookRow[];
    refreshedAt: string;
};

export type CreateTradingOrderTrigger = {
    comparator: TriggerComparator;
    price: number;
};

export type CreateTradingOrderRequest = {
    side: OrderSide;
    orderType: OrderType;
    priceType: PriceType;
    symbol: string;
    instrumentCode: string;
    quantity: number;
    price: number | null;
    livePrice: number;
    trigger: CreateTradingOrderTrigger | null;
};

export type TradingRules = {
    minimumOrderValue: number;
    maximumWalletAdjustment: number;
};

export const DEFAULT_TRADING_RULES: TradingRules = {
    minimumOrderValue: 5_000_000,
    maximumWalletAdjustment: 1_000_000_000_000,
};

const tryParseJson = (text: string) => {
    if (text.trim() === '') return null;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return null;
    }
};

const request = async <T>(
    path: string,
    accessToken: string,
    fallbackError: string,
    init?: RequestInit
): Promise<T> => {
    const response = await fetch(path, withAuthRequest(accessToken, init));

    const text = await response.text();
    const data = tryParseJson(text);

    if (!response.ok) {
        if (!data) {
            throw new Error(`${fallbackError} (پاسخ غیرمنتظره از سرور)`);
        }
        throw new Error(toApiErrorMessage(data, fallbackError));
    }

    if (!data) {
        throw new Error('پاسخ سرور معتبر نیست.');
    }

    const payload = data as ApiEnvelope<T>;
    if (payload.result === undefined) {
        throw new Error('پاسخ سرور معتبر نیست.');
    }
    return payload.result;
};

export type PagedResult<T> = {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
};

export const getTradingOrders = (
    accessToken: string,
    page = 0,
    size = 20,
    statuses?: OrderStatusType[]
) => {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });
    statuses?.forEach((status) => params.append('statuses', status));
    return request<PagedResult<TradingOrder>>(
        `/api/v1/trading/orders?${params.toString()}`,
        accessToken,
        'دریافت سفارشات ناموفق بود.',
        {method: 'GET'}
    );
};

export const getPortfolioHoldings = (accessToken: string) =>
    request<PortfolioHolding[]>('/api/v1/trading/portfolio', accessToken, 'دریافت سبد سهام ناموفق بود.', {method: 'GET'});

export const getTradingRules = (accessToken: string) =>
    request<TradingRules>('/api/v1/trading/rules', accessToken, 'دریافت محدودیت‌های معاملاتی ناموفق بود.', {method: 'GET'});

export const getPrivateOrderBook = (
    accessToken: string,
    instrumentCode: string,
    signal?: AbortSignal
) => request<PrivateOrderBook>(
    `/api/v1/trading/order-book?instrumentCode=${encodeURIComponent(instrumentCode)}`,
    accessToken,
    'دریافت دفتر سفارش اختصاصی ناموفق بود.',
    {method: 'GET', signal}
);

export const createTradingOrder = (accessToken: string, payload: CreateTradingOrderRequest) =>
    request<CreateOrderResult>('/api/v1/trading/orders', accessToken, 'ثبت سفارش ناموفق بود.', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const updateTradingOrder = (
    accessToken: string,
    orderId: number,
    payload: UpdateTradingOrderRequest
) => request<UpdateOrderResult>(`/api/v1/trading/orders/${orderId}`, accessToken, 'ویرایش سفارش ناموفق بود.', {
    method: 'PUT',
    body: JSON.stringify(payload),
});

export const cancelTradingOrder = (accessToken: string, orderId: number) =>
    request<CancelOrderResult>(`/api/v1/trading/orders/${orderId}/cancel`, accessToken, 'لغو سفارش ناموفق بود.', {
        method: 'POST',
    });
