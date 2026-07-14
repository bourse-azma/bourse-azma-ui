import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    type CreateOrderResult,
    createTradingOrder,
    type TradingOrder,
    updateTradingOrder,
} from '../api';
import {parseNumericInput, validateOrder} from './orderValidation';
import {buildEditingValidationContext, validateOrderEdit} from './orderEditValidation';
import {appConfig} from '../../../config/appConfig';
import {calculatePercentageQuantity, type OrderPercentage} from './orderPercentage';
import type {
    OrderFormValues,
    OrderSide,
    OrderSymbolContext,
    OrderType,
    OrderValidationContext,
    PriceType,
    TriggerComparator,
} from './types';

type UseOrderPlacementArgs = {
    open: boolean;
    initialSide: OrderSide;
    symbol: OrderSymbolContext;
    context: OrderValidationContext;
    accessToken: string;
    editingOrder?: TradingOrder | null;
    onSuccess: (result: CreateOrderResult, closeAfter: boolean) => void;
};

const buildDefaults = (
    side: OrderSide,
    livePrice: number | null,
    editingOrder?: TradingOrder | null,
): OrderFormValues => editingOrder ? ({
    side: editingOrder.side,
    orderType: editingOrder.orderType ?? 'NORMAL',
    priceType: editingOrder.priceType ?? 'CUSTOM',
    quantity: String(editingOrder.quantity),
    price: String(Math.round(editingOrder.orderPrice)),
    triggerComparator: editingOrder.triggerComparator ?? 'GREATER_THAN',
    triggerPrice: editingOrder.triggerPrice === null || editingOrder.triggerPrice === undefined
        ? ''
        : String(Math.round(editingOrder.triggerPrice)),
}) : ({
    side,
    orderType: 'NORMAL',
    priceType: 'CUSTOM',
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
                                      editingOrder = null,
                                      onSuccess,
                                  }: UseOrderPlacementArgs) => {
    const isEditing = editingOrder !== null;
    const [values, setValues] = useState<OrderFormValues>(
        () => buildDefaults(initialSide, context.livePrice, editingOrder)
    );
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successResult, setSuccessResult] = useState<CreateOrderResult | null>(null);
    const [selectedPercentage, setSelectedPercentage] = useState<OrderPercentage | null>(null);

    useEffect(() => {
        if (!open) return;
        setValues(buildDefaults(initialSide, context.livePrice, editingOrder));
        setSubmitError(null);
        submittingRef.current = false;
        setSubmitting(false);
        setSuccessResult(null);
        setSelectedPercentage(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialSide, symbol.instrumentCode, editingOrder?.id]);

    const setSide = useCallback((side: OrderSide) => {
        if (isEditing) return;
        setSubmitError(null);
        setSelectedPercentage(null);
        setValues((prev) => ({...prev, side}));
    }, [isEditing]);

    const setOrderType = useCallback((orderType: OrderType) => {
        if (isEditing) return;
        setSubmitError(null);
        setValues((prev) => ({
            ...prev,
            orderType,
            triggerPrice: orderType === 'NORMAL' ? '' : prev.triggerPrice,
        }));
    }, [isEditing]);

    const setPriceType = useCallback((priceType: PriceType) => {
        if (isEditing) return;
        setSubmitError(null);
        setValues((prev) => ({...prev, priceType}));
    }, [isEditing]);

    const validationContext = useMemo(
        () => editingOrder ? buildEditingValidationContext(context, editingOrder) : context,
        [context, editingOrder]
    );

    const setQuantity = useCallback((quantity: string) => {
        setSubmitError(null);
        setSelectedPercentage(null);
        setValues((prev) => ({...prev, quantity}));
    }, []);

    const setQuantityFromPercentage = useCallback((percentage: OrderPercentage) => {
        const quantity = calculatePercentageQuantity(
            values,
            validationContext,
            percentage,
            editingOrder?.executedQuantity ?? 0,
        );
        if (quantity === null) return;
        setSubmitError(null);
        setSelectedPercentage(percentage);
        setValues((prev) => ({...prev, quantity: String(quantity)}));
    }, [editingOrder?.executedQuantity, validationContext, values]);

    const setPrice = useCallback((price: string) => {
        setSubmitError(null);
        setValues((prev) => ({...prev, price}));
    }, []);

    const setTriggerComparator = useCallback((triggerComparator: TriggerComparator) => {
        if (isEditing) return;
        setValues((prev) => ({...prev, triggerComparator}));
    }, [isEditing]);

    const setTriggerPrice = useCallback((triggerPrice: string) => {
        if (isEditing) return;
        setSubmitError(null);
        setValues((prev) => ({...prev, triggerPrice}));
    }, [isEditing]);

    const fillPrice = useCallback((price: number) => {
        setSubmitError(null);
        setValues((prev) =>
            prev.priceType === 'CUSTOM' ? {...prev, price: String(Math.round(price))} : prev
        );
    }, []);

    const validation = useMemo(
        () => editingOrder
            ? validateOrderEdit(values, validationContext, editingOrder, appConfig.uiDebugMode)
            : validateOrder(values, validationContext, appConfig.uiDebugMode),
        [editingOrder, validationContext, values]
    );
    const isPercentageAvailable = useCallback((percentage: OrderPercentage) => {
        const executedQuantity = editingOrder?.executedQuantity ?? 0;
        const quantity = calculatePercentageQuantity(
            values,
            validationContext,
            percentage,
            executedQuantity,
        );
        return quantity !== null && quantity > executedQuantity;
    }, [editingOrder?.executedQuantity, validationContext, values]);

    useEffect(() => {
        if (selectedPercentage === null) return;
        const quantity = calculatePercentageQuantity(
            values,
            validationContext,
            selectedPercentage,
            editingOrder?.executedQuantity ?? 0,
        );
        if (quantity === null) return;
        const nextQuantity = String(quantity);
        setValues((prev) => prev.quantity === nextQuantity ? prev : {...prev, quantity: nextQuantity});
    }, [editingOrder?.executedQuantity, selectedPercentage, validationContext, values.price, values.priceType, values.side]);

    const instrumentMissing = !symbol.instrumentCode || symbol.instrumentCode.trim() === '';
    const canSubmit = validation.isValid && !instrumentMissing && !submitting && !successResult;

    const clearSuccess = useCallback(() => {
        setSuccessResult(null);
        setValues(buildDefaults(values.side, context.livePrice, editingOrder));
        setSubmitError(null);
        setSelectedPercentage(null);
    }, [context.livePrice, editingOrder, values.side]);

    const submit = useCallback(
        async (closeAfter: boolean) => {
            if (submittingRef.current) return;
            if (instrumentMissing) {
                setSubmitError('کد ابزار این نماد در دسترس نیست؛ امکان ثبت سفارش وجود ندارد.');
                return;
            }
            const result = editingOrder
                ? validateOrderEdit(values, validationContext, editingOrder, appConfig.uiDebugMode)
                : validateOrder(values, validationContext, appConfig.uiDebugMode);
            if (!result.isValid || result.quantity === null || result.effectivePrice === null) {
                return;
            }

            const livePriceForPayload =
                validationContext.livePrice && validationContext.livePrice > 0
                    ? validationContext.livePrice
                    : result.effectivePrice;

            const isConditional = values.orderType === 'CONDITIONAL';
            const triggerPrice = parseNumericInput(values.triggerPrice);
            const priceForPayload =
                values.priceType === 'CUSTOM' ? result.effectivePrice : null;

            submittingRef.current = true;
            setSubmitting(true);
            setSubmitError(null);
            try {
                const orderResult = editingOrder
                    ? await updateTradingOrder(accessToken, editingOrder.id, {
                        quantity: result.quantity,
                        price: priceForPayload,
                    })
                    : await createTradingOrder(accessToken, {
                        side: values.side,
                        orderType: values.orderType,
                        priceType: values.priceType,
                        symbol: symbol.symbol,
                        instrumentCode: symbol.instrumentCode!.trim(),
                        quantity: result.quantity,
                        price: priceForPayload,
                        livePrice: livePriceForPayload,
                        trigger:
                            isConditional && triggerPrice !== null
                                ? {comparator: values.triggerComparator, price: triggerPrice}
                                : null,
                    });
                setSuccessResult(orderResult);
                onSuccess(orderResult, closeAfter);
            } catch (error) {
                setSubmitError(error instanceof Error
                    ? error.message
                    : isEditing ? 'ویرایش سفارش ناموفق بود.' : 'ثبت سفارش ناموفق بود.');
            } finally {
                submittingRef.current = false;
                setSubmitting(false);
            }
        },
        [accessToken, editingOrder, instrumentMissing, isEditing, onSuccess, symbol.instrumentCode, symbol.symbol, validationContext, values]
    );

    return {
        values,
        isEditing,
        editingOrder,
        validationContext,
        validation,
        submitting,
        submitError,
        successResult,
        canSubmit,
        instrumentMissing,
        setSide,
        setOrderType,
        setPriceType,
        setQuantity,
        setQuantityFromPercentage,
        selectedPercentage,
        isPercentageAvailable,
        setPrice,
        setTriggerComparator,
        setTriggerPrice,
        fillPrice,
        submit,
        clearSuccess,
    };
};
