import {useEffect, useMemo, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {getTsetmcClosingPriceInfo} from '../symbol-search/api';
import {resolveLivePriceFromClosing} from './livePrice';

const normalizeInstrumentCode = (value: string) => value.trim();

export const useInstrumentLivePrices = (instrumentCodes: string[]) => {
    const uniqueCodes = useMemo(() => {
        const seen = new Set<string>();
        for (const code of instrumentCodes) {
            const normalized = normalizeInstrumentCode(code);
            if (normalized !== '') {
                seen.add(normalized);
            }
        }
        return [...seen];
    }, [instrumentCodes]);

    const [prices, setPrices] = useState<Record<string, number | null>>({});

    useEffect(() => {
        if (uniqueCodes.length === 0) {
            setPrices({});
            return;
        }

        let active = true;
        const controllers = new Set<AbortController>();
        let timeoutId: number | undefined;

        const fetchPrices = async () => {
            const controller = new AbortController();
            controllers.add(controller);

            try {
                const entries = await Promise.all(
                    uniqueCodes.map(async (instrumentCode) => {
                        const closing = await getTsetmcClosingPriceInfo(instrumentCode, controller.signal).catch(() => null);
                        return [instrumentCode, resolveLivePriceFromClosing(closing)] as const;
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
            } catch {
                // Ignore transient fetch errors; the next refresh will retry.
            } finally {
                controllers.delete(controller);
            }
        };

        const schedule = async () => {
            await fetchPrices();
            if (active) {
                timeoutId = window.setTimeout(() => {
                    void schedule();
                }, appConfig.tsetmcClosingPriceRefreshMs);
            }
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
        };
    }, [uniqueCodes]);

    return prices;
};
