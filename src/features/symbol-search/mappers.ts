import type {
    FipiranFundDetails,
    FipiranFundSummary,
    FipiranInstrumentSnapshot,
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
} from './types';

type DetailsSources = {
    symbol: SymbolSearchSuggestion;
    tsetmcClosing: TsetmcClosingPriceInfo | null;
    tsetmcInfo: TsetmcInstrumentInfo | null;
    tsetmcBestLimits: TsetmcBestLimitLevel[] | null;
    tsetmcClientType: TsetmcClientType | null;
    tsetmcEtf: TsetmcEtfInfo | null;
    snapshot: FipiranInstrumentSnapshot | null;
    fundSummary: FipiranFundSummary | null;
    fundDetails: FipiranFundDetails | null;
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
        .map((level, index) => ({
            id: `tsetmc-${index + 1}`,
            level: level.levelNumber,
            askCount: level.askOrderCount,
            askVolume: level.askVolume,
            askPrice: level.askPrice,
            bidPrice: level.bidPrice,
            bidVolume: level.bidVolume,
            bidCount: level.bidOrderCount,
        }));
};

const toOrderBookFromSnapshot = (snapshot: FipiranInstrumentSnapshot | null): SymbolOrderBookRow[] => {
    if (!snapshot || snapshot.bestLimits.length === 0) return [];
    return snapshot.bestLimits
        .map((item, index) => {
            const row = toRecord(item);
            return {
                id: `snapshot-${index + 1}`,
                level: pickNumber(row, 'rowNumber', 'levelNumber', 'number'),
                askCount: pickNumber(row, 'numberSupply', 'askOrderCount', 'zOrdMeOf'),
                askVolume: pickNumber(row, 'supplyVolume', 'askVolume', 'qTitMeOf'),
                askPrice: pickNumber(row, 'supplyPrice', 'askPrice', 'pMeOf'),
                bidPrice: pickNumber(row, 'demandPrice', 'bidPrice', 'pMeDem'),
                bidVolume: pickNumber(row, 'demandVolume', 'bidVolume', 'qTitMeDem'),
                bidCount: pickNumber(row, 'numberRequests', 'bidOrderCount', 'zOrdMeDem'),
            } satisfies SymbolOrderBookRow;
        })
        .sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
};

const calculatePercent = (part: number | null, total: number | null) => {
    if (part === null || total === null || total <= 0) return null;
    return (part / total) * 100;
};

const sumKnownValues = (...values: Array<number | null>) =>
    values.every((value): value is number => value !== null) ? values.reduce((sum, value) => sum + value, 0) : null;

const toDepthFromTsetmc = (clientType: TsetmcClientType | null): SymbolDepthRow[] => {
    if (!clientType) return [];
    const totalBuy = sumKnownValues(clientType.individualBuyVolume, clientType.institutionalBuyVolume);
    const totalSell = sumKnownValues(clientType.individualSellVolume, clientType.institutionalSellVolume);

    return [
        {
            id: 'real',
            label: 'حقیقی',
            buyCount: clientType.individualBuyCount,
            sellCount: clientType.individualSellCount,
            buyVolume: clientType.individualBuyVolume,
            sellVolume: clientType.individualSellVolume,
            buyPercent: calculatePercent(clientType.individualBuyVolume, totalBuy),
            sellPercent: calculatePercent(clientType.individualSellVolume, totalSell),
        },
        {
            id: 'legal',
            label: 'حقوقی',
            buyCount: clientType.institutionalBuyCount,
            sellCount: clientType.institutionalSellCount,
            buyVolume: clientType.institutionalBuyVolume,
            sellVolume: clientType.institutionalSellVolume,
            buyPercent: calculatePercent(clientType.institutionalBuyVolume, totalBuy),
            sellPercent: calculatePercent(clientType.institutionalSellVolume, totalSell),
        },
    ];
};

const toDepthFromSnapshot = (snapshot: FipiranInstrumentSnapshot | null): SymbolDepthRow[] => {
    if (!snapshot || snapshot.clientTypes.length === 0) return [];
    const row = toRecord(snapshot.clientTypes[0]);

    const individualBuyVolume = pickNumber(row, 'sumIndividualBuyVolume', 'individualBuyVolume', 'buy_N_Volume');
    const institutionalBuyVolume = pickNumber(
        row,
        'sumNonIndividualBuyVolume',
        'institutionalBuyVolume',
        'buy_I_Volume'
    );
    const individualSellVolume = pickNumber(row, 'sumIndividualSellVolume', 'individualSellVolume', 'sell_N_Volume');
    const institutionalSellVolume = pickNumber(
        row,
        'sumNonIndividualSellVolume',
        'institutionalSellVolume',
        'sell_I_Volume'
    );

    const totalBuy = sumKnownValues(individualBuyVolume, institutionalBuyVolume);
    const totalSell = sumKnownValues(individualSellVolume, institutionalSellVolume);

    return [
        {
            id: 'real',
            label: 'حقیقی',
            buyCount: pickNumber(row, 'numberIndividualsBuyers', 'buy_CountN'),
            sellCount: pickNumber(row, 'numberIndividualsSellers', 'sell_CountN'),
            buyVolume: individualBuyVolume,
            sellVolume: individualSellVolume,
            buyPercent: calculatePercent(individualBuyVolume, totalBuy),
            sellPercent: calculatePercent(individualSellVolume, totalSell),
        },
        {
            id: 'legal',
            label: 'حقوقی',
            buyCount: pickNumber(row, 'numberNonIndividualBuyers', 'buy_CountI'),
            sellCount: pickNumber(row, 'numberNonIndividualSellers', 'sell_CountI'),
            buyVolume: institutionalBuyVolume,
            sellVolume: institutionalSellVolume,
            buyPercent: calculatePercent(institutionalBuyVolume, totalBuy),
            sellPercent: calculatePercent(institutionalSellVolume, totalSell),
        },
    ];
};

const pickSnapshotNumber = (snapshot: FipiranInstrumentSnapshot | null, target: 'instrument' | 'transaction', ...keys: string[]) => {
    if (!snapshot) return null;
    const record = target === 'instrument' ? toRecord(snapshot.instrument) : toRecord(snapshot.transaction);
    return pickNumber(record, ...keys);
};

const pickSnapshotString = (snapshot: FipiranInstrumentSnapshot | null, target: 'instrument' | 'transaction', ...keys: string[]) => {
    if (!snapshot) return null;
    const record = target === 'instrument' ? toRecord(snapshot.instrument) : toRecord(snapshot.transaction);
    return pickString(record, ...keys);
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
    baseVolume: number | null;
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
        {label: 'حجم مبنا', value: input.baseVolume, valueType: 'number'},
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
        ...commonRows.slice(0, 3),
        {label: 'ارزش بازار', value: input.marketValue, valueType: 'currency'},
        commonRows[3],
        {label: 'EPS', value: input.eps, valueType: 'number'},
        {label: 'P/E', value: input.pe, valueType: 'number', digits: 2},
        {label: 'گروه P/E', value: input.groupPe, valueType: 'number', digits: 2},
    ];
};

export const toSymbolDetailsViewModel = (sources: DetailsSources): SymbolDetailsViewModel => {
    const {
        symbol,
        tsetmcClosing,
        tsetmcInfo,
        tsetmcBestLimits,
        tsetmcClientType,
        tsetmcEtf,
        snapshot,
        fundSummary,
        fundDetails
    } =
        sources;

    const previousClose = firstNonNullNumber(
        tsetmcClosing?.previousClosingPrice,
        pickSnapshotNumber(snapshot, 'transaction', 'priceYesterday', 'yesterdayPrice')
    );

    const closePrice = firstNonNullNumber(
        tsetmcClosing?.closingPrice,
        pickSnapshotNumber(snapshot, 'transaction', 'closingPrice')
    );

    const lastPrice = firstNonNullNumber(
        tsetmcClosing?.lastTradePrice,
        pickSnapshotNumber(snapshot, 'transaction', 'lastTransaction', 'lastPrice')
    );

    const closePricePercent =
        previousClose !== null && previousClose !== 0 && closePrice !== null ? ((closePrice - previousClose) / previousClose) * 100 : null;
    const lastPricePercent =
        previousClose !== null && previousClose !== 0 && lastPrice !== null ? ((lastPrice - previousClose) / previousClose) * 100 : null;

    const navCancel = firstNonNullNumber(tsetmcEtf?.cancelNav, fundDetails?.details.cancelNav, fundSummary?.cancelNav);

    const isFund =
        symbol.type === 'FUND' ||
        symbol.name.includes('صندوق') ||
        fundSummary !== null ||
        fundDetails !== null ||
        tsetmcEtf !== null;

    const bubblePercent = isFund
        ? navCancel !== null && navCancel !== 0 && lastPrice !== null
            ? ((lastPrice - navCancel) / navCancel) * 100
            : null
        : closePrice !== null && closePrice !== 0 && lastPrice !== null
            ? ((lastPrice - closePrice) / closePrice) * 100
            : null;

    const allowedMinPrice = firstNonNullNumber(
        tsetmcInfo?.staticPriceThreshold?.minAllowedPrice ?? null,
        pickSnapshotNumber(snapshot, 'instrument', 'staticThresholdMinPrice')
    );
    const allowedMaxPrice = firstNonNullNumber(
        tsetmcInfo?.staticPriceThreshold?.maxAllowedPrice ?? null,
        pickSnapshotNumber(snapshot, 'instrument', 'staticThresholdMaxPrice')
    );

    const tradeCount = firstNonNullNumber(
        tsetmcClosing?.tradeCount,
        pickSnapshotNumber(snapshot, 'transaction', 'numberOfTransactions')
    );
    const tradeVolume = firstNonNullNumber(
        tsetmcClosing?.tradeVolume,
        pickSnapshotNumber(snapshot, 'transaction', 'numberOfVolume')
    );
    const tradeValue = firstNonNullNumber(
        tsetmcClosing?.tradeValue,
        pickSnapshotNumber(snapshot, 'transaction', 'transactionValue')
    );
    const baseVolume = firstNonNullNumber(
        tsetmcInfo?.baseVolume,
        pickSnapshotNumber(snapshot, 'instrument', 'baseVol', 'baseVolume')
    );

    const totalShares = firstNonNullNumber(
        tsetmcInfo?.totalShares,
        pickSnapshotNumber(snapshot, 'instrument', 'totalShares', 'shareCount', 'zTitad')
    );
    const marketValue = firstNonNullNumber(
        pickSnapshotNumber(snapshot, 'instrument', 'marketValue'),
        closePrice !== null && totalShares !== null ? closePrice * totalShares : null
    );

    const lastTradeAt = firstNonMissingString(tsetmcClosing?.lastTradeAt ?? null, snapshot?.lastTradeAt ?? null);

    const stateTitle = firstNonMissingString(
        tsetmcClosing?.instrumentState?.stateTitle,
        pickSnapshotString(snapshot, 'instrument', 'stateTitle', 'cEtavalTitle', 'instrumentStateTitle')
    );

    const navAnnouncementAt = firstNonMissingString(
        tsetmcEtf?.navAnnouncementAt ?? null,
        fundDetails?.details.navAnnouncementAt ?? null,
        fundSummary?.navAnnouncementAt ?? null
    );

    const instrumentRecord = snapshot ? toRecord(snapshot.instrument) : {};
    const transactionRecord = snapshot ? toRecord(snapshot.transaction) : {};
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
        pickFromRecords(
            [instrumentRecord, transactionRecord, tsetmcInfoRecord, tsetmcEpsRecord],
            ['ePS', 'eps', 'EPS', 'estimatedEPS', 'estimatedEps', 'epsValue', 'zEPS', 'earningPerShare']
        )
    );

    const peFromApi = firstNonNullNumber(
        pickFromRecords(
            [instrumentRecord, transactionRecord, tsetmcInfoRecord],
            ['pToE', 'pe', 'pOverE', 'P/E', 'pE', 'priceToEarning', 'priceEarningRatio']
        )
    );
    const epsForPe = firstNonNullNumber(tsetmcInfo?.eps?.epsValue, tsetmcInfo?.eps?.estimatedEps);
    const peCalculated =
        epsForPe !== null && epsForPe !== 0 && closePrice !== null && closePrice !== 0
            ? closePrice / epsForPe
            : null;
    const pe = firstNonNullNumber(peFromApi, peCalculated);

    const groupPe = firstNonNullNumber(
        tsetmcInfo?.eps?.sectorPe,
        pickFromRecords(
            [instrumentRecord, transactionRecord, tsetmcInfoRecord, tsetmcEpsRecord],
            ['pToEGroup', 'groupPe', 'industryPE', 'groupPE', 'P/EGroup', 'sectorPE', 'industryPe', 'sectorPe']
        )
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
        } else if (snapshot) {
            const flow = pickSnapshotString(snapshot, 'instrument', 'flowTitle', 'marketName', 'flow');
            if (flow) {
                marketLabel = flow;
                exchangeBadge = marketLabel.includes('فرابورس') || marketLabel.includes('پایه') ? 'IFB' : 'TSE';
            } else {
                exchangeBadge = '';
                marketLabel = '';
            }
        } else {
            exchangeBadge = '';
            marketLabel = '';
        }
    }
    const orderBook = toOrderBookFromTsetmc(tsetmcBestLimits);
    const orderBookFallback = toOrderBookFromSnapshot(snapshot);
    const depth = toDepthFromTsetmc(tsetmcClientType);
    const depthFallback = toDepthFromSnapshot(snapshot);

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
        baseVolume,
        marketValue,
        navCancel,
        navAnnouncementAt,
        lastTradeAt,
        orderBook: orderBook.length > 0 ? orderBook : orderBookFallback,
        depth: depth.length > 0 ? depth : depthFallback,
        detailRows: toDetailRows({
            source,
            tradeVolume,
            baseVolume,
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
