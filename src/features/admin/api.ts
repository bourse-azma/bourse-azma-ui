import {withAuthRequest} from '../../lib/authRequest';
import {toApiErrorMessage} from '../../lib/apiError';
import type {AdminStats, AdminUserDetail, AdminUserFormValues, PagedUsers} from './types';

type Envelope<T> = { result?: T };

async function get<T>(url: string, accessToken: string): Promise<T> {
    const response = await fetch(url, withAuthRequest(accessToken, {method: 'GET'}));
    const body = await response.json().catch(() => null) as Envelope<T> | null;
    if (!response.ok || !body?.result) throw new Error(toApiErrorMessage(body, 'دریافت اطلاعات ناموفق بود.'));
    return body.result;
}

export const getAdminStats = (token: string) => get<AdminStats>('/api/v1/admin/stats', token);
export const getAdminUsers = (token: string, search: string, onlineOnly: boolean, page: number) => {
    const params = new URLSearchParams({page: String(page), size: '20'});
    if (search.trim()) params.set('search', search.trim());
    if (onlineOnly) params.set('onlineOnly', 'true');
    return get<PagedUsers>(`/api/v1/admin/users?${params}`, token);
};
export const getAdminUserDetail = (token: string, id: number) => get<AdminUserDetail>(`/api/v1/admin/users/${id}`, token);

async function mutate<T>(url: string, accessToken: string, method: string, body?: unknown): Promise<T | undefined> {
    const response = await fetch(url, withAuthRequest(accessToken, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
    }));
    const payload = await response.json().catch(() => null) as Envelope<T> | null;
    if (!response.ok) throw new Error(toApiErrorMessage(payload, 'انجام عملیات ناموفق بود.'));
    return payload?.result;
}

const optional = (value: string) => value.trim() || null;

export const createAdminUser = (token: string, values: AdminUserFormValues) => mutate(
    '/api/v1/admin/users', token, 'POST', {
        ...values,
        username: values.username.trim(), firstName: values.firstName.trim(), lastName: values.lastName.trim(),
        nationalCode: optional(values.nationalCode), phoneNumber: optional(values.phoneNumber),
        email: optional(values.email),
    },
);

export const updateAdminUser = (token: string, id: number, values: AdminUserFormValues) => mutate(
    `/api/v1/admin/users/${id}`, token, 'PUT', {
        id, username: values.username.trim(), firstName: values.firstName.trim(), lastName: values.lastName.trim(),
        nationalCode: optional(values.nationalCode), phoneNumber: optional(values.phoneNumber),
        email: optional(values.email), password: optional(values.password), currentPassword: null,
    },
);

export const setAdminUserBlocked = (token: string, id: number, blocked: boolean, reason?: string) => mutate(
    `/api/v1/admin/users/${id}/block`, token, 'PATCH', {blocked, reason: optional(reason ?? '')},
);

export const deleteAdminUser = (token: string, id: number) => mutate(
    `/api/v1/admin/users/${id}`, token, 'DELETE',
);
