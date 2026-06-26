import {type PagedResult, withAuthRequest} from '../../lib/authRequest';
import type {
    CreateSupportTicketRequest,
    SupportTicket,
    SupportTicketDetail,
    SupportTicketFilters,
    SupportTicketMessage,
    SupportTicketRatingRequest,
} from './types';

type ApiEnvelope<T> = {
    message?: string;
    result?: T;
};

type ApiErrorResult = {
    detail?: string;
    errors?: Record<string, string>;
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
    init?: RequestInit,
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

const buildFilterQuery = (filters?: SupportTicketFilters, page = 0, size = 20) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.priority) params.set('priority', filters.priority);
    params.set('page', String(page));
    params.set('size', String(size));
    const query = params.toString();
    return query === '' ? '' : `?${query}`;
};

export const getSupportTickets = (accessToken: string) =>
    request<SupportTicket[]>('/api/v1/support-requests', accessToken, 'دریافت تیکت‌ها ناموفق بود.');

export const createSupportTicket = (accessToken: string, payload: CreateSupportTicketRequest) =>
    request<SupportTicket>('/api/v1/support-requests', accessToken, 'ثبت تیکت ناموفق بود.', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const getSupportTicketDetail = (accessToken: string, ticketId: number) =>
    request<SupportTicketDetail>(`/api/v1/support-requests/${ticketId}`, accessToken, 'دریافت جزئیات تیکت ناموفق بود.');

export const addSupportTicketMessage = (accessToken: string, ticketId: number, message: string) =>
    request<SupportTicketMessage>(`/api/v1/support-requests/${ticketId}/messages`, accessToken, 'ارسال پیام ناموفق بود.', {
        method: 'POST',
        body: JSON.stringify({message}),
    });

export const rateSupportTicket = (accessToken: string, ticketId: number, payload: SupportTicketRatingRequest) =>
    request<SupportTicket>(`/api/v1/support-requests/${ticketId}/rating`, accessToken, 'ثبت امتیاز ناموفق بود.', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const closeSupportTicket = (accessToken: string, ticketId: number) =>
    request<SupportTicket>(`/api/v1/support-requests/${ticketId}/close`, accessToken, 'بستن تیکت ناموفق بود.', {
        method: 'POST',
    });

export const getAdminSupportTickets = (
    accessToken: string,
    filters?: SupportTicketFilters,
    page = 0,
    size = 20,
) =>
    request<PagedResult<SupportTicket>>(
        `/api/v1/admin/support-requests${buildFilterQuery(filters, page, size)}`,
        accessToken,
        'دریافت تیکت‌های پشتیبانی ناموفق بود.',
    );

export const getAdminSupportTicketDetail = (accessToken: string, ticketId: number) =>
    request<SupportTicketDetail>(
        `/api/v1/admin/support-requests/${ticketId}`,
        accessToken,
        'دریافت جزئیات تیکت ناموفق بود.',
    );

export const addAdminSupportTicketMessage = (accessToken: string, ticketId: number, message: string) =>
    request<SupportTicketMessage>(
        `/api/v1/admin/support-requests/${ticketId}/messages`,
        accessToken,
        'ارسال پاسخ ناموفق بود.',
        {
            method: 'POST',
            body: JSON.stringify({message}),
        },
    );

export const updateAdminSupportTicketStatus = (
    accessToken: string,
    ticketId: number,
    status: SupportTicket['status'],
) =>
    request<SupportTicket>(
        `/api/v1/admin/support-requests/${ticketId}/status`,
        accessToken,
        'به‌روزرسانی وضعیت تیکت ناموفق بود.',
        {
            method: 'PATCH',
            body: JSON.stringify({status}),
        },
    );

export const closeAdminSupportTicket = (accessToken: string, ticketId: number) =>
    request<SupportTicket>(`/api/v1/admin/support-requests/${ticketId}/close`, accessToken, 'بستن تیکت ناموفق بود.', {
        method: 'POST',
    });

export const editSupportTicketMessage = (
    accessToken: string,
    ticketId: number,
    messageId: number,
    message: string,
) =>
    request<SupportTicketMessage>(
        `/api/v1/support-requests/${ticketId}/messages/${messageId}`,
        accessToken,
        'ویرایش پیام ناموفق بود.',
        {
            method: 'PATCH',
            body: JSON.stringify({message}),
        },
    );

export const editSupportTicketInitialMessage = (accessToken: string, ticketId: number, message: string) =>
    request<SupportTicketMessage>(
        `/api/v1/support-requests/${ticketId}/initial-message`,
        accessToken,
        'ویرایش پیام ناموفق بود.',
        {
            method: 'PATCH',
            body: JSON.stringify({message}),
        },
    );

export const editAdminSupportTicketMessage = (
    accessToken: string,
    ticketId: number,
    messageId: number,
    message: string,
) =>
    request<SupportTicketMessage>(
        `/api/v1/admin/support-requests/${ticketId}/messages/${messageId}`,
        accessToken,
        'ویرایش پیام ناموفق بود.',
        {
            method: 'PATCH',
            body: JSON.stringify({message}),
        },
    );
