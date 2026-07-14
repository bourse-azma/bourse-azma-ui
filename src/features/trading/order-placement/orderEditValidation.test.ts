import {describe, expect, it} from 'vitest';
import type {TradingOrder} from '../api';
import type {OrderFormValues, OrderValidationContext} from './types';
import {buildEditingValidationContext, validateOrderEdit} from './orderEditValidation';

const order: TradingOrder = {
    id: 10,
    side: 'SELL',
    sideLabel: 'فروش',
    symbol: 'فملی',
    instrumentCode: 'IRO1MSMI0001',
    quantity: 100,
    remainingQuantity: 80,
    executedQuantity: 20,
    orderPrice: 100_000,
    livePrice: 100_000,
    averageExecutedPrice: 100_000,
    orderTime: '2026-01-01T00:00:00Z',
    cancelledAt: null,
    status: 'PARTIALLY_FILLED',
    statusLabel: 'اجرای جزئی',
    cancellable: true,
    orderType: 'NORMAL',
    priceType: 'CUSTOM',
};

const values: OrderFormValues = {
    side: 'SELL',
    orderType: 'NORMAL',
    priceType: 'CUSTOM',
    quantity: '100',
    price: '100000',
    triggerComparator: 'GREATER_THAN',
    triggerPrice: '',
};

const context: OrderValidationContext = {
    livePrice: 100_000,
    availableToSell: 20,
    buyingPower: 50_000_000,
    marketOpen: true,
    minimumOrderValue: 5_000_000,
};

describe('editing order validation', () => {
    it('returns the current buy reservation to buying power', () => {
        const editingContext = buildEditingValidationContext(
            {...context, buyingPower: 5_000},
            {...order, side: 'BUY', orderPrice: 200, remainingQuantity: 30},
        );

        expect(editingContext.buyingPower).toBe(11_000);
    });

    it('returns the current reservation to available sell quantity', () => {
        const editingContext = buildEditingValidationContext(context, order);

        expect(editingContext.availableToSell).toBe(100);
    });

    it('validates value and holdings from the unfilled quantity', () => {
        const result = validateOrderEdit(values, buildEditingValidationContext(context, order), order);

        expect(result.isValid).toBe(true);
        expect(result.quantity).toBe(100);
        expect(result.orderValue).toBe(8_000_000);
    });

    it('rejects a total quantity that does not preserve executed shares', () => {
        const result = validateOrderEdit(
            {...values, quantity: '20'},
            buildEditingValidationContext(context, order),
            order,
        );

        expect(result.errors.quantity).toContain('اجراشده');
    });

    it('rejects fractional total quantities', () => {
        const result = validateOrderEdit(
            {...values, quantity: '20.5'},
            buildEditingValidationContext(context, order),
            order,
        );

        expect(result.errors.quantity).toContain('عدد صحیح');
    });

    it('enforces the minimum on the remaining value', () => {
        const result = validateOrderEdit(
            {...values, quantity: '30'},
            buildEditingValidationContext(context, order),
            order,
        );

        expect(result.orderValue).toBe(1_000_000);
        expect(result.errors.general).toContain('حداقل');
    });
});
