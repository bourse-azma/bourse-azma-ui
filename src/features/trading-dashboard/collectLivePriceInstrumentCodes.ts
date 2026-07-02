import type {PortfolioHolding, TradingOrder} from '../trading/api';
import type {Watchlist} from '../watchlist/api';
import type {BottomPanelTab, SidebarTab} from './types';

export const collectLivePriceInstrumentCodes = ({
                                                    portfolioHoldings,
                                                    tradingOrders,
                                                    selectedWatchlist,
                                                    bottomPanelTab,
                                                    sidebarTab,
                                                    skipInstrumentCode,
                                                }: {
    portfolioHoldings: PortfolioHolding[];
    tradingOrders: TradingOrder[];
    selectedWatchlist: Watchlist | null;
    bottomPanelTab: BottomPanelTab;
    sidebarTab: SidebarTab;
    skipInstrumentCode?: string | null;
}) => {
    const seen = new Set<string>();
    const codes: string[] = [];
    const skip = (skipInstrumentCode ?? '').trim();

    const addCode = (code: string | null | undefined) => {
        const normalized = (code ?? '').trim();
        if (normalized === '' || normalized === skip || seen.has(normalized)) {
            return;
        }
        seen.add(normalized);
        codes.push(normalized);
    };

    portfolioHoldings.forEach((holding) => addCode(holding.instrumentCode));

    if (bottomPanelTab === 'orders') {
        tradingOrders.forEach((order) => addCode(order.instrumentCode));
    }

    if (sidebarTab === 'watchlist') {
        selectedWatchlist?.symbols.forEach((item) => addCode(item.instrumentCode));
    }

    return codes;
};
