import {describe, expect, it} from 'vitest';
import {parseWalletAmount, validateWalletAmount} from './walletUtils';

const maximum = 1_000_000_000_000;

describe('wallet amount validation', () => {
    it('returns a specific limit error for an arbitrarily long integer', () => {
        const error = validateWalletAmount('999999999999999999999999999999999999', maximum);
        expect(error).toContain('1,000,000,000,000');
        expect(error).toContain('حداکثر');
    });

    it('accepts the configured maximum exactly', () => {
        expect(validateWalletAmount(String(maximum), maximum)).toBeNull();
        expect(parseWalletAmount(String(maximum))).toBe(maximum);
    });

    it('rejects fractional and non-numeric input as an integer error', () => {
        expect(validateWalletAmount('12.5', maximum)).toContain('عدد صحیح');
        expect(validateWalletAmount('12e5', maximum)).toContain('عدد صحیح');
    });
});
