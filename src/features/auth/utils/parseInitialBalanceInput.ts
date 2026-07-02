import {toEnglishDigits} from '../../../lib/stringUtils';

export const parseInitialBalanceInput = (raw: string): number | null => {
    const normalized = toEnglishDigits(raw).replace(/[,\s]/g, '').trim();
    if (normalized === '') {
        return null;
    }
    if (!/^\d+$/.test(normalized)) {
        return Number.NaN;
    }
    return Number(normalized);
};
