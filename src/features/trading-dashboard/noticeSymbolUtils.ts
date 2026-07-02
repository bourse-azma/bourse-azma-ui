import type {CodalNotice} from '../notices/types';

const NON_SYMBOL_TITLE_TOKENS = new Set([
    'اصلاحیه',
    'حسابرسی',
    'حسابرسیشده',
    'حسابرسی نشده',
    'حسابرسی‌شده',
    'حسابرسی‌نشده',
    'حسابرسي',
    'شده',
    'نشده',
    'بورس',
    'فرابورس',
    'کارگزاری',
    'کارگزاري',
]);

export const normalizeSymbolText = (value: string) =>
    value
        .replace(/[()]/g, '')
        .replace(/[ـ]/g, '')
        .replace(/\u200c/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const isLikelyMarketSymbol = (value: string) => {
    if (value === '') return false;
    if (value.length < 2 || value.length > 20) return false;
    if (NON_SYMBOL_TITLE_TOKENS.has(value)) return false;
    if (value.includes(' ')) return false;
    return /^[\u0600-\u06FFA-Za-z0-9-]+$/u.test(value);
};

const extractSymbolsFromTitle = (title: string) => {
    const fromParentheses = Array.from(title.matchAll(/\(([^()]+)\)/g))
        .flatMap((match) => match[1].split(/[،,]/))
        .flatMap((part) => part.split(/\s+و\s+/))
        .map((item) => normalizeSymbolText(item))
        .filter(isLikelyMarketSymbol);

    return Array.from(new Set(fromParentheses));
};

export const getNoticeSymbols = (notice: CodalNotice) => {
    const extracted = extractSymbolsFromTitle(notice.title ?? '');
    const symbol = normalizeSymbolText(notice.symbol ?? '');
    const symbolLooksGeneric = /بورس|فرابورس|کارگزاری|کارگزاري/.test(symbol);

    const result: string[] = [];

    if (!(extracted.length > 0 && symbolLooksGeneric) && symbol !== '' && symbol !== '-') {
        result.push(symbol);
    }

    extracted.forEach((item) => {
        if (!result.includes(item)) {
            result.push(item);
        }
    });

    return result;
};
