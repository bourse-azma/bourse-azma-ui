import type {
    SymbolDetailsViewModel,
    TsetmcBestLimitLevel,
    TsetmcClientType,
    TsetmcClosingPriceInfo,
    TsetmcEtfInfo,
    TsetmcInstrumentInfo,
} from './types';

export type RawDetailsSources = {
    tsetmcClosing: TsetmcClosingPriceInfo | null;
    tsetmcInfo: TsetmcInstrumentInfo | null;
    tsetmcBestLimits: TsetmcBestLimitLevel[] | null;
    tsetmcClientType: TsetmcClientType | null;
    tsetmcEtf: TsetmcEtfInfo | null;
};

export type DetailCacheEntry = {
    raw: RawDetailsSources;
    data: SymbolDetailsViewModel;
};

export type SymbolDetailsState = {
    data: SymbolDetailsViewModel | null;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
};

export type UseSymbolDetailsOptions = {
    enabled?: boolean;
    includeClientType?: boolean;
    includeDetailSources?: boolean;
};

export const emptyRaw = (): RawDetailsSources => ({
    tsetmcClosing: null,
    tsetmcInfo: null,
    tsetmcBestLimits: null,
    tsetmcClientType: null,
    tsetmcEtf: null,
});

export const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

export const isMarketSymbol = (type: string) => type === 'TSE' || type === 'IFB' || type === 'FUND' || type === 'UNKNOWN';

export const isLikelyFundSymbol = (name: string, type: string) => {
    if (type === 'FUND') return true;
    const normalizedName = name
        .replace('ي', 'ی')
        .replace('ك', 'ک')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    return normalizedName.includes('صندوق') || normalizedName.includes('etf');
};
