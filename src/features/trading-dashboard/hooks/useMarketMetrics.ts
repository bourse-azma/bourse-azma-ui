import {useCallback, useMemo} from 'react';
import {useMarketOverview} from '../../market-overview/useMarketOverview';
import {normalizeOrderBookRows} from '../../symbol-search/orderBookUtils';
import {toMarketLabel} from '../../symbol-search/mappers';
import type {SymbolSearchSuggestion} from '../../symbol-search/types';
import {useSymbolDetails} from '../../symbol-search/useSymbolDetails';
import {usePeerGroup} from '../../symbol-search/usePeerGroup';
import type {PortfolioHolding, TradingOrder} from '../../trading/api';
import {useInstrumentLivePrices} from '../../trading/useInstrumentLivePrices';
import {usePrivateOrderBook} from '../../trading/usePrivateOrderBook';
import type {OrderSymbolContext} from '../../trading/order-placement/types';
import type {Watchlist} from '../../watchlist/api';
import {collectLivePriceInstrumentCodes} from '../collectLivePriceInstrumentCodes';
import {clamp} from '../formatters';
import {
    buildMarketDetails,
    computeAvailableToSell,
    computeDashboardAccountSummary,
    createLivePriceChangeResolver,
    createLivePriceResolver,
    filterDemoOrders,
    mapDemoOrders,
    mapDemoPortfolioRows,
} from '../tradingDisplayMappers';
import type {BottomPanelTab, OrderbookTab, OrderFilter, SidebarTab, SymbolTab, UserProfile,} from '../types';

type UseMarketMetricsParams = {
    accessToken: string;
    selectedSymbol: SymbolSearchSuggestion;
    isMarketViewActive: boolean;
    orderbookTab: OrderbookTab;
    symbolTab: SymbolTab;
    bottomPanelTab: BottomPanelTab;
    sidebarTab: SidebarTab;
    orderFilter: OrderFilter;
    tradingOrders: TradingOrder[];
    activeOrdersForSummary: TradingOrder[];
    portfolioHoldings: PortfolioHolding[];
    tradingAccountError: string | null;
    selectedWatchlist: Watchlist | null;
    userProfile?: UserProfile;
    minimumOrderValue: number;
};

export function useMarketMetrics({
                                     accessToken,
                                     selectedSymbol,
                                     isMarketViewActive,
                                     orderbookTab,
                                     symbolTab,
                                     bottomPanelTab,
                                     sidebarTab,
                                     orderFilter,
                                     tradingOrders,
                                     activeOrdersForSummary,
                                     portfolioHoldings,
                                     tradingAccountError,
                                     selectedWatchlist,
                                     userProfile,
                                     minimumOrderValue,
                                 }: UseMarketMetricsParams) {
    const {
        data: activeSymbolData,
        loading: symbolLoading,
        error: symbolError,
        refresh: refreshSymbolDetails,
    } = useSymbolDetails(selectedSymbol, {
        enabled: isMarketViewActive,
        includeDetailSources: isMarketViewActive && symbolTab === 'details',
        includeClientType: isMarketViewActive && orderbookTab === 'info',
    });

    const {
        rows: peerGroupRows,
        sectorName: peerGroupSectorName,
        loading: peerGroupLoading,
        error: peerGroupError,
        refresh: refreshPeerGroup,
    } = usePeerGroup(selectedSymbol.instrumentCode, isMarketViewActive && orderbookTab === 'peers');

    const bourseOverview = useMarketOverview('1', isMarketViewActive);
    const farabourseOverview = useMarketOverview('2', isMarketViewActive);

    const {
        marketIndex,
        marketDelta,
        marketPercent,
        marketPositive,
        marketDetails,
    } = useMemo(
        () =>
            buildMarketDetails(
                {
                    indexValue: bourseOverview.data?.indexValue ?? null,
                    indexChange: bourseOverview.data?.indexChange ?? null,
                    totalTrades: bourseOverview.data?.totalTrades ?? null,
                    totalTradeValue: bourseOverview.data?.totalTradeValue ?? null,
                    totalTradeVolume: bourseOverview.data?.totalTradeVolume ?? null,
                    marketStateTitle: bourseOverview.data?.marketStateTitle,
                },
                {
                    indexValue: farabourseOverview.data?.indexValue ?? null,
                    indexChange: farabourseOverview.data?.indexChange ?? null,
                    totalTrades: farabourseOverview.data?.totalTrades ?? null,
                    totalTradeValue: farabourseOverview.data?.totalTradeValue ?? null,
                    totalTradeVolume: farabourseOverview.data?.totalTradeVolume ?? null,
                    marketStateTitle: farabourseOverview.data?.marketStateTitle,
                }
            ),
        [bourseOverview.data, farabourseOverview.data]
    );

    const marketStateLoading = bourseOverview.loading || farabourseOverview.loading;
    const marketStateKnown =
        bourseOverview.data?.marketStateTitle != null || farabourseOverview.data?.marketStateTitle != null;
    const isMarketOpen = marketStateKnown
        ? bourseOverview.data?.marketStateTitle === 'باز' || farabourseOverview.data?.marketStateTitle === 'باز'
        : null;

    const symbolPrice = activeSymbolData?.lastPrice ?? null;
    const symbolPercent = activeSymbolData?.lastPricePercent ?? null;
    const symbolPositive = symbolPercent !== null ? symbolPercent >= 0 : false;

    const tradingInstrumentCodes = useMemo(
        () =>
            isMarketViewActive
                ? collectLivePriceInstrumentCodes({
                    portfolioHoldings,
                    tradingOrders,
                    selectedWatchlist,
                    bottomPanelTab,
                    sidebarTab,
                    skipInstrumentCode: selectedSymbol.instrumentCode,
                })
                : [],
        [
            bottomPanelTab,
            isMarketViewActive,
            portfolioHoldings,
            selectedSymbol.instrumentCode,
            selectedWatchlist,
            sidebarTab,
            tradingOrders,
        ]
    );

    const {prices: instrumentLivePrices, changePercents: instrumentLiveChangePercents} =
        useInstrumentLivePrices(tradingInstrumentCodes, isMarketViewActive);

    const activeInstrumentCode = selectedSymbol.instrumentCode?.trim() ?? '';
    const resolveDisplayLivePrice = useCallback(
        createLivePriceResolver(instrumentLivePrices, activeInstrumentCode, symbolPrice),
        [activeInstrumentCode, instrumentLivePrices, symbolPrice]
    );
    const resolveDisplayLivePriceChange = useCallback(
        createLivePriceChangeResolver(instrumentLiveChangePercents, activeInstrumentCode, symbolPercent),
        [activeInstrumentCode, instrumentLiveChangePercents, symbolPercent]
    );

    const dailyMin = activeSymbolData?.allowedMinPrice ?? null;
    const dailyMax = activeSymbolData?.allowedMaxPrice ?? null;
    const markerPercent = useMemo(() => {
        if (
            symbolPrice === null || dailyMin === null || dailyMax === null ||
            Number.isNaN(symbolPrice) || Number.isNaN(dailyMin) || Number.isNaN(dailyMax) ||
            dailyMax <= dailyMin
        ) {
            return 50;
        }
        return clamp(((symbolPrice - dailyMin) / (dailyMax - dailyMin)) * 100, 3, 96);
    }, [dailyMax, dailyMin, symbolPrice]);

    const privateBookRefreshKey = useMemo(
        () => tradingOrders
            .filter((order) => order.instrumentCode === activeInstrumentCode && order.remainingQuantity > 0)
            .map((order) => `${order.id}:${order.status}:${order.remainingQuantity}`)
            .join('|'),
        [activeInstrumentCode, tradingOrders]
    );
    const privateOrderBook = usePrivateOrderBook(
        accessToken,
        activeInstrumentCode,
        isMarketViewActive && orderbookTab === 'info',
        privateBookRefreshKey
    );
    const orderBookRows = useMemo(() => {
        if (privateOrderBook.data?.instrumentCode === activeInstrumentCode) {
            return normalizeOrderBookRows(privateOrderBook.data.rows.map((row) => ({
                id: `private-${row.level}`,
                level: row.level,
                askCount: row.askOrderCount,
                askVolume: row.askVolume,
                askPrice: row.askPrice,
                bidPrice: row.bidPrice,
                bidVolume: row.bidVolume,
                bidCount: row.bidOrderCount,
                ownAskVolume: row.ownAskVolume,
                ownBidVolume: row.ownBidVolume,
            })));
        }
        return normalizeOrderBookRows(activeSymbolData?.orderBook ?? []);
    }, [activeInstrumentCode, activeSymbolData?.orderBook, privateOrderBook.data]);
    const depthRows = useMemo(() => activeSymbolData?.depth ?? [], [activeSymbolData?.depth]);
    const symbolDetails = useMemo(() => activeSymbolData?.detailRows ?? [], [activeSymbolData?.detailRows]);
    const marketLabel = activeSymbolData?.marketLabel ?? toMarketLabel(selectedSymbol.type);
    const activeSymbolSummary = [selectedSymbol.symbol, selectedSymbol.name, marketLabel].filter(Boolean).join(' - ');

    const demoOrders = useMemo(
        () => mapDemoOrders(tradingOrders, resolveDisplayLivePrice),
        [resolveDisplayLivePrice, tradingOrders]
    );
    const filteredOrders = useMemo(
        () => filterDemoOrders(demoOrders, orderFilter),
        [demoOrders, orderFilter]
    );
    const demoPortfolioRows = useMemo(
        () => mapDemoPortfolioRows(portfolioHoldings, resolveDisplayLivePrice),
        [portfolioHoldings, resolveDisplayLivePrice]
    );
    const accountSummary = useMemo(
        () =>
            computeDashboardAccountSummary(
                userProfile?.balance ?? 0,
                portfolioHoldings,
                activeOrdersForSummary,
                resolveDisplayLivePrice
            ),
        [activeOrdersForSummary, portfolioHoldings, resolveDisplayLivePrice, userProfile?.balance]
    );

    const orderLivePrice = symbolPrice ?? activeSymbolData?.closePrice ?? null;
    const availableToSell = useMemo(
        () => computeAvailableToSell(activeInstrumentCode, portfolioHoldings, activeOrdersForSummary, tradingAccountError),
        [activeInstrumentCode, activeOrdersForSummary, portfolioHoldings, tradingAccountError]
    );

    const orderSymbolContext = useMemo<OrderSymbolContext>(
        () => ({
            symbol: selectedSymbol.symbol,
            instrumentCode: selectedSymbol.instrumentCode,
            name: activeSymbolData?.subtitle || selectedSymbol.name,
            lastPrice: symbolPrice,
            closePrice: activeSymbolData?.closePrice ?? null,
            changePercent: activeSymbolData?.lastPricePercent ?? null,
            tradeVolume: activeSymbolData?.tradeVolume ?? null,
            tradeCount: activeSymbolData?.tradeCount ?? null,
        }),
        [selectedSymbol.instrumentCode, selectedSymbol.name, selectedSymbol.symbol, activeSymbolData, symbolPrice]
    );

    const orderValidationContext = useMemo(
        () => ({
            livePrice: orderLivePrice,
            availableToSell,
            buyingPower: accountSummary.buyingPower,
            marketOpen: isMarketOpen,
            minimumOrderValue,
        }),
        [accountSummary.buyingPower, availableToSell, isMarketOpen, minimumOrderValue, orderLivePrice]
    );

    const tsetmcInstrumentCode = selectedSymbol.instrumentCode?.trim() ?? '';

    return {
        activeSymbolData,
        symbolLoading,
        symbolError,
        refreshSymbolDetails,
        peerGroupRows,
        peerGroupSectorName,
        peerGroupLoading,
        peerGroupError,
        refreshPeerGroup,
        marketIndex,
        marketDelta,
        marketPercent,
        marketPositive,
        marketStateLoading,
        marketStateKnown,
        isMarketOpen,
        marketDetails,
        resolveDisplayLivePrice,
        resolveDisplayLivePriceChange,
        symbolPrice,
        symbolPercent,
        symbolPositive,
        dailyMin,
        dailyMax,
        markerPercent,
        orderBookRows,
        privateOrderBookLoading: privateOrderBook.loading,
        privateOrderBookError: privateOrderBook.error,
        depthRows,
        symbolDetails,
        marketLabel,
        activeSymbolSummary,
        tsetmcSymbolUrl: tsetmcInstrumentCode
            ? `https://www.tsetmc.com/instInfo/${encodeURIComponent(tsetmcInstrumentCode)}`
            : null,
        demoOrders,
        filteredOrders,
        demoPortfolioRows,
        accountSummary,
        orderSymbolContext,
        orderValidationContext,
    };
}
