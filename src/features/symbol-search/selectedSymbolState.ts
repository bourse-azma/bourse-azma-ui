import {getTsetmcMostVisited} from './api';
import {toSymbolSuggestionFromMostVisited} from './mappers';
import {MOST_VISITED_MARKET_OPTIONS} from '../popular-symbols/mostVisitedUtils';
import type {SymbolSearchSuggestion} from './types';

export const FEATURED_DASHBOARD_SYMBOL_COUNT = 5;

export const LOGIN_EPOCH_STORAGE_KEY = 'bourse-azma-login-epoch';
const SELECTED_SYMBOL_STORAGE_KEY = 'bourse-azma-selected-symbol';
const LEGACY_SELECTED_SYMBOL_STORAGE_KEY = 'bourse-azma-selected-symbol';
const LEGACY_URL_SYMBOL_KEY_PARAM = 'symbolKey';

type StoredSymbolSelection = {
    loginEpoch: string;
    symbol: SymbolSearchSuggestion;
};

const isValidSymbolSearchSuggestion = (value: unknown): value is SymbolSearchSuggestion => {
    if (!value || typeof value !== 'object') return false;
    const item = value as SymbolSearchSuggestion;
    return (
        typeof item.key === 'string' &&
        item.key.trim() !== '' &&
        typeof item.type === 'string' &&
        typeof item.symbol === 'string' &&
        typeof item.name === 'string'
    );
};

const isStoredSymbolSelection = (value: unknown): value is StoredSymbolSelection => {
    if (!value || typeof value !== 'object') return false;
    const item = value as StoredSymbolSelection;
    return (
        typeof item.loginEpoch === 'string' &&
        item.loginEpoch.trim() !== '' &&
        isValidSymbolSearchSuggestion(item.symbol)
    );
};

const randomInt = (maxExclusive: number): number => {
    if (maxExclusive <= 1) return 0;
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % maxExclusive;
};

export const fetchRandomFeaturedSymbol = async (
    signal?: AbortSignal,
): Promise<SymbolSearchSuggestion | null> => {
    const market = MOST_VISITED_MARKET_OPTIONS[0];

    try {
        const result = await getTsetmcMostVisited(market.id, FEATURED_DASHBOARD_SYMBOL_COUNT, signal);
        const pool = result.mostVisitedInstruments
            .map((instrument) => toSymbolSuggestionFromMostVisited(instrument, market.type))
            .filter((suggestion): suggestion is SymbolSearchSuggestion => suggestion !== null)
            .slice(0, FEATURED_DASHBOARD_SYMBOL_COUNT);

        if (pool.length === 0) {
            return null;
        }

        return pool[randomInt(pool.length)] ?? pool[0];
    } catch {
        return null;
    }
};

export const readLoginEpoch = (): string | null => {
    if (typeof window === 'undefined') return null;
    const value = sessionStorage.getItem(LOGIN_EPOCH_STORAGE_KEY);
    return value && value.trim() !== '' ? value : null;
};

export const startNewLoginEpoch = (): string => {
    const epoch = `${Date.now().toString(36)}-${crypto.randomUUID()}`;
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(LOGIN_EPOCH_STORAGE_KEY, epoch);
    }
    return epoch;
};

export const clearLoginEpoch = (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(LOGIN_EPOCH_STORAGE_KEY);
};

const readFromStorage = (expectedLoginEpoch: string): SymbolSearchSuggestion | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(SELECTED_SYMBOL_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (isStoredSymbolSelection(parsed)) {
            return parsed.loginEpoch === expectedLoginEpoch ? parsed.symbol : null;
        }
        return null;
    } catch {
        return null;
    }
};

const clearLegacySymbolKeyFromUrl = (): void => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(LEGACY_URL_SYMBOL_KEY_PARAM)) return;
    url.searchParams.delete(LEGACY_URL_SYMBOL_KEY_PARAM);
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
};

const clearLegacyLocalStorageSymbol = (): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(LEGACY_SELECTED_SYMBOL_STORAGE_KEY);
};

export const loadStoredSelectedSymbol = (loginEpoch: string): SymbolSearchSuggestion | null => {
    if (!loginEpoch) return null;
    clearLegacySymbolKeyFromUrl();
    clearLegacyLocalStorageSymbol();
    return readFromStorage(loginEpoch);
};

export const persistSelectedSymbol = (symbol: SymbolSearchSuggestion, loginEpoch: string): void => {
    if (typeof window === 'undefined' || !loginEpoch) return;
    const payload: StoredSymbolSelection = {loginEpoch, symbol};
    sessionStorage.setItem(SELECTED_SYMBOL_STORAGE_KEY, JSON.stringify(payload));
};

export const clearSessionSelectedSymbol = (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SELECTED_SYMBOL_STORAGE_KEY);
    clearLegacyLocalStorageSymbol();
};

export const clearLoginSymbolState = (): void => {
    clearSessionSelectedSymbol();
    clearLoginEpoch();
};
