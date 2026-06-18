import {appConfig} from '../../config/appConfig';
import type {IndustrySummary, IndustrySymbolsResult} from './types';

type ApiEnvelope<T> = {
    message?: string;
    result?: T;
    code?: number;
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

const normalizePath = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const joinUrl = (baseUrl: string, path: string) => `${trimTrailingSlash(baseUrl)}${normalizePath(path)}`;

const request = async <T>(path: string, accessToken: string, fallbackMessage: string, signal?: AbortSignal) => {
    const response = await fetch(joinUrl(appConfig.symbolSearchApiBaseUrl, path), {
        method: 'GET',
        headers: {
            accept: '*/*',
            Authorization: `Bearer ${accessToken}`,
        },
        signal,
    });

    const rawText = await response.text();
    const data = rawText.trim() === '' ? null : JSON.parse(rawText) as unknown;

    if (!response.ok) {
        throw new Error(toApiErrorMessage(data, fallbackMessage));
    }

    const envelope = data as ApiEnvelope<T>;
    if (envelope.code !== 200 || envelope.result === undefined) {
        throw new Error(envelope.message || fallbackMessage);
    }

    return envelope.result;
};

export const getIndustries = (accessToken: string, signal?: AbortSignal) =>
    request<IndustrySummary[]>('/industries', accessToken, 'دریافت لیست صنایع ناموفق بود.', signal);

export const getIndustrySymbols = (accessToken: string, industry: string, signal?: AbortSignal) =>
    request<IndustrySymbolsResult>(
        `/industries/symbols?industry=${encodeURIComponent(industry)}`,
        accessToken,
        'دریافت نمادهای صنعت ناموفق بود.',
        signal
    );
