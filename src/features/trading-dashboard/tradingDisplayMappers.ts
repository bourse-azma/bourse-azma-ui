import {formatDateTimeFa} from '../../utils/formatDateTime';
import {computeAccountSummary} from '../trading/accountSummary';
import type {OrderStatusType, PortfolioHolding, TradingOrder} from '../trading/api';
import type {DemoOrderRow, DemoPortfolioRow, OrderFilter} from './types';

export function computeAvailableToSell(
    activeInstrumentCode: string,
    portfolioHoldings: PortfolioHolding[],
    activeOrdersForSummary: TradingOrder[],
    tradingAccountError: string | null
): number | null {
    if (activeInstrumentCode === '' || tradingAccountError) return null;
    const held = portfolioHoldings
        .filter((holding) => holding.instrumentCode === activeInstrumentCode)
        .reduce((sum, holding) => sum + holding.quantity, 0);
    const reserved = activeOrdersForSummary
        .filter(
            (order) =>
                order.instrumentCode === activeInstrumentCode &&
                order.side === 'SELL' &&
                order.remainingQuantity > 0 &&
                (order.status === 'REQUESTED' || order.status === 'PARTIALLY_FILLED' || order.status === 'TRIGGER_PENDING')
        )
        .reduce((sum, order) => sum + order.remainingQuantity, 0);
    return Math.max(held - reserved, 0);
}

export function createLivePriceResolver(
    instrumentLivePrices: Record<string, number | null>,
    activeInstrumentCode: string,
    symbolPrice: number | null
) {
    return (instrumentCode: string | null | undefined) => {
        const normalized = (instrumentCode ?? '').trim();
        if (normalized === '') return null;
        const cachedPrice = instrumentLivePrices[normalized];
        if (cachedPrice !== null && cachedPrice !== undefined) return cachedPrice;
        if (normalized === activeInstrumentCode) return symbolPrice;
        return null;
    };
}

export function createLivePriceChangeResolver(
    instrumentLiveChangePercents: Record<string, number | null>,
    activeInstrumentCode: string,
    symbolPercent: number | null
) {
    return (instrumentCode: string | null | undefined) => {
        const normalized = (instrumentCode ?? '').trim();
        if (normalized === '') return null;
        const cachedChange = instrumentLiveChangePercents[normalized];
        if (cachedChange !== null && cachedChange !== undefined) return cachedChange;
        if (normalized === activeInstrumentCode) return symbolPercent;
        return null;
    };
}

export function mapDemoOrders(
    tradingOrders: TradingOrder[],
    resolveDisplayLivePrice: (instrumentCode: string | null | undefined) => number | null
): DemoOrderRow[] {
    return tradingOrders.map((order) => ({
        id: order.id,
        type: order.side === 'BUY' ? 'buy' : 'sell',
        symbol: order.symbol,
        quantity: order.quantity,
        remainingQuantity: order.remainingQuantity,
        executedQuantity: order.executedQuantity,
        orderPrice: Number(order.orderPrice),
        averageExecutedPrice: order.averageExecutedPrice,
        livePrice: resolveDisplayLivePrice(order.instrumentCode),
        time: formatDateTimeFa(order.orderTime),
        status: order.status,
        statusLabel: order.statusLabel,
        cancellable: order.cancellable,
    }));
}

export function filterDemoOrders(demoOrders: DemoOrderRow[], orderFilter: OrderFilter): DemoOrderRow[] {
    if (orderFilter === 'all') return demoOrders;
    if (orderFilter === 'open') {
        return demoOrders.filter((order) => order.cancellable && order.remainingQuantity > 0);
    }
    const statusMap: Record<Exclude<OrderFilter, 'all' | 'open'>, OrderStatusType[]> = {
        partial: ['PARTIALLY_FILLED'],
        done: ['COMPLETED'],
        cancelled: ['CANCELLED'],
        failed: ['FAILED'],
    };
    const statuses = statusMap[orderFilter];
    return demoOrders.filter((order) => statuses.includes(order.status));
}

export function mapDemoPortfolioRows(
    portfolioHoldings: PortfolioHolding[],
    resolveDisplayLivePrice: (instrumentCode: string | null | undefined) => number | null
): DemoPortfolioRow[] {
    return portfolioHoldings.map((holding) => {
        const apiLivePrice = Number(holding.livePrice);
        const resolvedLivePrice = resolveDisplayLivePrice(holding.instrumentCode);

        return {
            id: String(holding.id),
            time: formatDateTimeFa(holding.acquiredAt),
            symbol: holding.symbol,
            quantity: holding.quantity,
            buyPrice: Number(holding.buyPrice),
            livePrice:
                resolvedLivePrice ??
                (Number.isFinite(apiLivePrice) && apiLivePrice > 0 ? apiLivePrice : null),
        };
    });
}

export function computeDashboardAccountSummary(
    userBalance: number,
    portfolioHoldings: PortfolioHolding[],
    activeOrdersForSummary: TradingOrder[],
    resolveDisplayLivePrice: (instrumentCode: string | null | undefined) => number | null
) {
    const holdings = portfolioHoldings.map((holding) => {
        const apiLivePrice = Number(holding.livePrice);
        const resolvedLivePrice = resolveDisplayLivePrice(holding.instrumentCode);

        return {
            quantity: holding.quantity,
            buyPrice: Number(holding.buyPrice),
            livePrice:
                resolvedLivePrice ??
                (Number.isFinite(apiLivePrice) && apiLivePrice > 0 ? apiLivePrice : null),
        };
    });

    return computeAccountSummary(userBalance, holdings, activeOrdersForSummary);
}

type MarketOverviewSlice = {
    indexValue: number | null;
    indexChange: number | null;
    totalTrades: number | null;
    totalTradeValue: number | null;
    totalTradeVolume: number | null;
    marketStateTitle?: string | null;
};

export function buildMarketDetails(
    bourse: MarketOverviewSlice,
    farabourse: MarketOverviewSlice
) {
    const marketIndex = bourse.indexValue;
    const marketDelta = bourse.indexChange;
    const farabourseIndex = farabourse.indexValue;
    const farabourseDelta = farabourse.indexChange;

    const marketPercent =
        marketIndex !== null && marketDelta !== null && marketIndex !== 0
            ? (marketDelta / marketIndex) * 100
            : null;
    const faraboursePercent =
        farabourseIndex !== null && farabourseDelta !== null && farabourseIndex !== 0
            ? (farabourseDelta / farabourseIndex) * 100
            : null;
    const marketPositive = marketDelta !== null ? marketDelta >= 0 : false;
    const faraboursePositive = farabourseDelta !== null ? farabourseDelta >= 0 : false;

    return {
        marketIndex,
        marketDelta,
        marketPercent,
        marketPositive,
        farabourseIndex,
        farabourseDelta,
        faraboursePercent,
        faraboursePositive,
        marketDetails: [
            {
                id: 'bourse',
                label: 'بورس',
                indexValue: marketIndex,
                deltaValue: marketDelta,
                percentValue: marketPercent,
                totalTrades: bourse.totalTrades,
                tradeValue: bourse.totalTradeValue,
                tradeVolume: bourse.totalTradeVolume,
                positive: marketPositive,
            },
            {
                id: 'farabourse',
                label: 'فرابورس',
                indexValue: farabourseIndex,
                deltaValue: farabourseDelta,
                percentValue: faraboursePercent,
                totalTrades: farabourse.totalTrades,
                tradeValue: farabourse.totalTradeValue,
                tradeVolume: farabourse.totalTradeVolume,
                positive: faraboursePositive,
            },
        ],
    };
}
