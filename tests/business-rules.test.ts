import {describe, expect, it} from 'vitest';
import {validatePassword, validateUsername} from '../src/lib/authValidation';
import {normalizePhoneNumber, toEnglishDigits} from '../src/lib/stringUtils';
import {parseInitialBalanceInput} from '../src/features/auth/utils/parseInitialBalanceInput';
import {
    computeProjectedBalance,
    getWalletTransactionMeta,
    parseWalletAmount,
    validateWalletAmount,
} from '../src/features/wallet/walletUtils';
import {computeAccountSummary} from '../src/features/trading/accountSummary';
import {
    MARKET_CLOSED_ERROR,
    MARKET_STATE_LOADING_ERROR,
    normalizeNumericInput,
    parseNumericInput,
    validateOrder,
} from '../src/features/trading/order-placement/orderValidation';
import {calculatePercentageQuantity} from '../src/features/trading/order-placement/orderPercentage';
import type {OrderFormValues, OrderValidationContext} from '../src/features/trading/order-placement/types';
import {computeAvailableToSell} from '../src/features/trading-dashboard/tradingDisplayMappers';
import {normalizeOrderBookRows} from '../src/features/symbol-search/orderBookUtils';
import type {SymbolOrderBookRow} from '../src/features/symbol-search/types';
import {
    buildPrivateOrderBookRefreshKey,
    shouldLoadPrivateOrderBook,
} from '../src/features/trading/privateOrderBookUtils';
import type {TradingOrder} from '../src/features/trading/api';

const buy: OrderFormValues = {
    side: 'BUY', orderType: 'NORMAL', priceType: 'CUSTOM', quantity: '2000', price: '2500',
    triggerComparator: 'GREATER_THAN', triggerPrice: '',
};
const context: OrderValidationContext = {
    livePrice: 2500, availableToSell: 0, buyingPower: 10_000_000,
    marketOpen: true, minimumOrderValue: 5_000_000,
};

describe('localized input hardening', () => {
    it('normalizes Persian and Arabic digits without changing semantic content', () => {
        expect(toEnglishDigits('۰۹۱۲٣٤٥٦٧٨٩')).toBe('09123456789');
        expect(normalizePhoneNumber(' ۰۹۱۲ ۳۴۵ ۶۷۸۹ ')).toBe('09123456789');
        expect(normalizeNumericInput('۱۲٬۳۴۵,۶۷۸')).toBe('12345678');
        expect(parseNumericInput('١٢٬٥٠٠')).toBe(12500);
    });

    it.each(['', 'abc', '-1', '1.5'])('rejects invalid wallet amount %j', (raw) => {
        expect(parseWalletAmount(raw)).toBeNull();
        expect(validateWalletAmount(raw, 1000)).not.toBeNull();
    });

    it('rejects unsafe and over-limit wallet amounts before JSON serialization', () => {
        expect(parseWalletAmount(String(Number.MAX_SAFE_INTEGER + 1))).toBeNull();
        expect(validateWalletAmount('1001', 1000)).toContain('بیش از حد مجاز');
        expect(validateWalletAmount('1000', 1000)).toBeNull();
    });

    it('parses localized initial balances and rejects decimals/scientific notation', () => {
        expect(parseInitialBalanceInput('۱,۲۵۰,۰۰۰')).toBe(1_250_000);
        expect(parseInitialBalanceInput('')).toBeNull();
        expect(parseInitialBalanceInput('1.5')).toBeNaN();
        expect(parseInitialBalanceInput('1e6')).toBeNaN();
    });

    it('enforces username and password boundaries', () => {
        expect(validateUsername('ab')).not.toBeNull();
        expect(validateUsername('abc')).toBeNull();
        expect(validateUsername('نام')).not.toBeNull();
        expect(validatePassword('12345678')).not.toBeNull();
        expect(validatePassword('abcdefghi')).not.toBeNull();
        expect(validatePassword('abc12345')).toBeNull();
        expect(validatePassword(`${'a'.repeat(24)}1`)).not.toBeNull();
    });
});

describe('order validation boundaries', () => {
    it('accepts an order exactly at minimum value and buying power', () => {
        const result = validateOrder(buy, context);
        expect(result).toMatchObject({isValid: true, quantity: 2000, effectivePrice: 2500, orderValue: 5_000_000});
    });

    it('rejects below-minimum and above-buying-power orders', () => {
        expect(validateOrder({...buy, quantity: '1999'}, context).errors.general).toContain('حداقل ارزش');
        expect(validateOrder({...buy, quantity: '4001'}, context).errors.general).toContain('قدرت خرید');
    });

    it('rejects zero, negative, decimal, missing price, and unavailable market price', () => {
        expect(validateOrder({...buy, quantity: '0'}, context).errors.quantity).toBeTruthy();
        expect(validateOrder({...buy, quantity: '-1'}, context).errors.quantity).toBeTruthy();
        expect(validateOrder({...buy, quantity: '1.5'}, context).errors.quantity).toBeTruthy();
        expect(validateOrder({...buy, price: ''}, context).errors.price).toBeTruthy();
        expect(validateOrder({...buy, priceType: 'MARKET'}, {...context, livePrice: null}).errors.price).toBeTruthy();
    });

    it('blocks orders while market state is loading or closed unless debug mode is explicit', () => {
        expect(validateOrder(buy, {...context, marketOpen: null}).errors.general).toBe(MARKET_STATE_LOADING_ERROR);
        expect(validateOrder(buy, {...context, marketOpen: false}).errors.general).toBe(MARKET_CLOSED_ERROR);
        expect(validateOrder(buy, {...context, marketOpen: false}, true).isValid).toBe(true);
    });

    it('enforces sellable holdings and conditional trigger price', () => {
        const sell = {...buy, side: 'SELL' as const};
        expect(validateOrder(sell, {...context, availableToSell: null}).errors.general).toContain('دارایی');
        expect(validateOrder(sell, {...context, availableToSell: 1999}).errors.quantity).toContain('بیشتر');
        expect(validateOrder({...sell, orderType: 'CONDITIONAL', triggerPrice: ''}, {
            ...context, availableToSell: 2000,
        }).errors.triggerPrice).toBeTruthy();
    });

    it('rounds percentage quantities down and preserves already executed edit quantity', () => {
        expect(calculatePercentageQuantity(buy, context, 25)).toBe(1000);
        expect(calculatePercentageQuantity({...buy, side: 'SELL'}, {...context, availableToSell: 7}, 50)).toBe(3);
        expect(calculatePercentageQuantity({...buy, side: 'SELL'}, {...context, availableToSell: 7}, 50, 2)).toBe(5);
        expect(calculatePercentageQuantity(buy, {...context, buyingPower: null}, 100)).toBeNull();
    });
});

describe('wallet and account invariants', () => {
    it('computes additions/subtractions and transaction metadata exactly', () => {
        expect(computeProjectedBalance(1000, 'ADD', 250)).toBe(1250);
        expect(computeProjectedBalance(1000, 'SUBTRACT', 250)).toBe(750);
        expect(getWalletTransactionMeta({
            id: 1, amount: -250, balanceAfter: 750, description: 'خرید سهم', createdAt: 'now',
        })).toMatchObject({isIncrease: false, balanceBefore: 1000, title: 'کاهش موجودی'});
        expect(getWalletTransactionMeta({
            id: 2, amount: -250, balanceAfter: 750,
            description: 'خرید فملی به تعداد 10 با قیمت 1000 ریال', createdAt: 'now',
        })).toMatchObject({title: 'خرید فملی'});
        expect(getWalletTransactionMeta({
            id: 3, amount: 250, balanceAfter: 1000, description: 'افزایش موجودی به میزان 250 ریال',
            source: 'DEPOSIT', createdAt: 'now',
        })).toMatchObject({title: 'واریز به کیف پول'});
        expect(getWalletTransactionMeta({
            id: 4, amount: 250, balanceAfter: 250,
            description: 'موجودی اولیه به مبلغ 250 ریال هنگام ثبت‌نام', createdAt: 'now',
        })).toMatchObject({title: 'موجودی اولیه'});
    });

    it('reserves only remaining quantities of active buy orders', () => {
        const summary = computeAccountSummary(10_000, [{quantity: 2, buyPrice: 100, livePrice: 150}], [
            {side: 'BUY', quantity: 10, remainingQuantity: 4, orderPrice: 500, status: 'PARTIALLY_FILLED'},
            {side: 'BUY', quantity: 10, remainingQuantity: 10, orderPrice: 500, status: 'CANCELLED'},
            {side: 'SELL', quantity: 10, remainingQuantity: 10, orderPrice: 500, status: 'REQUESTED'},
        ]);
        expect(summary).toMatchObject({
            portfolioValue: 300,
            portfolioCost: 200,
            blockedAmount: 2000,
            buyingPower: 8000,
            netAssets: 10_300
        });
    });

    it('never reports negative buying power', () => {
        const summary = computeAccountSummary(100, [], [
            {side: 'BUY', quantity: 1, remainingQuantity: 1, orderPrice: 200, status: 'REQUESTED'},
        ]);
        expect(summary.buyingPower).toBe(0);
    });

    it('subtracts every active sell reservation from holdings and clamps at zero', () => {
        const holdings = [{
            id: 1,
            acquiredAt: 'now',
            symbol: 'فملی',
            instrumentCode: 'A',
            quantity: 10,
            buyPrice: 1,
            livePrice: 1,
            netValue: 10
        }];
        const orders = [
            {
                id: 1,
                side: 'SELL' as const,
                sideLabel: 'فروش',
                symbol: 'فملی',
                instrumentCode: 'A',
                quantity: 7,
                remainingQuantity: 7,
                executedQuantity: 0,
                orderPrice: 1,
                livePrice: 1,
                averageExecutedPrice: null,
                orderTime: 'now',
                cancelledAt: null,
                status: 'REQUESTED' as const,
                statusLabel: 'باز',
                cancellable: true
            },
            {
                id: 2,
                side: 'SELL' as const,
                sideLabel: 'فروش',
                symbol: 'فملی',
                instrumentCode: 'A',
                quantity: 8,
                remainingQuantity: 8,
                executedQuantity: 0,
                orderPrice: 1,
                livePrice: 1,
                averageExecutedPrice: null,
                orderTime: 'now',
                cancelledAt: null,
                status: 'TRIGGER_PENDING' as const,
                statusLabel: 'شرطی',
                cancellable: true
            },
        ];
        expect(computeAvailableToSell('A', holdings, orders, null)).toBe(0);
        expect(computeAvailableToSell('', holdings, orders, null)).toBeNull();
        expect(computeAvailableToSell('A', holdings, orders, 'network')).toBeNull();
    });
});

describe('private order book visibility', () => {
    const rows: SymbolOrderBookRow[] = Array.from({length: 6}, (_, index) => ({
        id: `row-${index + 1}`,
        level: index + 1,
        askCount: 1,
        askVolume: 100,
        askPrice: 101 + index,
        bidPrice: 100 - index,
        bidVolume: 100,
        bidCount: 1,
        ownBidVolume: index === 5 ? 25 : 0,
        ownAskVolume: 0,
    }));

    it('keeps every order book fixed at the five simulated TSE rows', () => {
        expect(normalizeOrderBookRows(rows)).toHaveLength(5);
        expect(normalizeOrderBookRows(rows).some((row) => row.id === 'row-6')).toBe(false);
    });

    it('refreshes after a price-only edit and ignores unrelated symbols', () => {
        const base = {
            id: 10,
            side: 'BUY',
            sideLabel: 'خرید',
            symbol: 'شبندر',
            instrumentCode: 'CODE',
            quantity: 100,
            remainingQuantity: 100,
            executedQuantity: 0,
            orderPrice: 1,
            livePrice: 10_760,
            averageExecutedPrice: null,
            orderTime: 'now',
            cancelledAt: null,
            status: 'REQUESTED',
            statusLabel: 'درخواست شده',
            cancellable: true,
        } satisfies TradingOrder;

        const before = buildPrivateOrderBookRefreshKey([base], 'CODE');
        const after = buildPrivateOrderBookRefreshKey([{...base, orderPrice: 10_660}], 'CODE');
        const withOtherSymbol = buildPrivateOrderBookRefreshKey([
            base,
            {...base, id: 11, instrumentCode: 'OTHER'},
        ], 'CODE');

        expect(after).not.toBe(before);
        expect(withOtherSymbol).toBe(before);
    });

    it('loads the private book for an open order ticket regardless of the background tab', () => {
        expect(shouldLoadPrivateOrderBook(true, 'peers', true)).toBe(true);
        expect(shouldLoadPrivateOrderBook(true, 'technical', true)).toBe(true);
        expect(shouldLoadPrivateOrderBook(false, 'peers', true)).toBe(true);
        expect(shouldLoadPrivateOrderBook(true, 'info', false)).toBe(true);
        expect(shouldLoadPrivateOrderBook(true, 'peers', false)).toBe(false);
    });
});
