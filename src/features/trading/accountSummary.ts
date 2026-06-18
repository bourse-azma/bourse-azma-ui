import type {PortfolioHolding, TradingOrder} from './api';

export type AccountSummary = {
    netAssets: number;
    portfolioValue: number;
    portfolioCost: number;
    portfolioGrowth: number;
    portfolioGrowthPercent: number;
    customerBalance: number;
    buyingPower: number;
    blockedAmount: number;
};

type HoldingInput = Pick<PortfolioHolding, 'quantity' | 'buyPrice'> & {
    livePrice: number | null;
};

type OrderInput = Pick<TradingOrder, 'side' | 'quantity' | 'orderPrice' | 'status'>;

const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const computeAccountSummary = (
    walletBalance: unknown,
    holdings: HoldingInput[],
    orders: OrderInput[]
): AccountSummary => {
    const customerBalance = toNumber(walletBalance);

    const portfolioValue = holdings.reduce((sum, holding) => {
        const quantity = toNumber(holding.quantity);
        const buyPrice = toNumber(holding.buyPrice);
        const price = holding.livePrice != null ? toNumber(holding.livePrice) : buyPrice;
        return sum + quantity * price;
    }, 0);

    const portfolioCost = holdings.reduce(
        (sum, holding) => sum + toNumber(holding.quantity) * toNumber(holding.buyPrice),
        0
    );
    const portfolioGrowth = portfolioValue - portfolioCost;
    const portfolioGrowthPercent = portfolioCost > 0 ? (portfolioGrowth / portfolioCost) * 100 : 0;

    const blockedAmount = orders
        .filter((order) => order.side === 'BUY' && order.status === 'REQUESTED')
        .reduce((sum, order) => sum + toNumber(order.orderPrice) * toNumber(order.quantity), 0);

    const buyingPower = Math.max(customerBalance - blockedAmount, 0);
    const netAssets = portfolioValue + customerBalance;

    return {
        netAssets,
        portfolioValue,
        portfolioCost,
        portfolioGrowth,
        portfolioGrowthPercent,
        customerBalance,
        buyingPower,
        blockedAmount,
    };
};
