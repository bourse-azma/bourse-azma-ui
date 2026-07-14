import {formatNumberFa} from '../../../utils/numberFormat';
import type {PriceType} from '../api';
import {parseNumericInput} from './orderValidation';

export type OrderEditValidation = {
    quantity: number | null;
    price: number | null;
    remainingQuantity: number | null;
    remainingValue: number | null;
    error: string | null;
};

type ValidateOrderEditInput = {
    quantityText: string;
    priceText: string;
    priceType: PriceType | undefined;
    currentOrderPrice: number;
    executedQuantity: number;
    minimumOrderValue: number;
};

export const validateOrderEdit = ({
                                      quantityText,
                                      priceText,
                                      priceType,
                                      currentOrderPrice,
                                      executedQuantity,
                                      minimumOrderValue,
                                  }: ValidateOrderEditInput): OrderEditValidation => {
    const quantity = parseNumericInput(quantityText);
    const price = priceType === 'MARKET' ? currentOrderPrice : parseNumericInput(priceText);
    let error: string | null = null;

    if (quantity === null || !Number.isSafeInteger(quantity) || quantity <= 0) {
        error = 'تعداد باید یک عدد صحیح و بزرگ‌تر از صفر باشد.';
    } else if (quantity <= executedQuantity) {
        error = `تعداد کل باید از تعداد اجراشده (${formatNumberFa(executedQuantity)}) بیشتر باشد.`;
    } else if (price === null || !Number.isFinite(price) || price <= 0) {
        error = 'قیمت باید بزرگ‌تر از صفر باشد.';
    }

    const remainingQuantity = quantity !== null && Number.isSafeInteger(quantity)
        ? quantity - executedQuantity
        : null;
    const remainingValue = remainingQuantity !== null && remainingQuantity > 0 && price !== null
        ? remainingQuantity * price
        : null;

    if (!error && remainingValue !== null && !Number.isFinite(remainingValue)) {
        error = 'ارزش سفارش بیش از محدوده قابل محاسبه است.';
    } else if (!error && remainingValue !== null && remainingValue < minimumOrderValue) {
        error = `ارزش باقیمانده سفارش باید حداقل ${formatNumberFa(minimumOrderValue)} ریال باشد.`;
    }

    return {quantity, price, remainingQuantity, remainingValue, error};
};
