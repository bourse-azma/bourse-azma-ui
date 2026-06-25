const LTR_MARK = '\u200E';
const LTR_EMBED_START = '\u202A';
const LTR_EMBED_END = '\u202C';

/** Tailwind classes for numeric values with +/- signs inside RTL layouts. */
export const ltrNumericClassName =
    'inline-block [direction:ltr] [unicode-bidi:isolate] tabular-nums';

/** Forces LTR rendering so +/- stay on the left of the number in RTL UI. */
export const toLtrIsolated = (value: string): string =>
    `${LTR_MARK}${LTR_EMBED_START}${value}${LTR_EMBED_END}`;

const formatEnNumber = (value: number, digits: number) =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(Math.abs(value));

export const formatSignedPrefix = (value: number): string => {
    if (value > 0) return '+';
    if (value < 0) return '-';
    return '';
};

const formatSignedCore = (value: number, digits: number) =>
    `${formatSignedPrefix(value)}${formatEnNumber(value, digits)}`;

export const formatNumberFa = (value: number, digits = 0) =>
    toLtrIsolated(
        value < 0 ? `-${formatEnNumber(value, digits)}` : formatEnNumber(value, digits),
    );

export const formatSignedNumberFa = (value: number, digits = 0) =>
    toLtrIsolated(formatSignedCore(value, digits));

export const formatPercentFa = (value: number, digits = 2) =>
    toLtrIsolated(`${formatSignedCore(value, digits)}%`);

export const formatPercentOrDash = (
    value: number | null | undefined,
    digits = 2,
    dash = 'ناموجود',
) =>
    value === null || value === undefined || Number.isNaN(value)
        ? dash
        : formatPercentFa(value, digits);

export const formatGrowthLabel = (growth: number, growthPercent: number) =>
    toLtrIsolated(`(${formatSignedCore(growth, 0)} (${formatSignedCore(growthPercent, 2)}%))`);
