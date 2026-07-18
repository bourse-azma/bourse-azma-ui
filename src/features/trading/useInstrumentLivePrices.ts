import {useEffect, useState} from 'react';
import {getTsetmcClosingPriceInfo} from '../symbol-search/api';
import {resolveLivePriceFromClosing, resolveLivePricePercentFromClosing} from './livePrice';
import {type MarketDataUpdate, marketTopic} from '../../services/realtimeTypes';
import {webSocketService} from '../../services/webSocketService';

const normalizeInstrumentCode = (value: string) => value.trim();

export const uniqueInstrumentCodes = (instrumentCodes: string[]) => {
    const seen = new Set<string>();
    const codes: string[] = [];

    for (const code of instrumentCodes) {
        const normalized = normalizeInstrumentCode(code);
        if (normalized === '' || seen.has(normalized)) {
            continue;
        }
        seen.add(normalized);
        codes.push(normalized);
    }

    return codes;
};

export const buildInstrumentCodesSignature = (instrumentCodes: string[]) =>
    uniqueInstrumentCodes(instrumentCodes).sort().join('|');

const parseInstrumentCodesSignature = (signature: string) =>
    signature === '' ? [] : signature.split('|');

export const useInstrumentLivePrices = (instrumentCodes: string[], accessToken: string, enabled = true) => {
    const codesSignature = buildInstrumentCodesSignature(instrumentCodes);

    const [prices, setPrices] = useState<Record<string, number | null>>({});
    const [changePercents, setChangePercents] = useState<Record<string, number | null>>({});

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const codes = parseInstrumentCodesSignature(codesSignature);
        if (codes.length === 0) {
            setPrices({});
            setChangePercents({});
            return;
        }

        let active = true;
        const controllers = new Set<AbortController>();
        const socketUpdatedCodes = new Set<string>();

        const fetchPrices = async () => {
            const entries = await Promise.all(
                codes.map(async (instrumentCode) => {
                    const controller = new AbortController();
                    controllers.add(controller);

                    try {
                        const closing = await getTsetmcClosingPriceInfo(instrumentCode, controller.signal).catch(
                            () => null
                        );
                        return [
                            instrumentCode,
                            resolveLivePriceFromClosing(closing),
                            resolveLivePricePercentFromClosing(closing),
                        ] as const;
                    } finally {
                        controllers.delete(controller);
                    }
                })
            );

            if (!active) return;

            setPrices((prev) => {
                const next = {...prev};
                for (const [instrumentCode, livePrice] of entries) {
                    if (socketUpdatedCodes.has(instrumentCode)) continue;
                    next[instrumentCode] = livePrice;
                }
                return next;
            });
            setChangePercents((prev) => {
                const next = {...prev};
                for (const [instrumentCode, , changePercent] of entries) {
                    if (socketUpdatedCodes.has(instrumentCode)) continue;
                    next[instrumentCode] = changePercent;
                }
                return next;
            });
        };

        const reconcile = () => {
            // Values received before the disconnect are no longer authoritative. A socket update
            // that arrives while this request is in flight will mark its code and win the race.
            socketUpdatedCodes.clear();
            void fetchPrices();
        };
        const unsubscribers = codes.map((instrumentCode) =>
            webSocketService.subscribeJson<MarketDataUpdate>(
                accessToken,
                marketTopic(instrumentCode),
                (update) => {
                    if (!active || update.instrumentCode !== instrumentCode || !update.closingPrice) return;
                    socketUpdatedCodes.add(instrumentCode);
                    setPrices((prev) => ({
                        ...prev,
                        [instrumentCode]: resolveLivePriceFromClosing(update.closingPrice),
                    }));
                    setChangePercents((prev) => ({
                        ...prev,
                        [instrumentCode]: resolveLivePricePercentFromClosing(update.closingPrice),
                    }));
                },
                {onReconnect: reconcile}
            )
        );

        void fetchPrices();

        return () => {
            active = false;
            unsubscribers.forEach((unsubscribe) => unsubscribe());
            for (const controller of controllers) {
                controller.abort();
            }
            controllers.clear();
        };
    }, [accessToken, codesSignature, enabled]);

    return {prices, changePercents};
};
