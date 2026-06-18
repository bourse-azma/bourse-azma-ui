export type IndustrySummary = {
    name: string;
    symbolCount: number;
};

export type IndustrySymbol = {
    symbol: string;
    name: string;
    instrumentCode: string;
};

export type IndustrySymbolsResult = {
    industry: string;
    symbols: IndustrySymbol[];
};
