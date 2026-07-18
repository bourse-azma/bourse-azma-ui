import {useCallback, useEffect, useRef, useState} from 'react';
import {getTsetmcInstrumentInfo, getTsetmcRelatedCompanies} from './api';
import {mapRelatedCompaniesToPeerRows} from './peerGroupMapper';
import type {PeerGroupRow} from './types';

type PeerGroupState = {
    rows: PeerGroupRow[];
    sectorName: string | null;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
};

const initialState = (): PeerGroupState => ({
    rows: [],
    sectorName: null,
    loading: false,
    refreshing: false,
    error: null,
});

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

export const usePeerGroup = (instrumentCode: string | null, enabled: boolean) => {
    const [state, setState] = useState<PeerGroupState>(initialState);
    const requestIdRef = useRef(0);
    const hasRowsRef = useRef(false);

    const load = useCallback(async (signal: AbortSignal, silent = false) => {
        if (!instrumentCode || !enabled) {
            hasRowsRef.current = false;
            setState(initialState());
            return;
        }

        const requestId = ++requestIdRef.current;
        setState((prev) => ({
            ...prev,
            loading: silent ? prev.loading : true,
            refreshing: silent,
            error: null,
        }));

        try {
            const instrumentInfo = await getTsetmcInstrumentInfo(instrumentCode, signal);
            const sectorCode = instrumentInfo.sector?.sectorCode?.trim() ?? '';
            const sectorName = instrumentInfo.sector?.sectorName?.trim() ?? null;

            if (!sectorCode) {
                if (requestId !== requestIdRef.current) return;
                hasRowsRef.current = false;
                setState({
                    rows: [],
                    sectorName,
                    loading: false,
                    refreshing: false,
                    error: 'گروه صنعتی برای این نماد یافت نشد.',
                });
                return;
            }

            const relatedCompanies = await getTsetmcRelatedCompanies(sectorCode, signal);
            if (requestId !== requestIdRef.current) return;

            const rows = mapRelatedCompaniesToPeerRows(relatedCompanies.relatedCompanies ?? []);
            hasRowsRef.current = rows.length > 0;
            setState({
                rows,
                sectorName,
                loading: false,
                refreshing: false,
                error: null,
            });
        } catch (error) {
            if (isAbortError(error) || requestId !== requestIdRef.current) return;
            setState((prev) => ({
                ...prev,
                loading: false,
                refreshing: false,
                error: 'بارگذاری نمادهای هم‌گروه با خطا مواجه شد.',
            }));
        }
    }, [enabled, instrumentCode]);

    const refresh = useCallback(() => {
        const controller = new AbortController();
        void load(controller.signal, hasRowsRef.current);
        return () => controller.abort();
    }, [load]);

    useEffect(() => {
        if (!enabled || !instrumentCode) {
            hasRowsRef.current = false;
            setState(initialState());
            return;
        }

        const controller = new AbortController();
        void load(controller.signal);

        return () => {
            controller.abort();
        };
    }, [enabled, instrumentCode, load]);

    return {
        rows: state.rows,
        sectorName: state.sectorName,
        loading: state.loading,
        refreshing: state.refreshing,
        error: state.error,
        refresh,
    };
};
