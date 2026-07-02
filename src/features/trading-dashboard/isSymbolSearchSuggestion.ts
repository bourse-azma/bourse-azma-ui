import type {SymbolSearchSuggestion} from '../symbol-search/types';

export const isSymbolSearchSuggestion = (value: unknown): value is SymbolSearchSuggestion => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as SymbolSearchSuggestion;
    return (
        typeof candidate.key === 'string' &&
        candidate.key.trim() !== '' &&
        typeof candidate.symbol === 'string' &&
        candidate.symbol.trim() !== '' &&
        typeof candidate.name === 'string' &&
        candidate.name.trim() !== ''
    );
};
