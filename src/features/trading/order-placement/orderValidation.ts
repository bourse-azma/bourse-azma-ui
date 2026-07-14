import type {OrderFieldErrors, OrderFormValues, OrderValidationContext, OrderValidationResult,} from './types';

export const MARKET_CLOSED_ERROR =
    'بازار در حال حاضر بسته است؛ تا زمان بازگشایی امکان ثبت سفارش وجود ندارد.';

export const MARKET_STATE_LOADING_ERROR =
    'در حال دریافت وضعیت بازار...';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Normalizes Persian/Arabic digits and strips grouping separators to a plain numeric string. */
export const normalizeNumericInput = (raw: string): string => {
    let result = '';
    for (const char of raw) {
        const persianIndex = PERSIAN_DIGITS.indexOf(char);
        const arabicIndex = ARABIC_DIGITS.indexOf(char);
        if (persianIndex !== -1) {
            result += String(persianIndex);
        } else if (arabicIndex !== -1) {
            result += String(arabicIndex);
        } else if (char === ',' || char === '٬' || char === ' ' || char === '\u066c') {
            // drop thousands separators / spaces
        } else {
            result += char;
        }
    }
    return result.trim();
};

export const parseNumericInput = (raw: string): number | null => {
    const normalized = normalizeNumericInput(raw);
    if (normalized === '') return null;
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
};

const isPositiveInteger = (value: number | null): value is number =>
    value !== null && Number.isInteger(value) && value > 0;

const isPositive = (value: number | null): value is number => value !== null && value > 0;

export const validateOrder = (
    values: OrderFormValues,
    context: OrderValidationContext,
    debugMode = false
): OrderValidationResult => {
    const errors: OrderFieldErrors = {};

    if (!debugMode && context.marketOpen === null) {
        errors.general = MARKET_STATE_LOADING_ERROR;
        return {
            errors,
            isValid: false,
            quantity: null,
            effectivePrice: null,
            orderValue: null,
        };
    }

    if (!debugMode && !context.marketOpen) {
        errors.general = MARKET_CLOSED_ERROR;
        return {
            errors,
            isValid: false,
            quantity: null,
            effectivePrice: null,
            orderValue: null,
        };
    }

    const quantity = parseNumericInput(values.quantity);
    if (values.quantity.trim() === '') {
        errors.quantity = 'تعداد را وارد کنید.';
    } else if (!isPositiveInteger(quantity)) {
        errors.quantity = 'تعداد باید عدد صحیح و بزرگ‌تر از صفر باشد.';
    }

    let effectivePrice: number | null = null;
    if (values.orderType === 'CONDITIONAL') {
        const triggerPrice = parseNumericInput(values.triggerPrice);
        if (values.triggerPrice.trim() === '') {
            errors.triggerPrice = 'قیمت شرط را وارد کنید.';
        } else if (!isPositive(triggerPrice)) {
            errors.triggerPrice = 'قیمت شرط باید بزرگ‌تر از صفر باشد.';
        }
    }

    if (values.priceType === 'MARKET') {
        effectivePrice = isPositive(context.livePrice) ? context.livePrice : null;
        if (effectivePrice === null) {
            errors.price = 'قیمت بازار در دسترس نیست.';
        }
    } else {
        const price = parseNumericInput(values.price);
        if (values.price.trim() === '') {
            errors.price = 'قیمت را وارد کنید.';
        } else if (!isPositive(price)) {
            errors.price = 'قیمت باید بزرگ‌تر از صفر باشد.';
        } else {
            effectivePrice = price;
        }
    }

    const quantityValid = isPositiveInteger(quantity);

    if (values.side === 'SELL') {
        if (context.availableToSell === null) {
            errors.general = 'اطلاعات دارایی در دسترس نیست؛ امکان ثبت فروش وجود ندارد.';
        } else if (context.availableToSell <= 0) {
            errors.quantity = 'برای این نماد دارایی قابل فروشی ندارید.';
        } else if (quantityValid && quantity > context.availableToSell) {
            errors.quantity = 'تعداد فروش از موجودی قابل فروش بیشتر است.';
        }
    }

    const orderValue =
        quantityValid && effectivePrice !== null ? quantity * effectivePrice : null;

    if (orderValue !== null && orderValue < context.minimumOrderValue) {
        errors.general = `حداقل ارزش هر سفارش ${context.minimumOrderValue.toLocaleString('en-US')} ریال است.`;
    }

    if (
        values.side === 'BUY' &&
        context.buyingPower !== null &&
        orderValue !== null &&
        orderValue > context.buyingPower
    ) {
        errors.general = 'ارزش سفارش از قدرت خرید شما بیشتر است.';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0,
        quantity: quantityValid ? quantity : null,
        effectivePrice,
        orderValue,
    };
};
