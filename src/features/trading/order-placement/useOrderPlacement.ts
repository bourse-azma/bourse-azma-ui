import {useCallback, useEffect, useMemo, useState} from 'react';
import {type CreateOrderResult, createTradingOrder} from '../api';
import {parseNumericInput, validateOrder} from './orderValidation';
import type {
    OrderFormValues,
    OrderSide,
    OrderSymbolContext,
    OrderType,
    OrderValidationContext,
    OrderValidity,
    PriceType,
    TriggerComparator,
} from './types';

type UseOrderPlacementArgs = {
    open: boolean;
    initialSide: OrderSide;
    symbol: OrderSymbolContext;
    context: OrderValidationContext;
    accessToken: string;
    onSuccess: (result: CreateOrderResult, closeAfter: boolean) => void;
};

const buildDefaults = (side: OrderSide, livePrice: number | null): OrderFormValues => ({
    side,
    orderType: 'NORMAL',
    priceType: 'CUSTOM',
    validity: 'TODAY',
    quantity: '',
    price: livePrice && livePrice > 0 ? String(Math.round(livePrice)) : '',
    triggerComparator: 'GREATER_THAN',
    triggerPrice: '',
});

export const useOrderPlacement = ({
                                      open,
                                      initialSide,
                                      symbol,
                                      context,
                                      accessToken,
                                      onSuccess,
                                  }: UseOrderPlacementArgs) => {
    const [values, setValues] = useState<OrderFormValues>(() => buildDefaults(initialSide, context.livePrice));
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Reset the form whenever the dialog is (re)opened, the symbol changes,
    // or the requested side changes.
    useEffect(() => {
        if (!open) return;
        setValues(buildDefaults(initialSide, context.livePrice));
        setSubmitError(null);
        setSubmitting(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialSide, symbol.instrumentCode]);

    const setSide = useCallback((side: OrderSide) => {
        setSubmitError(null);
        setValues((prev) => ({...prev, side}));
    }, []);

    const setOrderType = useCallback((orderType: OrderType) => {
        setSubmitError(null);
        setValues((prev) => ({
            ...prev,
            orderType,
            // Clear conditional-only field when switching back to a normal order.
            triggerPrice: orderType === 'NORMAL' ? '' : prev.triggerPrice,
        }));
    }, []);

    const setPriceType = useCallback((priceType: PriceType) => {
        setSubmitError(null);
        setValues((prev) => ({...prev, priceType}));
    }, []);

    const setValidity = useCallback((validity: OrderValidity) => {
        setValues((prev) => ({...prev, validity}));
    }, []);

    const setQuantity = useCallback((quantity: string) => {
        setSubmitError(null);
        setValues((prev) => ({...prev, quantity}));
    }, []);

    const setPrice = useCallback((price: string) => {
        setSubmitError(null);
        setValues((prev) => ({...prev, price}));
    }, []);

    const setTriggerComparator = useCallback((triggerComparator: TriggerComparator) => {
        setValues((prev) => ({...prev, triggerComparator}));
    }, []);

    const setTriggerPrice = useCallback((triggerPrice: string) => {
        setSubmitError(null);
        setValues((prev) => ({...prev, triggerPrice}));
    }, []);

    const fillPrice = useCallback((price: number) => {
        setSubmitError(null);
        setValues((prev) =>
            prev.priceType === 'CUSTOM' ? {...prev, price: String(Math.round(price))} : prev
        );
    }, []);

    const validation = useMemo(() => validateOrder(values, context), [values, context]);

    const instrumentMissing = !symbol.instrumentCode || symbol.instrumentCode.trim() === '';
    const canSubmit = validation.isValid && !instrumentMissing && !submitting;

    const submit = useCallback(
        async (closeAfter: boolean) => {
            if (submitting) return;
            if (instrumentMissing) {
                setSubmitError('کد ابزار این نماد در دسترس نیست؛ امکان ثبت سفارش وجود ندارد.');
                return;
            }
            const result = validateOrder(values, context);
            if (!result.isValid || result.quantity === null || result.effectivePrice === null) {
                return;
            }

            const livePriceForPayload =
                context.livePrice && context.livePrice > 0 ? context.livePrice : result.effectivePrice;

            const isConditional = values.orderType === 'CONDITIONAL';
            const triggerPrice = parseNumericInput(values.triggerPrice);
            // Conditional orders activate at the trigger price, so they are sent as a
            // custom-priced order using that price; market orders carry no explicit price.
            const priceTypeForPayload = isConditional ? 'CUSTOM' : values.priceType;
            const priceForPayload =
                isConditional || values.priceType === 'CUSTOM' ? result.effectivePrice : null;

            setSubmitting(true);
            setSubmitError(null);
            try {
                const orderResult = await createTradingOrder(accessToken, {
                    side: values.side,
                    orderType: values.orderType,
                    priceType: priceTypeForPayload,
                    symbol: symbol.symbol,
                    instrumentCode: symbol.instrumentCode!.trim(),
                    quantity: result.quantity,
                    price: priceForPayload,
                    livePrice: livePriceForPayload,
                    validityType: values.validity,
                    trigger:
                        isConditional && triggerPrice !== null
                            ? {comparator: values.triggerComparator, price: triggerPrice}
                            : null,
                });
                onSuccess(orderResult, closeAfter);
            } catch (error) {
                setSubmitError(error instanceof Error ? error.message : 'ثبت سفارش ناموفق بود.');
            } finally {
                setSubmitting(false);
            }
        },
        [accessToken, context, instrumentMissing, onSuccess, submitting, symbol.instrumentCode, symbol.symbol, values]
    );

    return {
        values,
        validation,
        submitting,
        submitError,
        canSubmit,
        instrumentMissing,
        setSide,
        setOrderType,
        setPriceType,
        setValidity,
        setQuantity,
        setPrice,
        setTriggerComparator,
        setTriggerPrice,
        fillPrice,
        submit,
    };
};
