type ApiEnvelope<T> = {
    message?: string;
    result?: T;
};

type ApiErrorResult = {
    detail?: string;
    errors?: Record<string, string>;
};

export type TradingOrder = {
    id: number;
    side: 'BUY' | 'SELL';
    sideLabel: string;
    symbol: string;
    instrumentCode: string;
    quantity: number;
    orderPrice: number;
    livePrice: number;
    orderTime: string;
    status: 'REQUESTED' | 'COMPLETED' | 'FAILED';
    statusLabel: string;
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

const request = async <T>(path: string, accessToken: string, fallbackError: string): Promise<T> => {
    const response = await fetch(path, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
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
    request<TradingOrder[]>('/api/v1/trading/orders', accessToken, 'دریافت سفارشات ناموفق بود.');

export const getPortfolioHoldings = (accessToken: string) =>
    request<PortfolioHolding[]>('/api/v1/trading/portfolio', accessToken, 'دریافت سبد سهام ناموفق بود.');
