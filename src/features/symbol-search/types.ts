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
    priceChange: number | null;
    dayMinPrice: number | null;
    dayMaxPrice: number | null;
    previousClosingPrice: number | null;
    firstTradePrice: number | null;
    instrumentCode: string | null;
    eventDate: number | null;
    eventTime: number | null;
    closingPrice: number | null;
    lastTradePrice: number | null;
    tradeCount: number | null;
    tradeVolume: number | null;
    tradeValue: number | null;
};

export type TsetmcInstrumentInfo = {
    instrumentCode: string | null;
    symbol: string | null;
    fullName: string | null;
    staticPriceThreshold: {
        minAllowedPrice: number | null;
        maxAllowedPrice: number | null;
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
    institutionalBuyCount: number | null;
    individualBuyCount: number | null;
    institutionalSellVolume: number | null;
    individualSellVolume: number | null;
    institutionalSellCount: number | null;
    individualSellCount: number | null;
};

export type FipiranInstrumentSnapshot = {
    instrumentCode: string;
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
    valueType: 'number' | 'percent' | 'currency' | 'plain';
    digits?: number;
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
