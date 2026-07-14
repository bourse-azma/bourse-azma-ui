import {describe, expect, it} from 'vitest';
import {calculatePercentageQuantity} from './orderPercentage';
import type {OrderFormValues, OrderValidationContext} from './types';

const values: OrderFormValues = {
    side: 'SELL',
    orderType: 'NORMAL',
    priceType: 'CUSTOM',
    quantity: '',
    price: '300',
    triggerComparator: 'GREATER_THAN',
    triggerPrice: '',
};

const context: OrderValidationContext = {
    livePrice: 250,
    availableToSell: 5,
    buyingPower: 1_000,
    marketOpen: true,
    minimumOrderValue: 100,
};

describe('calculatePercentageQuantity', () => {
    it('rounds an odd sell holding down to a whole share', () => {
        expect(calculatePercentageQuantity(values, context, 50)).toBe(2);
    });

    it('uses every available share for a 100% sell', () => {
        expect(calculatePercentageQuantity(values, {...context, availableToSell: 7}, 100)).toBe(7);
    });

    it('rounds buy quantity down so buying power is never exceeded', () => {
        expect(calculatePercentageQuantity({...values, side: 'BUY'}, context, 100)).toBe(3);
        expect(calculatePercentageQuantity({...values, side: 'BUY'}, context, 50)).toBe(1);
    });

    it('uses the live price for market orders', () => {
        expect(calculatePercentageQuantity(
            {...values, side: 'BUY', priceType: 'MARKET'},
            context,
            100,
        )).toBe(4);
    });
});
