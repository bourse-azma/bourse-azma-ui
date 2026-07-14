import {afterEach, describe, expect, it, vi} from 'vitest';
import {getCodalNotices} from './api';

describe('getCodalNotices request sharing', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('does not let one tab abort the shared request used by a reopened tab', async () => {
        let resolveResponse!: (response: Response) => void;
        const networkResponse = new Promise<Response>((resolve) => {
            resolveResponse = resolve;
        });
        const fetchMock = vi.fn(() => networkResponse);
        vi.stubGlobal('fetch', fetchMock);

        const firstController = new AbortController();
        const secondController = new AbortController();
        const query = `symbol=TEST-${Date.now()}&page=1`;

        const firstWait = getCodalNotices<{ notices: unknown[] }>(query, firstController.signal);
        const reopenedTabWait = getCodalNotices<{ notices: unknown[] }>(query, secondController.signal);
        firstController.abort();

        await expect(firstWait).rejects.toMatchObject({name: 'AbortError'});

        resolveResponse(new Response(JSON.stringify({
            code: 200,
            result: {notices: [{id: 1}]},
        }), {
            status: 200,
            headers: {'content-type': 'application/json'},
        }));

        await expect(reopenedTabWait).resolves.toEqual({notices: [{id: 1}]});
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
