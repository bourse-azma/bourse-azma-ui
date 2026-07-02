import {appConfig} from '../../config/appConfig';
import {toApiErrorMessage} from '../../lib/apiError';
import {withAuthRequest} from '../../lib/authRequest';
import type {IndustrySummary, IndustrySymbolsResult} from './types';

type ApiEnvelope<T> = {
    message?: string;
    result?: T;
    code?: number;
};

const normalizePath = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const joinUrl = (baseUrl: string, path: string) => `${trimTrailingSlash(baseUrl)}${normalizePath(path)}`;

const request = async <T>(path: string, accessToken: string, fallbackMessage: string, signal?: AbortSignal) => {
    const response = await fetch(joinUrl(appConfig.symbolSearchApiBaseUrl, path), withAuthRequest(accessToken, {
        method: 'GET',
        headers: {
            accept: '*/*',
        },
        signal,
    }));

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
