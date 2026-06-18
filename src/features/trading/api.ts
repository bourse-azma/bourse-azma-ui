type ApiEnvelope<T> = {
    message?: string;
    result?: T;
};

type ApiErrorResult = {
    detail?: string;
    errors?: Record<string, string>;
};

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'NORMAL' | 'CONDITIONAL';
export type PriceType = 'CUSTOM' | 'MARKET';
export type OrderValidity = 'TODAY' | 'DAY' | 'DAYS_30' | 'DAYS_90';
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
    validity?: OrderValidity;
    expiresAt?: string | null;
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
    validityType: OrderValidity;
    trigger: CreateTradingOrderTrigger | null;
};

const firstFieldError = (errors?: Record<string, string>) => {
    if (!errors) return null;
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return null;
    const message = errors[firstKey];
    return typeof message === 'string' && message.trim() !== '' ? message : null;
};

const toApiErrorMessage = (data: unknown, fallback: string) => {
    if (!data || typeof data !== 'object') return fallback;
    const response = data as ApiEnvelope<ApiErrorResult>;
    const detail = response.result?.detail;
    if (typeof detail === 'string' && detail.trim() !== '') return detail;
    const fieldError = firstFieldError(response.result?.errors);
    if (fieldError) return fieldError;
    if (typeof response.message === 'string' && response.message.trim() !== '') return response.message;
    return fallback;
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
    const response = await fetch(path, {
        ...init,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });

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

export const getTradingOrders = (accessToken: string) =>
    request<TradingOrder[]>('/api/v1/trading/orders', accessToken, 'دریافت سفارشات ناموفق بود.', {method: 'GET'});

export const getPortfolioHoldings = (accessToken: string) =>
    request<PortfolioHolding[]>('/api/v1/trading/portfolio', accessToken, 'دریافت سبد سهام ناموفق بود.', {method: 'GET'});

export const createTradingOrder = (accessToken: string, payload: CreateTradingOrderRequest) =>
    request<CreateOrderResult>('/api/v1/trading/orders', accessToken, 'ثبت سفارش ناموفق بود.', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const cancelTradingOrder = (accessToken: string, orderId: number) =>
    request<CancelOrderResult>(`/api/v1/trading/orders/${orderId}/cancel`, accessToken, 'لغو سفارش ناموفق بود.', {
        method: 'POST',
    });
