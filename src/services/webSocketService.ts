import {Client, type IMessage, type StompSubscription} from '@stomp/stompjs';
import {appConfig} from '../config/appConfig';

type JsonMessageHandler<T> = (payload: T) => void;
type ReconnectHandler = () => void;
type SubscriptionListener = {
    onMessage: JsonMessageHandler<unknown>;
    onReconnect?: ReconnectHandler;
};

export type WebSocketSubscriptionOptions = {
    /** Called after a lost connection has been restored and all STOMP subscriptions are active. */
    onReconnect?: ReconnectHandler;
};

const RECONNECT_DELAY_MS = 3_000;
const HEARTBEAT_MS = 10_000;
const CONNECTION_TIMEOUT_MS = 10_000;
const IDLE_DISCONNECT_DELAY_MS = 5_000;

const resolveBrokerUrl = () => {
    const configured = appConfig.wsBaseUrl.trim();
    if (/^wss?:\/\//i.test(configured)) {
        return configured;
    }
    const url = new URL(configured, window.location.origin);
    url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString();
};

export class WebSocketService {
    private client: Client | null = null;
    private accessToken: string | null = null;
    private generation = 0;
    private nextListenerId = 1;
    private idleTimer: number | null = null;
    private readonly listeners = new Map<string, Map<number, SubscriptionListener>>();
    private readonly brokerSubscriptions = new Map<string, StompSubscription>();

    subscribeJson<T>(
        accessToken: string,
        destination: string,
        handler: JsonMessageHandler<T>,
        options: WebSocketSubscriptionOptions = {}
    ) {
        const normalizedToken = accessToken.trim();
        if (!destination.startsWith('/')) {
            throw new Error('A STOMP destination must start with /.');
        }

        this.cancelIdleDisconnect();
        const listenerId = this.nextListenerId++;
        const destinationListeners = this.listeners.get(destination) ?? new Map<number, SubscriptionListener>();
        destinationListeners.set(listenerId, {
            onMessage: handler as JsonMessageHandler<unknown>,
            onReconnect: options.onReconnect,
        });
        this.listeners.set(destination, destinationListeners);

        this.ensureConnected(normalizedToken);
        this.attachDestination(destination);

        let active = true;
        return () => {
            if (!active) return;
            active = false;
            this.removeListener(destination, listenerId);
        };
    }

    disconnect() {
        this.cancelIdleDisconnect();
        this.listeners.clear();
        this.deactivateClient();
    }

    private ensureConnected(accessToken: string) {
        if (this.client && this.accessToken === accessToken) {
            if (!this.client.active) this.client.activate();
            return;
        }

        this.deactivateClient();
        const generation = ++this.generation;
        let hasConnected = false;
        const client = new Client({
            brokerURL: resolveBrokerUrl(),
            connectHeaders: accessToken ? {Authorization: `Bearer ${accessToken}`} : {},
            reconnectDelay: RECONNECT_DELAY_MS,
            heartbeatIncoming: HEARTBEAT_MS,
            heartbeatOutgoing: HEARTBEAT_MS,
            connectionTimeout: CONNECTION_TIMEOUT_MS,
            discardWebsocketOnCommFailure: true,
            debug: () => undefined,
        });

        client.onConnect = () => {
            if (!this.isCurrent(client, generation)) return;
            const reconnected = hasConnected;
            hasConnected = true;
            this.brokerSubscriptions.clear();
            for (const destination of this.listeners.keys()) {
                this.attachDestination(destination);
            }
            if (reconnected) {
                this.notifyReconnect();
            }
        };
        client.onWebSocketClose = () => {
            if (this.isCurrent(client, generation)) {
                this.brokerSubscriptions.clear();
            }
        };
        client.onStompError = (frame) => {
            if (this.isCurrent(client, generation)) {
                console.error('STOMP broker rejected the connection:', frame.headers.message ?? 'Unknown error');
                this.brokerSubscriptions.clear();
                client.forceDisconnect();
            }
        };
        client.onWebSocketError = () => {
            // @stomp/stompjs reconnects automatically after the socket closes.
        };

        this.client = client;
        this.accessToken = accessToken;
        client.activate();
    }

    private attachDestination(destination: string) {
        const client = this.client;
        if (!client?.connected || this.brokerSubscriptions.has(destination) || !this.listeners.has(destination)) {
            return;
        }
        const subscription = client.subscribe(destination, (message) => this.dispatch(destination, message));
        this.brokerSubscriptions.set(destination, subscription);
    }

    private dispatch(destination: string, message: IMessage) {
        const destinationListeners = this.listeners.get(destination);
        if (!destinationListeners || destinationListeners.size === 0) return;

        let payload: unknown;
        try {
            payload = JSON.parse(message.body) as unknown;
        } catch {
            console.error(`Ignoring malformed JSON received from ${destination}.`);
            return;
        }
        for (const listener of destinationListeners.values()) {
            try {
                listener.onMessage(payload);
            } catch (error) {
                console.error(`WebSocket subscriber failed for ${destination}.`, error);
            }
        }
    }

    private notifyReconnect() {
        // A hook can listen to more than one destination with the same reconciliation callback.
        // Run that callback once per reconnect, after every destination has been reattached.
        const callbacks = new Set<ReconnectHandler>();
        for (const destinationListeners of this.listeners.values()) {
            for (const listener of destinationListeners.values()) {
                if (listener.onReconnect) callbacks.add(listener.onReconnect);
            }
        }
        for (const callback of callbacks) {
            try {
                callback();
            } catch (error) {
                console.error('WebSocket reconnect reconciliation failed.', error);
            }
        }
    }

    private removeListener(destination: string, listenerId: number) {
        const destinationListeners = this.listeners.get(destination);
        if (!destinationListeners) return;
        destinationListeners.delete(listenerId);
        if (destinationListeners.size > 0) return;

        this.listeners.delete(destination);
        try {
            this.brokerSubscriptions.get(destination)?.unsubscribe();
        } catch {
            // The socket may have closed between the cleanup check and UNSUBSCRIBE.
        }
        this.brokerSubscriptions.delete(destination);
        if (this.listeners.size === 0) {
            this.scheduleIdleDisconnect();
        }
    }

    private scheduleIdleDisconnect() {
        this.cancelIdleDisconnect();
        this.idleTimer = window.setTimeout(() => {
            this.idleTimer = null;
            if (this.listeners.size === 0) {
                this.deactivateClient();
            }
        }, IDLE_DISCONNECT_DELAY_MS);
    }

    private cancelIdleDisconnect() {
        if (this.idleTimer !== null) {
            window.clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    private deactivateClient() {
        const client = this.client;
        this.generation += 1;
        this.client = null;
        this.accessToken = null;
        this.brokerSubscriptions.clear();
        if (client) {
            void client.deactivate().catch(() => undefined);
        }
    }

    private isCurrent(client: Client, generation: number) {
        return this.client === client && this.generation === generation;
    }
}

export const webSocketService = new WebSocketService();
