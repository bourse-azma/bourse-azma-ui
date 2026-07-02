export type MarketId = 1 | 2;

export type MarketOverview = {
    totalIndexValue: number;
    totalIndexChange: number;
    equalWeightedIndexValue: number;
    equalWeightedIndexChange: number;
    totalTradeCount: number;
    totalTradeValue: number;
    totalTradeVolume: number;
    marketStateTitle: string;
};

export type SelectedIndex = {
    indexCode: string;
    currentValue: number;
    dayHighValue: number;
    baseValue: number;
    changePercent: number;
    changeValue: number;
    indexName: string;
};

export type InstrumentEffect = {
    instrumentCode: string;
    symbol: string;
    fullName: string;
    closingPrice: number;
    indexEffectValue: number;
};

export type MarketSymbolQuote = {
    instrumentCode: string;
    symbol: string;
    fullName: string;
    price: number;
    priceChange: number;
    changePercent: number;
    marketId: MarketId;
};

export type SparklinePoint = {
    time: number;
    value: number;
};

export type CodalLatestNotice = {
    noticeId: number | null;
    symbol: string | null;
    companyName: string | null;
    title: string | null;
    publishedAtGregorian: string | null;
    trackingNumber: string | null;
};
