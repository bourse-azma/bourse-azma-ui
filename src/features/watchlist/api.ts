import type {SymbolSearchSuggestion} from '../symbol-search/types';

type ApiEnvelope<T> = {
    message?: string;
    result?: T;
};

type ApiErrorResult = {
    detail?: string;
    errors?: Record<string, string>;
};

export type WatchlistSymbol = {
    id: number;
    symbolKey: string;
    symbol: string;
    name: string;
    sourceType: string | null;
    instrumentCode: string | null;
    isin: string | null;
};

export type Watchlist = {
    id: number;
    name: string;
    symbols: WatchlistSymbol[];
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
    options?: RequestInit,
    fallbackError = 'عملیات دیده‌بان با خطا مواجه شد.'
): Promise<T> => {
    const response = await fetch(path, {
        ...options,
        headers: {
            ...(options?.headers ?? {}),
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

export const getWatchlists = (accessToken: string) =>
    request<Watchlist[]>('/api/v1/watchlists', accessToken, {method: 'GET'}, 'دریافت دیده‌بان‌ها ناموفق بود.');

export const createWatchlist = (accessToken: string, name: string) =>
    request<Watchlist>(
        '/api/v1/watchlists',
        accessToken,
        {
            method: 'POST',
            body: JSON.stringify({name}),
        },
        'ساخت دیده‌بان ناموفق بود.'
    );

export const updateWatchlist = (accessToken: string, watchlistId: number, name: string) =>
    request<Watchlist>(
        `/api/v1/watchlists/${watchlistId}`,
        accessToken,
        {
            method: 'PUT',
            body: JSON.stringify({name}),
        },
        'ویرایش دیده‌بان ناموفق بود.'
    );

export const deleteWatchlist = async (accessToken: string, watchlistId: number) => {
    await request<null>(
        `/api/v1/watchlists/${watchlistId}`,
        accessToken,
        {
            method: 'DELETE',
        },
        'حذف دیده‌بان ناموفق بود.'
    );
};

export const addSymbolToWatchlist = (accessToken: string, watchlistId: number, symbol: SymbolSearchSuggestion) =>
    request<Watchlist>(
        `/api/v1/watchlists/${watchlistId}/symbols`,
        accessToken,
        {
            method: 'POST',
            body: JSON.stringify({
                symbolKey: symbol.key,
                symbol: symbol.symbol,
                name: symbol.name,
                sourceType: symbol.type,
                instrumentCode: symbol.instrumentCode,
                isin: symbol.isin,
            }),
        },
        'افزودن نماد به دیده‌بان ناموفق بود.'
    );

export const removeSymbolFromWatchlist = (accessToken: string, watchlistId: number, symbolId: number) =>
    request<Watchlist>(
        `/api/v1/watchlists/${watchlistId}/symbols/${symbolId}`,
        accessToken,
        {
            method: 'DELETE',
        },
        'حذف نماد از دیده‌بان ناموفق بود.'
    );
