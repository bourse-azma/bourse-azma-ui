import {describe, expect, it} from 'vitest';
import {validateOrder} from './orderValidation';
import type {OrderFormValues, OrderValidationContext} from './types';

const values: OrderFormValues = {
    side: 'BUY',
    orderType: 'NORMAL',
    priceType: 'CUSTOM',
    quantity: '4',
    price: '1000000',
    triggerComparator: 'GREATER_THAN',
    triggerPrice: '',
};

const context: OrderValidationContext = {
    livePrice: 1_000_000,
    availableToSell: 0,
    buyingPower: 20_000_000,
    marketOpen: true,
    minimumOrderValue: 5_000_000,
};

describe('validateOrder minimum value', () => {
    it('rejects orders below the configured minimum value', () => {
        const result = validateOrder(values, context);
        expect(result.isValid).toBe(false);
        expect(result.errors.general).toContain('5,000,000');
    });

    it('accepts an order exactly at the configured minimum value', () => {
        const result = validateOrder({...values, quantity: '5'}, context);
        expect(result.isValid).toBe(true);
        expect(result.orderValue).toBe(5_000_000);
    });
});
