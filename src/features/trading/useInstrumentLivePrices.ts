import {useEffect, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {getTsetmcClosingPriceInfo} from '../symbol-search/api';
import {resolveLivePriceFromClosing, resolveLivePricePercentFromClosing} from './livePrice';

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

export const useInstrumentLivePrices = (instrumentCodes: string[], enabled = true) => {
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
        let timeoutId: number | undefined;
        const controllers = new Set<AbortController>();

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
                    next[instrumentCode] = livePrice;
                }
                return next;
            });
            setChangePercents((prev) => {
                const next = {...prev};
                for (const [instrumentCode, , changePercent] of entries) {
                    next[instrumentCode] = changePercent;
                }
                return next;
            });
        };

        const schedule = async () => {
            await fetchPrices();
            if (!active) return;
            timeoutId = window.setTimeout(() => {
                void schedule();
            }, appConfig.tsetmcClosingPriceRefreshMs);
        };

        void schedule();

        return () => {
            active = false;
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
            for (const controller of controllers) {
                controller.abort();
            }
            controllers.clear();
        };
    }, [codesSignature, enabled]);

    return {prices, changePercents};
};
