import {appConfig} from '../../../config/appConfig';
import {toApiErrorMessage} from '../../../lib/apiError';
import {withAuthRequest} from '../../../lib/authRequest';
import type {ApiResponse, AuthSession, AuthTokenResult} from '../types';

export const submitAuthRequest = async (endpoint: 'login' | 'register', payload: unknown): Promise<AuthSession> => {
    const response = await fetch(`${appConfig.authApiBaseUrl}/${endpoint}`, withAuthRequest(null, {
        method: 'POST',
        body: JSON.stringify(payload),
    }));

    const text = await response.text();
    let data: unknown = null;
    if (text) {
        try {
            data = JSON.parse(text) as unknown;
        } catch {
            data = null;
        }
    }

    if (!response.ok) {
        throw new Error(toApiErrorMessage(data, 'درخواست ناموفق بود.'));
    }

    if (!data || typeof data !== 'object') {
        throw new Error('پاسخ سرویس احراز هویت معتبر نیست.');
    }

    const apiResponse = data as ApiResponse<AuthTokenResult>;
    const userId = apiResponse.result?.userId;
    const role = apiResponse.result?.role;

    if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('شناسه کاربر دریافت نشد.');
    }
    if (typeof role !== 'string' || role.trim() === '') {
        throw new Error('نقش کاربر دریافت نشد.');
    }

    return {
        accessToken: '',
        userId,
        role,
    };
};
