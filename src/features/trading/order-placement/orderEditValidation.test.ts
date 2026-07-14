import {describe, expect, it} from 'vitest';
import {validateOrderEdit} from './orderEditValidation';

const baseInput = {
    quantityText: '100',
    priceText: '100000',
    priceType: 'CUSTOM' as const,
    currentOrderPrice: 100000,
    executedQuantity: 20,
    minimumOrderValue: 5_000_000,
};

describe('validateOrderEdit', () => {
    it('calculates value from the unfilled quantity', () => {
        const result = validateOrderEdit(baseInput);

        expect(result.error).toBeNull();
        expect(result.quantity).toBe(100);
        expect(result.remainingQuantity).toBe(80);
        expect(result.remainingValue).toBe(8_000_000);
    });

    it('rejects a total quantity that does not preserve executed shares', () => {
        const result = validateOrderEdit({...baseInput, quantityText: '20'});

        expect(result.error).toContain('اجراشده');
    });

    it('rejects fractional share quantities', () => {
        const result = validateOrderEdit({...baseInput, quantityText: '20.5'});

        expect(result.error).toContain('عدد صحیح');
    });

    it('enforces the minimum on the remaining order value', () => {
        const result = validateOrderEdit({...baseInput, quantityText: '30'});

        expect(result.remainingValue).toBe(1_000_000);
        expect(result.error).toContain('حداقل');
    });
});
