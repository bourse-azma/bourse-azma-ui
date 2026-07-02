const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const toEnglishDigits = (value: string): string =>
    value
        .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));

export const normalizePhoneNumber = (raw: string): string => {
    const value = toEnglishDigits(raw).replace(/\s+/g, '');
    if (value.startsWith('+98')) return value;
    if (value.startsWith('98')) return `+${value}`;
    if (value.startsWith('09') && value.length === 11) return `+98${value.slice(1)}`;
    return value;
};

export const PERSIAN_NAME_PATTERN = /^[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+$/;

export const isPersianName = (value: string): boolean => PERSIAN_NAME_PATTERN.test(value.trim());
