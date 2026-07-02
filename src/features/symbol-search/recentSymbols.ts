import type {SymbolSearchSuggestion} from './types';

const RECENT_SYMBOLS_STORAGE_KEY = 'bourse-azma-recent-symbols';
const MAX_RECENT_ITEMS = 6;

export const loadRecentItems = (): SymbolSearchSuggestion[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(RECENT_SYMBOLS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as SymbolSearchSuggestion[];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (item) =>
                item &&
                typeof item === 'object' &&
                typeof item.key === 'string' &&
                typeof item.symbol === 'string' &&
                typeof item.name === 'string'
        );
    } catch {
        return [];
    }
};

export const saveRecentItems = (items: SymbolSearchSuggestion[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RECENT_SYMBOLS_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT_ITEMS)));
};

export const mergeRecentItems = (current: SymbolSearchSuggestion[], target: SymbolSearchSuggestion) => {
    const filtered = current.filter((item) => item.key !== target.key);
    return [target, ...filtered].slice(0, MAX_RECENT_ITEMS);
};
