import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {WebSocketService} from '../src/services/webSocketService';

type Subscription = { unsubscribe: ReturnType<typeof vi.fn> };

const stomp = vi.hoisted(() => {
    const instances: any[] = [];

    class MockClient {
        active = false;
        connected = false;
        onConnect: (() => void) | undefined;
        onWebSocketClose: (() => void) | undefined;
        onStompError: ((frame: { headers: { message?: string } }) => void) | undefined;
        onWebSocketError: (() => void) | undefined;
        activate = vi.fn(() => {
            this.active = true;
        });
        deactivate = vi.fn(async () => {
            this.active = false;
            this.connected = false;
        });
        forceDisconnect = vi.fn();
        subscribe = vi.fn((_destination: string, _handler: (message: { body: string }) => void): Subscription => ({
            unsubscribe: vi.fn(),
        }));

        constructor(readonly config: Record<string, unknown>) {
            instances.push(this);
        }
    }

    return {instances, MockClient};
});

vi.mock('@stomp/stompjs', () => ({Client: stomp.MockClient}));

describe('WebSocketService', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('window', {
            location: {origin: 'http://localhost:5173', protocol: 'http:'},
            setTimeout,
            clearTimeout,
        });
        stomp.instances.length = 0;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('configures authentication, reconnect and heartbeats for production use', () => {
        const service = new WebSocketService();
        service.subscribeJson('jwt-token', '/topic/market/ABC', vi.fn());

        const client = stomp.instances[0];
        expect(client.config.connectHeaders).toEqual({Authorization: 'Bearer jwt-token'});
        expect(client.config.reconnectDelay).toBe(3000);
        expect(client.config.heartbeatIncoming).toBe(10000);
        expect(client.config.heartbeatOutgoing).toBe(10000);
        expect(client.config.discardWebsocketOnCommFailure).toBe(true);
        expect(client.activate).toHaveBeenCalledOnce();
        service.disconnect();
    });

    it('restores every destination subscription after a network reconnect', () => {
        const service = new WebSocketService();
        const reconcile = vi.fn();
        service.subscribeJson('jwt-token', '/topic/market/ABC', vi.fn(), {onReconnect: reconcile});
        service.subscribeJson('jwt-token', '/user/queue/orders', vi.fn(), {onReconnect: reconcile});
        const client = stomp.instances[0];

        client.connected = true;
        client.onConnect?.();
        expect(client.subscribe).toHaveBeenCalledTimes(2);
        expect(reconcile).not.toHaveBeenCalled();

        client.connected = false;
        client.onWebSocketClose?.();
        client.connected = true;
        client.onConnect?.();

        expect(client.subscribe).toHaveBeenCalledTimes(4);
        expect(client.subscribe.mock.calls.map(([destination]) => destination)).toEqual([
            '/topic/market/ABC',
            '/user/queue/orders',
            '/topic/market/ABC',
            '/user/queue/orders',
        ]);
        expect(reconcile).toHaveBeenCalledOnce();
        service.disconnect();
    });

    it('reconciles after every restored connection but never on the initial connection', () => {
        const service = new WebSocketService();
        const reconcile = vi.fn();
        service.subscribeJson('jwt-token', '/topic/market/ABC', vi.fn(), {onReconnect: reconcile});
        const client = stomp.instances[0];

        client.connected = true;
        client.onConnect?.();
        expect(reconcile).not.toHaveBeenCalled();

        client.connected = false;
        client.onWebSocketClose?.();
        client.connected = true;
        client.onConnect?.();
        client.connected = false;
        client.onWebSocketClose?.();
        client.connected = true;
        client.onConnect?.();

        expect(reconcile).toHaveBeenCalledTimes(2);
        service.disconnect();
    });

    it('unsubscribes on cleanup and releases an idle socket', async () => {
        const service = new WebSocketService();
        const unsubscribe = service.subscribeJson('jwt-token', '/topic/market/ABC', vi.fn());
        const client = stomp.instances[0];
        client.connected = true;
        client.onConnect?.();
        const brokerSubscription = client.subscribe.mock.results[0].value as Subscription;

        unsubscribe();
        expect(brokerSubscription.unsubscribe).toHaveBeenCalledOnce();
        await vi.advanceTimersByTimeAsync(5000);
        expect(client.deactivate).toHaveBeenCalledOnce();
    });
});
