import type {SymbolSearchRow, SymbolSearchSuggestion, SymbolSourceType, TsetmcMostVisitedInstrument,} from './types';

export {toSymbolDetailsViewModel} from './symbolDetailsMapper';

const normalizeText = (value: string) =>
    value
        .replace('ي', 'ی')
        .replace('ك', 'ک')
        .replace(/\s+/g, ' ')
        .trim();

const toRecord = (value: unknown): Record<string, unknown> =>
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string | null => {
    if (typeof value === 'string') {
        const normalized = normalizeText(value);
        return normalized === '' ? null : normalized;
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
};

const getCaseInsensitive = (record: Record<string, unknown>, candidates: string[]) => {
    for (const candidate of candidates) {
        if (candidate in record) return record[candidate];
        const foundKey = Object.keys(record).find((key) => key.toLowerCase() === candidate.toLowerCase());
        if (foundKey) return record[foundKey];
    }
    return null;
};

const pickString = (record: Record<string, unknown>, ...candidates: string[]) =>
    asString(getCaseInsensitive(record, candidates));

export const toExchangeBadge = (type: SymbolSourceType) => {
    if (type === 'TSE') return 'TSE';
    if (type === 'IFB') return 'IFB';
    if (type === 'FUND') return 'FUND';
    if (type === 'UNKNOWN') return '';
    return type;
};

export const toMarketLabel = (type: SymbolSourceType) => {
    if (type === 'TSE') return 'بورس';
    if (type === 'IFB') return 'فرابورس';
    if (type === 'FUND') return 'صندوق';
    if (type === 'UNKNOWN') return '';
    return type;
};

export const toSymbolSuggestionFromMostVisited = (
    instrument: TsetmcMostVisitedInstrument,
    type: SymbolSourceType
): SymbolSearchSuggestion | null => {
    const symbol = instrument.symbol?.trim();
    const name = instrument.fullName?.trim();
    const instrumentCode = instrument.instrumentCode?.trim();
    if (!symbol || !name || !instrumentCode) return null;

    return {
        key: `${type}:${symbol}:${instrumentCode}`,
        type,
        symbol,
        name,
        instrumentCode,
        isin: null,
        oldInstrumentCodes: [],
    };
};

export const toSymbolSuggestion = (row: SymbolSearchRow): SymbolSearchSuggestion | null => {
    const record = toRecord(row);
    const symbol = pickString(record, 'symbol');
    const name = pickString(record, 'name');
    const rawType = pickString(record, 'type', 'marketName', 'flowTitle', 'exchange', 'source', 'flow') ?? 'UNKNOWN';
    let type: SymbolSourceType = 'UNKNOWN';

    if (rawType === 'TSE' || rawType === 'IFB' || rawType === 'FUND') {
        type = rawType;
    } else if (rawType !== 'UNKNOWN') {
        const normalized = rawType.replace(/\s+/g, '');
        if (normalized.includes('فرابورس') || normalized.includes('پایه')) {
            type = 'IFB';
        } else if (normalized.includes('بورس')) {
            type = 'TSE';
        } else if (normalized.includes('صندوق') || normalized.toLowerCase().includes('fund')) {
            type = 'FUND';
        }
    }

    if (!symbol || !name) return null;

    const instrumentCode = pickString(record, 'inscode', 'insCode', 'instrumentCode');
    const oldInstrumentCodesRaw = getCaseInsensitive(record, ['old_inscodes', 'oldInscodes']);
    const oldInstrumentCodes =
        Array.isArray(oldInstrumentCodesRaw) && oldInstrumentCodesRaw.length > 0
            ? oldInstrumentCodesRaw.map(asString).filter((value): value is string => value !== null)
            : [];

    return {
        key: `${type}:${symbol}:${instrumentCode ?? 'none'}`,
        type,
        symbol,
        name,
        instrumentCode,
        isin: pickString(record, 'isin'),
        oldInstrumentCodes,
    };
};

