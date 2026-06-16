import type {SymbolSearchSuggestion} from './types';

const SELECTED_SYMBOL_STORAGE_KEY = 'boors-azma-selected-symbol';
const LEGACY_URL_SYMBOL_KEY_PARAM = 'symbolKey';

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

const readFromStorage = (): SymbolSearchSuggestion | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(SELECTED_SYMBOL_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        return isValidSymbolSearchSuggestion(parsed) ? parsed : null;
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

export const loadStoredSelectedSymbol = (): SymbolSearchSuggestion | null => {
    clearLegacySymbolKeyFromUrl();
    return readFromStorage();
};

export const persistSelectedSymbol = (symbol: SymbolSearchSuggestion): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SELECTED_SYMBOL_STORAGE_KEY, JSON.stringify(symbol));
};
