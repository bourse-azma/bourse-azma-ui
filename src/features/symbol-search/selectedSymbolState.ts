import type {SymbolSearchSuggestion} from './types';

const SELECTED_SYMBOL_STORAGE_KEY = 'boors-azma-selected-symbol';
const RECENT_SYMBOLS_STORAGE_KEY = 'boors-azma-recent-symbols';
const URL_SYMBOL_KEY_PARAM = 'symbolKey';

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

const readFromRecentByKey = (key: string): SymbolSearchSuggestion | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(RECENT_SYMBOLS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return null;
        const match = parsed.find((item) => isValidSymbolSearchSuggestion(item) && item.key === key);
        return match ?? null;
    } catch {
        return null;
    }
};

const readSymbolKeyFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const key = new URLSearchParams(window.location.search).get(URL_SYMBOL_KEY_PARAM);
    return key && key.trim() !== '' ? key : null;
};

export const loadStoredSelectedSymbol = (): SymbolSearchSuggestion | null => {
    const urlKey = readSymbolKeyFromUrl();
    if (urlKey) {
        const stored = readFromStorage();
        if (stored?.key === urlKey) return stored;
        const fromRecent = readFromRecentByKey(urlKey);
        if (fromRecent) return fromRecent;
    }
    return readFromStorage();
};

export const persistSelectedSymbol = (symbol: SymbolSearchSuggestion): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SELECTED_SYMBOL_STORAGE_KEY, JSON.stringify(symbol));

    const url = new URL(window.location.href);
    url.searchParams.set(URL_SYMBOL_KEY_PARAM, symbol.key);
    window.history.replaceState(window.history.state, '', url);
};
