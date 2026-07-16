import {afterEach, describe, expect, it, vi} from 'vitest';
import {toApiErrorMessage} from '../src/lib/apiError';
import {withAuthRequest} from '../src/lib/authRequest';
import {submitAuthRequest} from '../src/features/auth/hooks/submitAuthRequest';
import {
    cancelTradingOrder,
    createTradingOrder,
    getPrivateOrderBook,
    getTradingOrders,
    updateTradingOrder,
} from '../src/features/trading/api';
import {
    addSymbolToWatchlist,
    createWatchlist,
    deleteWatchlist,
    getWatchlists,
    removeSymbolFromWatchlist,
} from '../src/features/watchlist/api';
import {
    addSupportTicketMessage,
    closeSupportTicket,
    getAdminSupportTickets,
    rateSupportTicket,
} from '../src/features/support/api';

const response = (body: unknown, status = 200) => new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    {status, headers: {'Content-Type': 'application/json'}},
);

const fetchMock = () => vi.mocked(globalThis.fetch);

afterEach(() => {
    vi.restoreAllMocks();
});

describe('authenticated request contract', () => {
    it('always sends cookies and adds bearer/content-type only when needed', () => {
        const init = withAuthRequest(' token-123 ', {
            method: 'POST',
            body: '{}',
            headers: {'X-Request-ID': 'request-1'},
        });
        const headers = new Headers(init.headers);

        expect(init.credentials).toBe('include');
        expect(headers.get('Authorization')).toBe('Bearer token-123');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(headers.get('X-Request-ID')).toBe('request-1');
    });

    it('does not create authorization/content-type headers for cookie-only GET', () => {
        const init = withAuthRequest('   ', {method: 'GET'});
        const headers = new Headers(init.headers);
        expect(init.credentials).toBe('include');
        expect(headers.has('Authorization')).toBe(false);
        expect(headers.has('Content-Type')).toBe(false);
    });
});

describe('API error envelope contract', () => {
    it('uses detail before validation errors and envelope message', () => {
        expect(toApiErrorMessage({
            message: 'message',
            result: {detail: 'detail', errors: {quantity: 'field'}},
        }, 'fallback')).toBe('detail');
    });

    it('falls back through field error, message, and fallback', () => {
        expect(toApiErrorMessage({result: {errors: {quantity: 'field'}}}, 'fallback')).toBe('field');
        expect(toApiErrorMessage({message: 'message'}, 'fallback')).toBe('message');
        expect(toApiErrorMessage({result: {errors: {quantity: '  '}}}, 'fallback')).toBe('fallback');
        expect(toApiErrorMessage(null, 'fallback')).toBe('fallback');
    });
});

describe('authentication HTTP contract', () => {
    it.each(['login', 'register'] as const)('submits %s and accepts the httpOnly-cookie response', async (endpoint) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            result: {accessToken: null, userId: 9, role: 'USER'},
        })));

        await expect(submitAuthRequest(endpoint, {username: 'ali'})).resolves.toEqual({
            accessToken: '', userId: 9, role: 'USER',
        });
        const [url, init] = fetchMock().mock.calls[0] as [string, RequestInit];
        expect(url).toBe(`/api/auth/${endpoint}`);
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('include');
        expect(JSON.parse(String(init.body))).toEqual({username: 'ali'});
    });

    it('rejects malformed success responses instead of creating a broken session', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(response({result: {userId: 0, role: 'USER'}}))
            .mockResolvedValueOnce(response('{bad json')));

        await expect(submitAuthRequest('login', {})).rejects.toThrow('شناسه کاربر دریافت نشد.');
        await expect(submitAuthRequest('login', {})).rejects.toThrow('پاسخ سرویس احراز هویت معتبر نیست.');
    });

    it('surfaces backend validation errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            result: {errors: {password: 'رمز نامعتبر است.'}},
        }, 400)));
        await expect(submitAuthRequest('register', {})).rejects.toThrow('رمز نامعتبر است.');
    });
});

describe('trading HTTP contract', () => {
    it('builds paged multi-status order query without losing repeated status values', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
            result: {
                items: [], page: 2, size: 40, totalElements: 0, totalPages: 0, hasNext: false,
            }
        })));

        await getTradingOrders('abc', 2, 40, ['REQUESTED', 'TRIGGER_PENDING']);
        const [url, init] = fetchMock().mock.calls[0] as [string, RequestInit];
        const parsed = new URL(url, 'http://local');
        expect(parsed.pathname).toBe('/api/v1/trading/orders');
        expect(parsed.searchParams.get('page')).toBe('2');
        expect(parsed.searchParams.get('size')).toBe('40');
        expect(parsed.searchParams.getAll('statuses')).toEqual(['REQUESTED', 'TRIGGER_PENDING']);
        expect(new Headers(init.headers).get('Authorization')).toBe('Bearer abc');
    });

    it('sends the complete create-order payload and returns the server result', async () => {
        const payload = {
            side: 'BUY', orderType: 'CONDITIONAL', priceType: 'CUSTOM', symbol: 'خودرو',
            instrumentCode: 'IRO1IKCO0001', quantity: 100, price: 2500, livePrice: 2490,
            trigger: {comparator: 'GREATER_THAN', price: 2600},
        } as const;
        const result = {order: {id: 77}, trades: []};
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({result})));

        await expect(createTradingOrder('abc', payload)).resolves.toEqual(result);
        const [url, init] = fetchMock().mock.calls[0] as [string, RequestInit];
        expect(url).toBe('/api/v1/trading/orders');
        expect(init.method).toBe('POST');
        expect(JSON.parse(String(init.body))).toEqual(payload);
    });

    it('uses the documented update, cancellation, and encoded order-book routes', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(response({result: {order: {id: 12}, trades: []}}))
            .mockResolvedValueOnce(response({result: {order: {id: 12}}}))
            .mockResolvedValueOnce(response({result: {instrumentCode: 'A/B', rows: [], refreshedAt: 'now'}})));

        await updateTradingOrder('abc', 12, {quantity: 8, price: null});
        await cancelTradingOrder('abc', 12);
        await getPrivateOrderBook('abc', 'A/B');

        expect(fetchMock().mock.calls.map(([url]) => url)).toEqual([
            '/api/v1/trading/orders/12',
            '/api/v1/trading/orders/12/cancel',
            '/api/v1/trading/order-book?instrumentCode=A%2FB',
        ]);
        expect((fetchMock().mock.calls[0][1] as RequestInit).method).toBe('PUT');
        expect((fetchMock().mock.calls[1][1] as RequestInit).method).toBe('POST');
    });

    it('rejects missing envelopes, invalid JSON, and non-JSON server failures', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(response({message: 'ok'}))
            .mockResolvedValueOnce(response('not-json'))
            .mockResolvedValueOnce(response('', 503)));

        await expect(getTradingOrders('abc')).rejects.toThrow('پاسخ سرور معتبر نیست.');
        await expect(getTradingOrders('abc')).rejects.toThrow('پاسخ سرور معتبر نیست.');
        await expect(getTradingOrders('abc')).rejects.toThrow('پاسخ غیرمنتظره از سرور');
    });
});

describe('watchlist and support route contracts', () => {
    it('covers watchlist create/add/remove/delete routes including null delete result', async () => {
        const watchlist = {id: 4, name: 'اصلی', symbols: []};
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(response({result: [watchlist]}))
            .mockResolvedValueOnce(response({result: watchlist}, 201))
            .mockResolvedValueOnce(response({result: watchlist}))
            .mockResolvedValueOnce(response({result: watchlist}))
            .mockResolvedValueOnce(response({result: null})));

        await getWatchlists('abc');
        await createWatchlist('abc', 'اصلی');
        await addSymbolToWatchlist('abc', 4, {
            key: 'k', symbol: 'فملی', name: 'ملی مس', type: 'instrument',
            instrumentCode: 'IRO1MSMI0001', isin: 'IRO1MSMI0001',
        });
        await removeSymbolFromWatchlist('abc', 4, 8);
        await expect(deleteWatchlist('abc', 4)).resolves.toBeUndefined();

        expect(fetchMock().mock.calls.map(([url]) => url)).toEqual([
            '/api/v1/watchlists', '/api/v1/watchlists', '/api/v1/watchlists/4/symbols',
            '/api/v1/watchlists/4/symbols/8', '/api/v1/watchlists/4',
        ]);
        expect((fetchMock().mock.calls[4][1] as RequestInit).method).toBe('DELETE');
    });

    it('covers support message/rating/close and encoded admin filters', async () => {
        vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
            Promise.resolve(response({result: {items: [], hasNext: false}}))
        ));

        await addSupportTicketMessage('abc', 11, 'پیام');
        await rateSupportTicket('abc', 11, {rating: 5, comment: 'عالی'});
        await closeSupportTicket('abc', 11);
        await getAdminSupportTickets('abc', {status: 'OPEN', category: 'TRADING', priority: 'HIGH'}, 3, 10);

        expect(fetchMock().mock.calls.map(([url]) => url)).toEqual([
            '/api/v1/support-requests/11/messages',
            '/api/v1/support-requests/11/rating',
            '/api/v1/support-requests/11/close',
            '/api/v1/admin/support-requests?status=OPEN&category=TRADING&priority=HIGH&page=3&size=10',
        ]);
    });
});
