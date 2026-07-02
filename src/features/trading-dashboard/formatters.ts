import {
    formatNumberFa,
    formatPercentFa,
    formatPercentOrDash as formatPercentOrDashBase,
} from '../../utils/numberFormat';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const formatNumberOrDash = (value: number | null | undefined, digits = 0) =>
    value === null || value === undefined || Number.isNaN(value) ? 'ناموجود' : formatNumberFa(value, digits);

export const formatOrderBookValue = (value: number | null | undefined, digits = 0) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }
    return formatNumberFa(value, digits);
};

export const formatDepthPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '0%';
    }
    return formatPercentFa(value, 0);
};

export const formatPercentOrDash = (value: number | null | undefined, digits = 2) =>
    formatPercentOrDashBase(value, digits, 'ناموجود');

export const formatCompactValue = (value: number, unit: 'T' | 'B') => {
    const divisor = unit === 'T' ? 1_000_000_000_000 : 1_000_000_000;
    return `${formatNumberFa(value / divisor, 2)}${unit}`;
};

export const formatCompactValueOrUnavailable = (value: number | null | undefined, unit: 'T' | 'B') =>
    value === null || value === undefined || Number.isNaN(value) ? 'ناموجود' : formatCompactValue(value, unit);

export const formatCompactAmountFa = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'ناموجود';
    const absolute = Math.abs(value);
    if (absolute >= 1_000_000_000_000) {
        return `${formatNumberFa(value / 1_000_000_000_000, 2)}T`;
    }
    if (absolute >= 1_000_000_000) {
        return `${formatNumberFa(value / 1_000_000_000, 2)}B`;
    }
    if (absolute >= 1_000_000) {
        return `${formatNumberFa(value / 1_000_000, 2)}M`;
    }
    if (absolute >= 1_000) {
        return `${formatNumberFa(value / 1_000, 2)}K`;
    }
    return formatNumberFa(value);
};

export const formatNumberWithUnit = (value: number | null | undefined, unit: string, digits = 0) => {
    const formatted = formatNumberOrDash(value, digits);
    return formatted === 'ناموجود' ? formatted : `${formatted} ${unit}`;
};

export const formatFaInteger = (value: number) => new Intl.NumberFormat('en-US').format(value);
export const formatFaPlainInteger = (value: number) =>
    new Intl.NumberFormat('en-US', {useGrouping: false}).format(value);
