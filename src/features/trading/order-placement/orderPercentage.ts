import {parseNumericInput} from './orderValidation';
import type {OrderFormValues, OrderValidationContext} from './types';

export const ORDER_PERCENTAGES = [25, 50, 75, 100] as const;
export type OrderPercentage = (typeof ORDER_PERCENTAGES)[number];

const resolveEffectivePrice = (
    values: OrderFormValues,
    context: OrderValidationContext,
): number | null => {
    const price = values.priceType === 'MARKET'
        ? context.livePrice
        : parseNumericInput(values.price);
    return price !== null && Number.isFinite(price) && price > 0 ? price : null;
};

/** Returns whole shares only, always rounding down so the selected budget/holding is never exceeded. */
export const calculatePercentageQuantity = (
    values: OrderFormValues,
    context: OrderValidationContext,
    percentage: OrderPercentage,
): number | null => {
    let maximumQuantity: number | null;

    if (values.side === 'SELL') {
        maximumQuantity = context.availableToSell;
    } else {
        const price = resolveEffectivePrice(values, context);
        maximumQuantity = price === null || context.buyingPower === null
            ? null
            : context.buyingPower / price;
    }

    if (maximumQuantity === null || !Number.isFinite(maximumQuantity) || maximumQuantity < 0) {
        return null;
    }

    return Math.floor((maximumQuantity * percentage) / 100);
};
