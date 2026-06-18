import type {OrderSide, OrderType, OrderValidity, PriceType, TriggerComparator,} from '../api';

export type {OrderSide, OrderType, OrderValidity, PriceType, TriggerComparator};

export type OrderFormValues = {
    side: OrderSide;
    orderType: OrderType;
    priceType: PriceType;
    validity: OrderValidity;
    quantity: string;
    price: string;
    triggerComparator: TriggerComparator;
    triggerPrice: string;
};

export type OrderSymbolContext = {
    symbol: string;
    instrumentCode: string | null;
    name: string;
    lastPrice: number | null;
    closePrice: number | null;
    changePercent: number | null;
    tradeVolume: number | null;
    tradeCount: number | null;
};

export type OrderValidationContext = {
    /** Best available market price used for market orders and order-value estimates. */
    livePrice: number | null;
    /** Sellable quantity for the symbol; null when holdings data is unavailable. */
    availableToSell: number | null;
    /** Buying power in Rial; null when balance is unavailable. */
    buyingPower: number | null;
};

export type OrderFieldErrors = Partial<
    Record<'quantity' | 'price' | 'triggerPrice' | 'general', string>
>;

export type OrderValidationResult = {
    errors: OrderFieldErrors;
    isValid: boolean;
    quantity: number | null;
    effectivePrice: number | null;
    orderValue: number | null;
};

export const VALIDITY_LABELS: Record<OrderValidity, string> = {
    TODAY: 'امروز',
    DAY: 'فردا',
    DAYS_30: '۳۰ روز',
    DAYS_90: '۹۰ روز',
};

export const TRIGGER_LABELS: Record<TriggerComparator, string> = {
    GREATER_THAN: 'بیشتر از',
    LESS_THAN: 'کمتر از',
    EQUAL: 'برابر با',
};
