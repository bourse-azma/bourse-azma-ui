import type {TradingOrder} from './api';

/**
 * Every field that can move an active order to another private-book level participates in
 * the key, so a price-only edit refreshes the book immediately instead of waiting for polling.
 */
export const buildPrivateOrderBookRefreshKey = (
    orders: TradingOrder[],
    instrumentCode: string
): string => orders
    .filter((order) => order.instrumentCode === instrumentCode && order.remainingQuantity > 0)
    .map((order) => [
        order.id,
        order.side,
        order.status,
        order.orderPrice,
        order.remainingQuantity,
    ].join(':'))
    .sort()
    .join('|');

/**
 * The order ticket can be opened from any dashboard tab, so its book must never depend on
 * whether the symbol-information tab happens to be visible behind the modal.
 */
export const shouldLoadPrivateOrderBook = (
    isMarketViewActive: boolean,
    orderbookTab: string,
    orderTicketOpen: boolean
): boolean => orderTicketOpen || (isMarketViewActive && orderbookTab === 'info');
