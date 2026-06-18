import type {
    OrderFieldErrors,
    OrderFormValues,
    OrderSide,
    OrderValidationContext,
    OrderValidationResult,
} from './types';
import type {OrderBookPriceRange} from '../../symbol-search/orderBookUtils';

export const ORDER_BOOK_PRICE_ERROR =
    'این سایت در حالت دمو است؛ قیمت سفارش باید در محدوده صف خرید یا فروش باشد و ثبت قیمت خارج از این بازه امکان‌پذیر نیست.';

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

const queuePriceRangeForSide = (
    side: OrderSide,
    context: OrderValidationContext
): OrderBookPriceRange | null => (side === 'BUY' ? context.bidPriceRange : context.askPriceRange);

const isPriceWithinQueueRange = (price: number, range: OrderBookPriceRange): boolean =>
    price >= range.min && price <= range.max;

const validateQueuePrice = (
    price: number,
    side: OrderSide,
    context: OrderValidationContext,
    errors: OrderFieldErrors,
    field: 'price' | 'triggerPrice'
) => {
    const range = queuePriceRangeForSide(side, context);
    if (range === null || isPriceWithinQueueRange(price, range)) {
        return;
    }
    errors[field] = ORDER_BOOK_PRICE_ERROR;
};

export const validateOrder = (
    values: OrderFormValues,
    context: OrderValidationContext
): OrderValidationResult => {
    const errors: OrderFieldErrors = {};

    const quantity = parseNumericInput(values.quantity);
    if (values.quantity.trim() === '') {
        errors.quantity = 'تعداد را وارد کنید.';
    } else if (!isPositiveInteger(quantity)) {
        errors.quantity = 'تعداد باید عدد صحیح و بزرگ‌تر از صفر باشد.';
    }

    let effectivePrice: number | null = null;
    if (values.orderType === 'CONDITIONAL') {
        // A conditional order activates at the trigger price; that price is also
        // used as the effective order price (there is no separate price field).
        const triggerPrice = parseNumericInput(values.triggerPrice);
        if (values.triggerPrice.trim() === '') {
            errors.triggerPrice = 'قیمت شرط را وارد کنید.';
        } else if (!isPositive(triggerPrice)) {
            errors.triggerPrice = 'قیمت شرط باید بزرگ‌تر از صفر باشد.';
        } else {
            effectivePrice = triggerPrice;
            validateQueuePrice(triggerPrice, values.side, context, errors, 'triggerPrice');
        }
    } else if (values.priceType === 'MARKET') {
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
            validateQueuePrice(price, values.side, context, errors, 'price');
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
