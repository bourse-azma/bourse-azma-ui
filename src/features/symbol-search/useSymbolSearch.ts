import {useEffect, useMemo, useRef, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {searchSymbols} from './api';
import {toSymbolSuggestion} from './mappers';
import type {SymbolSearchSuggestion} from './types';

type SymbolSearchState = {
    loading: boolean;
    error: string | null;
    results: SymbolSearchSuggestion[];
};

const queryCache = new Map<string, SymbolSearchSuggestion[]>();

const normalizeQuery = (value: string) =>
    value
        .replace('ي', 'ی')
        .replace('ك', 'ک')
        .trim();

const useDebouncedValue = (value: string, delayMs: number) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(timer);
    }, [delayMs, value]);

    return debounced;
};

const dedupeSuggestions = (items: SymbolSearchSuggestion[]) => {
    const map = new Map<string, SymbolSearchSuggestion>();
    items.forEach((item) => {
        if (!map.has(item.key)) map.set(item.key, item);
    });
    return Array.from(map.values());
};

export const useSymbolSearch = (rawQuery: string, enabled: boolean) => {
    const normalized = useMemo(() => normalizeQuery(rawQuery), [rawQuery]);
    const debouncedQuery = useDebouncedValue(normalized, appConfig.symbolSearchDebounceMs);
    const requestVersionRef = useRef(0);
    const [reloadToken, setReloadToken] = useState(0);
    const [state, setState] = useState<SymbolSearchState>({
        loading: false,
        error: null,
        results: [],
    });

    useEffect(() => {
        if (!enabled) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: null,
                results: [],
            }));
            return;
        }

        if (debouncedQuery === '') {
            setState({
                loading: false,
                error: null,
                results: [],
            });
            return;
        }

        const cached = queryCache.get(debouncedQuery);
        if (cached) {
            setState({
                loading: false,
                error: null,
                results: cached,
            });
            return;
        }

        const controller = new AbortController();
        const requestVersion = requestVersionRef.current + 1;
        requestVersionRef.current = requestVersion;

        setState((prev) => ({...prev, loading: true, error: null}));

        const run = async () => {
            try {
                const rows = await searchSymbols(debouncedQuery, controller.signal);
                const suggestions = dedupeSuggestions(
                    rows.map(toSymbolSuggestion).filter((item): item is SymbolSearchSuggestion => item !== null)
                );
                queryCache.set(debouncedQuery, suggestions);

                if (requestVersionRef.current !== requestVersion) return;
                setState({
                    loading: false,
                    error: null,
                    results: suggestions,
                });
            } catch (error) {
                if (controller.signal.aborted) return;
                if (requestVersionRef.current !== requestVersion) return;
                const message = error instanceof Error ? error.message : 'جستجوی نماد با خطا مواجه شد.';
                setState({
                    loading: false,
                    error: message,
                    results: [],
                });
            }
        };

        void run();

        return () => {
            controller.abort();
        };
    }, [debouncedQuery, enabled, reloadToken]);

    const retry = () => {
        if (debouncedQuery === '') return;
        queryCache.delete(debouncedQuery);
        setReloadToken((prev) => prev + 1);
    };

    return {
        query: debouncedQuery,
        ...state,
        retry,
    };
};
