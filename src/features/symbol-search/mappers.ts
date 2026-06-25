import type {
    SymbolDepthRow,
    SymbolDetailRow,
    SymbolDetailsViewModel,
    SymbolOrderBookRow,
    SymbolSearchRow,
    SymbolSearchSuggestion,
    SymbolSourceType,
    TsetmcBestLimitLevel,
    TsetmcClientType,
    TsetmcClosingPriceInfo,
    TsetmcEtfInfo,
    TsetmcInstrumentInfo,
    TsetmcMostVisitedInstrument,
} from './types';
import {buildDepthRowsFromClientType} from './depthMapper';

type DetailsSources = {
    symbol: SymbolSearchSuggestion;
    tsetmcClosing: TsetmcClosingPriceInfo | null;
    tsetmcInfo: TsetmcInstrumentInfo | null;
    tsetmcBestLimits: TsetmcBestLimitLevel[] | null;
    tsetmcClientType: TsetmcClientType | null;
    tsetmcEtf: TsetmcEtfInfo | null;
};

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

const asNumber = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const parsed = Number(value.replace(/,/g, '').trim());
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const isMissing = (value: unknown) =>
    value === null || value === undefined || (typeof value === 'string' && normalizeText(value) === '');

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

const pickNumber = (record: Record<string, unknown>, ...candidates: string[]) =>
    asNumber(getCaseInsensitive(record, candidates));

const firstNonNullNumber = (...values: Array<number | null | undefined>) => {
    for (const value of values) {
        if (value !== null && value !== undefined && Number.isFinite(value)) return value;
    }
    return null;
};

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

const toOrderBookFromTsetmc = (levels: TsetmcBestLimitLevel[] | null): SymbolOrderBookRow[] => {
    if (!levels || levels.length === 0) return [];
    return [...levels]
        .sort((a, b) => (a.levelNumber ?? 0) - (b.levelNumber ?? 0))
        .map((level, index) =>
            normalizeOrderBookSides({
                id: `tsetmc-${index + 1}`,
                level: level.levelNumber,
                askCount: level.askOrderCount,
                askVolume: level.askVolume,
                askPrice: level.askPrice,
                bidPrice: level.bidPrice,
                bidVolume: level.bidVolume,
                bidCount: level.bidOrderCount,
            })
        );
};

const normalizeOrderBookSides = (row: SymbolOrderBookRow): SymbolOrderBookRow => {
    const askPrice = row.askPrice ?? 0;
    const bidPrice = row.bidPrice ?? 0;

    if (askPrice > 0 && bidPrice > 0 && askPrice < bidPrice) {
        return {
            ...row,
            askCount: row.bidCount,
            askVolume: row.bidVolume,
            askPrice: row.bidPrice,
            bidPrice: row.askPrice,
            bidVolume: row.askVolume,
            bidCount: row.askCount,
        };
    }

    return row;
};

const firstNonMissingString = (...values: Array<string | null | undefined>) => {
    for (const value of values) {
        if (!isMissing(value)) {
            return normalizeText(String(value));
        }
    }
    return null;
};

const toDetailRows = (input: {
    source: 'market' | 'fund';
    tradeVolume: number | null;
    tradeValue: number | null;
    marketValue: number | null;
    lastTradeAt: string | null;
    navCancel: number | null;
    navAnnouncementAt: string | null;
    eps: number | null;
    pe: number | null;
    groupPe: number | null;
}): SymbolDetailRow[] => {
    const commonRows: SymbolDetailRow[] = [
        {label: 'حجم معاملات', value: input.tradeVolume, valueType: 'number'},
        {label: 'ارزش معاملات', value: input.tradeValue, valueType: 'currency'},
        {label: 'زمان آخرین معامله', value: input.lastTradeAt, valueType: 'datetime'},
    ];

    if (input.source === 'fund') {
        return [
            ...commonRows,
            {label: 'NAV ابطال', value: input.navCancel, valueType: 'currency'},
            {label: 'زمان اعلام NAV', value: input.navAnnouncementAt, valueType: 'datetime'},
        ];
    }

    return [
        ...commonRows.slice(0, 2),
        {label: 'ارزش بازار', value: input.marketValue, valueType: 'currency'},
        commonRows[2],
        {label: 'EPS', value: input.eps, valueType: 'number'},
        {label: 'P/E', value: input.pe, valueType: 'number', digits: 2},
        {label: 'گروه P/E', value: input.groupPe, valueType: 'number', digits: 2},
    ];
};

export const toSymbolDetailsViewModel = (sources: DetailsSources): SymbolDetailsViewModel => {
    const {symbol, tsetmcClosing, tsetmcInfo, tsetmcBestLimits, tsetmcClientType, tsetmcEtf} = sources;

    const previousClose = tsetmcClosing?.previousClosingPrice ?? null;
    const closePrice = tsetmcClosing?.closingPrice ?? null;
    const lastPrice = tsetmcClosing?.lastTradePrice ?? null;

    const closePricePercent =
        previousClose !== null && previousClose !== 0 && closePrice !== null ? ((closePrice - previousClose) / previousClose) * 100 : null;
    const lastPricePercent =
        previousClose !== null && previousClose !== 0 && lastPrice !== null ? ((lastPrice - previousClose) / previousClose) * 100 : null;

    const navCancel = tsetmcEtf?.cancelNav ?? null;

    const isFund =
        symbol.type === 'FUND' || symbol.name.includes('صندوق') || tsetmcEtf !== null;

    const bubblePercent = isFund
        ? navCancel !== null && navCancel !== 0 && lastPrice !== null
            ? ((lastPrice - navCancel) / navCancel) * 100
            : null
        : closePrice !== null && closePrice !== 0 && lastPrice !== null
            ? ((lastPrice - closePrice) / closePrice) * 100
            : null;

    const allowedMinPrice = tsetmcInfo?.staticPriceThreshold?.minAllowedPrice ?? null;
    const allowedMaxPrice = tsetmcInfo?.staticPriceThreshold?.maxAllowedPrice ?? null;

    const tradeCount = tsetmcClosing?.tradeCount ?? null;
    const tradeVolume = tsetmcClosing?.tradeVolume ?? null;
    const tradeValue = tsetmcClosing?.tradeValue ?? null;
    const totalShares = tsetmcInfo?.totalShares ?? null;
    const marketValue = closePrice !== null && totalShares !== null ? closePrice * totalShares : null;

    const lastTradeAt = firstNonMissingString(tsetmcClosing?.lastTradeAt ?? null);
    const stateTitle = firstNonMissingString(tsetmcClosing?.instrumentState?.stateTitle);
    const navAnnouncementAt = firstNonMissingString(tsetmcEtf?.navAnnouncementAt ?? null);

    const tsetmcInfoRecord = tsetmcInfo ? toRecord(tsetmcInfo as unknown) : {};
    const tsetmcEpsRecord = tsetmcInfo?.eps ? toRecord(tsetmcInfo.eps as unknown) : {};

    const pickFromRecords = (records: Record<string, unknown>[], keys: string[]) => {
        for (const record of records) {
            const value = pickNumber(record, ...keys);
            if (value !== null) return value;
        }
        return null;
    };

    const eps = firstNonNullNumber(
        tsetmcInfo?.eps?.epsValue,
        tsetmcInfo?.eps?.estimatedEps,
        pickFromRecords([tsetmcInfoRecord, tsetmcEpsRecord], ['ePS', 'eps', 'EPS', 'estimatedEPS', 'estimatedEps', 'epsValue', 'zEPS', 'earningPerShare'])
    );

    const peFromApi = firstNonNullNumber(
        pickFromRecords([tsetmcInfoRecord], ['pToE', 'pe', 'pOverE', 'P/E', 'pE', 'priceToEarning', 'priceEarningRatio'])
    );
    const epsForPe = firstNonNullNumber(tsetmcInfo?.eps?.epsValue, tsetmcInfo?.eps?.estimatedEps);
    const peCalculated =
        epsForPe !== null && epsForPe !== 0 && closePrice !== null && closePrice !== 0
            ? closePrice / epsForPe
            : null;
    const pe = firstNonNullNumber(peFromApi, peCalculated);

    const groupPe = firstNonNullNumber(
        tsetmcInfo?.eps?.sectorPe,
        pickFromRecords([tsetmcInfoRecord, tsetmcEpsRecord], ['pToEGroup', 'groupPe', 'industryPE', 'groupPE', 'P/EGroup', 'sectorPE', 'industryPe', 'sectorPe'])
    );

    const source = isFund ? 'fund' : 'market';

    let exchangeBadge = toExchangeBadge(symbol.type);
    let marketLabel = toMarketLabel(symbol.type);

    if (symbol.type === 'UNKNOWN') {
        if (source === 'fund') {
            exchangeBadge = 'FUND';
            marketLabel = 'صندوق';
        } else if (tsetmcInfo?.marketFlowTitle) {
            marketLabel = tsetmcInfo.marketFlowTitle;
            exchangeBadge = marketLabel.includes('فرابورس') || marketLabel.includes('پایه') ? 'IFB' : 'TSE';
        } else {
            exchangeBadge = '';
            marketLabel = '';
        }
    }

    const orderBook = toOrderBookFromTsetmc(tsetmcBestLimits);
    const depth: SymbolDepthRow[] = buildDepthRowsFromClientType(tsetmcClientType);

    return {
        key: symbol.key,
        symbol,
        source,
        exchangeBadge,
        marketLabel,
        title: symbol.symbol,
        subtitle: symbol.name,
        lastPrice,
        lastPricePercent,
        closePrice,
        closePricePercent,
        bubblePercent,
        stateTitle,
        allowedMinPrice,
        allowedMaxPrice,
        tradeCount,
        tradeVolume,
        tradeValue,
        marketValue,
        navCancel,
        navAnnouncementAt,
        lastTradeAt,
        orderBook,
        depth,
        detailRows: toDetailRows({
            source,
            tradeVolume,
            tradeValue,
            marketValue,
            lastTradeAt,
            navCancel,
            navAnnouncementAt,
            eps,
            pe,
            groupPe,
        }),
    };
};
