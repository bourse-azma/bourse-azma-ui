import type {TradingOrder} from '../api';
import type {OrderFormValues, OrderValidationContext, OrderValidationResult} from './types';
import {parseNumericInput, validateOrder} from './orderValidation';

export const buildEditingValidationContext = (
    context: OrderValidationContext,
    order: TradingOrder,
): OrderValidationContext => {
    if (order.side === 'BUY') {
        const releasedReservation = order.orderPrice * order.remainingQuantity;
        return {
            ...context,
            buyingPower: context.buyingPower === null
                ? null
                : context.buyingPower + releasedReservation,
        };
    }

    return {
        ...context,
        availableToSell: context.availableToSell === null
            ? null
            : context.availableToSell + order.remainingQuantity,
    };
};

export const validateOrderEdit = (
    values: OrderFormValues,
    context: OrderValidationContext,
    order: TradingOrder,
    debugMode = false,
): OrderValidationResult => {
    const totalQuantity = parseNumericInput(values.quantity);
    const totalQuantityIsInteger = totalQuantity !== null
        && Number.isSafeInteger(totalQuantity)
        && totalQuantity > 0;
    const remainingQuantity = totalQuantityIsInteger
        ? totalQuantity - order.executedQuantity
        : null;

    const baseValidation = validateOrder(
        {
            ...values,
            quantity: remainingQuantity !== null && remainingQuantity > 0
                ? String(remainingQuantity)
                : '',
        },
        context,
        debugMode,
    );
    const errors = {...baseValidation.errors};

    if (!totalQuantityIsInteger) {
        errors.quantity = 'تعداد کل باید عدد صحیح و بزرگ‌تر از صفر باشد.';
    } else if (remainingQuantity === null || remainingQuantity <= 0) {
        errors.quantity = `تعداد کل باید از تعداد اجراشده (${order.executedQuantity.toLocaleString('en-US')}) بیشتر باشد.`;
    }

    return {
        ...baseValidation,
        errors,
        isValid: Object.keys(errors).length === 0,
        quantity: totalQuantityIsInteger ? totalQuantity : null,
    };
};
