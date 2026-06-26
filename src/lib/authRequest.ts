export function withAuthRequest(accessToken?: string | null, init: RequestInit = {}): RequestInit {
    const headers = new Headers(init.headers);
    if (accessToken && accessToken.trim() !== '') {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (init.body != null && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return {
        ...init,
        credentials: 'include',
        headers,
    };
}

export type PagedResult<T> = {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
};
