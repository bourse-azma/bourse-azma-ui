import type {TsetmcBestLimitLevel, TsetmcClientType, TsetmcClosingPriceInfo,} from '../features/symbol-search/types';
import type {MarketOverviewApiResult} from '../features/trading-dashboard/types';

export type MarketDataUpdate = {
    instrumentCode: string;
    closingPrice: TsetmcClosingPriceInfo | null;
    bestLimits: TsetmcBestLimitLevel[] | null;
    clientType: TsetmcClientType | null;
    publishedAt: string;
};

export type MarketOverviewUpdate = {
    marketId: number;
    marketOverview: NonNullable<MarketOverviewApiResult['marketOverview']>;
    publishedAt: string;
};

const INSTRUMENT_CODE_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

export const marketTopic = (instrumentCode: string) => {
    const normalized = instrumentCode.trim();
    if (!INSTRUMENT_CODE_PATTERN.test(normalized)) {
        throw new Error('Invalid instrument code for market subscription.');
    }
    return `/topic/market/${normalized}`;
};

export const marketOverviewTopic = (marketId: '1' | '2') => `/topic/market-overview/${marketId}`;

export const ORDER_UPDATES_QUEUE = '/user/queue/orders';
