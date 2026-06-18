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

type OrderInput = Pick<TradingOrder, 'side' | 'quantity' | 'remainingQuantity' | 'orderPrice' | 'status' | 'orderValue'>;

const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const isActiveBuyOrder = (order: OrderInput) => {
    const side = String(order.side).toUpperCase();
    const status = String(order.status).toUpperCase();
    return side === 'BUY' && (status === 'REQUESTED' || status === 'PARTIALLY_FILLED' || status === 'TRIGGER_PENDING');
};

const orderCommittedAmount = (order: OrderInput) => {
    const remaining = toNumber(order.remainingQuantity);
    if (remaining > 0) {
        return toNumber(order.orderPrice) * remaining;
    }
    const orderValue = toNumber(order.orderValue);
    if (orderValue > 0) {
        return orderValue;
    }
    return toNumber(order.orderPrice) * toNumber(order.quantity);
};

export const computeAccountSummary = (
    walletBalance: unknown,
    holdings: HoldingInput[],
    orders: OrderInput[]
): AccountSummary => {
    const walletTotal = toNumber(walletBalance);

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
        .filter(isActiveBuyOrder)
        .reduce((sum, order) => sum + orderCommittedAmount(order), 0);

    // مانده مشتری = کل موجودی نقدی کیف پول
    const customerBalance = walletTotal;
    // قدرت خرید / موجودی قابل استفاده = مانده منهای سفارش‌های خرید باز
    const buyingPower = Math.max(walletTotal - blockedAmount, 0);
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
