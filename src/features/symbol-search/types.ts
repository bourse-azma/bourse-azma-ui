export type SymbolSourceType = 'TSE' | 'IFB' | 'FUND' | string;

export type ApiResponse<T> = {
    code: number;
    message: string;
    result: T;
};

export type SymbolSearchRow = Record<string, unknown>;

export type SymbolSearchSuggestion = {
    key: string;
    type: SymbolSourceType;
    symbol: string;
    name: string;
    instrumentCode: string | null;
    isin: string | null;
    oldInstrumentCodes: string[];
};

export type TsetmcClosingPriceInfo = {
    instrumentState: {
        stateCode: string | null;
        stateTitle: string | null;
        underSupervision: number | null;
    } | null;
    priceChange: number | null;
    dayMinPrice: number | null;
    dayMaxPrice: number | null;
    previousClosingPrice: number | null;
    firstTradePrice: number | null;
    instrumentCode: string | null;
    eventDate: number | null;
    eventTime: number | null;
    lastTradeAt: string | null;
    closingPrice: number | null;
    lastTradePrice: number | null;
    tradeCount: number | null;
    tradeVolume: number | null;
    tradeValue: number | null;
};

export type TsetmcSectorInfo = {
    sectorCode: string | null;
    sectorName: string | null;
};

export type TsetmcInstrumentInfo = {
    instrumentCode: string | null;
    symbol: string | null;
    fullName: string | null;
    sector: TsetmcSectorInfo | null;
    staticPriceThreshold: {
        minAllowedPrice: number | null;
        maxAllowedPrice: number | null;
    } | null;
    eps: {
        epsValue: number | null;
        estimatedEps: number | null;
        sectorPe: number | null;
        psr: number | null;
    } | null;
    baseVolume: number | null;
    totalShares: number | null;
    marketFlowTitle: string | null;
    boardTitle: string | null;
};

export type TsetmcBestLimitLevel = {
    levelNumber: number | null;
    bidVolume: number | null;
    bidOrderCount: number | null;
    bidPrice: number | null;
    askPrice: number | null;
    askOrderCount: number | null;
    askVolume: number | null;
};

export type TsetmcClientType = {
    institutionalBuyVolume: number | null;
    individualBuyVolume: number | null;
    uncategorizedBuyVolume: number | null;
    institutionalBuyCount: number | null;
    individualBuyCount: number | null;
    uncategorizedBuyCount: number | null;
    institutionalSellVolume: number | null;
    individualSellVolume: number | null;
    institutionalSellCount: number | null;
    individualSellCount: number | null;
};

export type TsetmcEtfInfo = {
    insCode: string | null;
    navAnnouncementAt: string | null;
    cancelNav: number | null;
    issueNav: number | null;
    iClose: number | null;
};

export type FipiranInstrumentSnapshot = {
    instrumentCode: string;
    lastTradeAt: string | null;
    instrument: Record<string, unknown>;
    transaction: Record<string, unknown>;
    bestLimits: Array<Record<string, unknown>>;
    clientTypes: Array<Record<string, unknown>>;
};

export type FipiranFundSummary = {
    registrationNumber: string;
    name: string;
    fundType: string;
    date: string;
    navAnnouncementAt: string | null;
    netAsset: number;
    issueNav: number;
    cancelNav: number;
    instrumentCode: string;
};

export type FipiranFundDetails = {
    registrationNumber: string;
    details: {
        registrationNumber: string;
        name: string;
        date: string;
        lastModificationTime: string;
        navAnnouncementAt: string | null;
        netAsset: number;
        issueNav: number;
        cancelNav: number;
        instrumentCode: string;
    };
};

export type SymbolOrderBookRow = {
    id: string;
    level: number | null;
    askCount: number | null;
    askVolume: number | null;
    askPrice: number | null;
    bidPrice: number | null;
    bidVolume: number | null;
    bidCount: number | null;
};

export type SymbolDepthRow = {
    id: 'real' | 'legal';
    label: 'حقیقی' | 'حقوقی';
    buyCount: number | null;
    sellCount: number | null;
    buyVolume: number | null;
    sellVolume: number | null;
    buyPercent: number | null;
    sellPercent: number | null;
};

export type SymbolDetailRow = {
    label: string;
    value: number | string | null;
    valueType: 'number' | 'percent' | 'currency' | 'plain' | 'datetime';
    digits?: number;
};

export type TsetmcRelatedCompanyItem = {
    instrumentCode: string | null;
    symbol: string | null;
    fullName: string | null;
    closingPrice: number | null;
    lastTradePrice: number | null;
    dayMinPrice: number | null;
    dayMaxPrice: number | null;
    priceChange: number | null;
    tradeCount: number | null;
    tradeVolume: number | null;
    tradeValue: number | null;
};

export type TsetmcRelatedCompanyHistoryItem = {
    instrumentCode: string | null;
    eventDate: number | null;
    closingPrice: number | null;
    lastTradePrice: number | null;
    tradeCount: number | null;
    tradeVolume: number | null;
    tradeValue: number | null;
};

export type TsetmcRelatedCompaniesResult = {
    relatedCompanies: TsetmcRelatedCompanyItem[];
    relatedCompanyThirtyDayHistory: TsetmcRelatedCompanyHistoryItem[];
};

export type TsetmcMostVisitedInstrument = {
    instrumentCode: string | null;
    symbol: string | null;
    fullName: string | null;
    tradeCount: number | null;
    tradeVolume: number | null;
    tradeValue: number | null;
};

export type TsetmcMostVisitedResult = {
    mostVisitedInstruments: TsetmcMostVisitedInstrument[];
};

export type PeerGroupRow = {
    instrumentCode: string;
    symbol: string;
    fullName: string | null;
    closingPrice: number | null;
    closingPercent: number | null;
    lastPrice: number | null;
    lastPercent: number | null;
    dayMinPrice: number | null;
    dayMaxPrice: number | null;
    tradeCount: number | null;
    tradeVolume: number | null;
    tradeValue: number | null;
};

export type SymbolDetailsViewModel = {
    key: string;
    symbol: SymbolSearchSuggestion;
    source: 'market' | 'fund';
    exchangeBadge: string;
    marketLabel: string;
    title: string;
    subtitle: string;
    lastPrice: number | null;
    lastPricePercent: number | null;
    closePrice: number | null;
    closePricePercent: number | null;
    bubblePercent: number | null;
    stateTitle: string | null;
    allowedMinPrice: number | null;
    allowedMaxPrice: number | null;
    tradeCount: number | null;
    tradeVolume: number | null;
    tradeValue: number | null;
    baseVolume: number | null;
    marketValue: number | null;
    navCancel: number | null;
    navAnnouncementAt: string | null;
    lastTradeAt: string | null;
    orderBook: SymbolOrderBookRow[];
    depth: SymbolDepthRow[];
    detailRows: SymbolDetailRow[];
};
