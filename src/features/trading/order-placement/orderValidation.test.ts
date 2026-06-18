import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {normalizeNumericInput, parseNumericInput, validateOrder} from './orderValidation.ts';
import type {OrderFormValues, OrderValidationContext} from './types.ts';

const baseValues = (overrides: Partial<OrderFormValues> = {}): OrderFormValues => ({
    side: 'BUY',
    orderType: 'NORMAL',
    priceType: 'CUSTOM',
    validity: 'TODAY',
    quantity: '10',
    price: '1000',
    triggerComparator: 'GREATER_THAN',
    triggerPrice: '',
    ...overrides,
});

const baseContext = (overrides: Partial<OrderValidationContext> = {}): OrderValidationContext => ({
    livePrice: 1200,
    availableToSell: 100,
    buyingPower: 100_000_000,
    ...overrides,
});

test('normalizes Persian digits and separators', () => {
    assert.equal(normalizeNumericInput('۱۲٬۳۴۵'), '12345');
    assert.equal(parseNumericInput('1,000'), 1000);
    assert.equal(parseNumericInput(''), null);
});

test('buy normal custom price is valid and computes order value', () => {
    const result = validateOrder(baseValues(), baseContext());
    assert.equal(result.isValid, true);
    assert.equal(result.effectivePrice, 1000);
    assert.equal(result.orderValue, 10_000);
});

test('market price order uses live price as effective price', () => {
    const result = validateOrder(baseValues({priceType: 'MARKET', price: ''}), baseContext());
    assert.equal(result.isValid, true);
    assert.equal(result.effectivePrice, 1200);
    assert.equal(result.orderValue, 12_000);
});

test('market price order fails when live price unavailable', () => {
    const result = validateOrder(
        baseValues({priceType: 'MARKET', price: ''}),
        baseContext({livePrice: null})
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.price);
});

test('invalid quantity (non-integer) is rejected', () => {
    const result = validateOrder(baseValues({quantity: '10.5'}), baseContext());
    assert.equal(result.isValid, false);
    assert.ok(result.errors.quantity);
});

test('invalid price (zero) is rejected', () => {
    const result = validateOrder(baseValues({price: '0'}), baseContext());
    assert.equal(result.isValid, false);
    assert.ok(result.errors.price);
});

test('sell within holdings is valid', () => {
    const result = validateOrder(
        baseValues({side: 'SELL', quantity: '50'}),
        baseContext({availableToSell: 100})
    );
    assert.equal(result.isValid, true);
});

test('sell exceeding holdings fails', () => {
    const result = validateOrder(
        baseValues({side: 'SELL', quantity: '150'}),
        baseContext({availableToSell: 100})
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.quantity);
});

test('sell with zero holdings fails', () => {
    const result = validateOrder(
        baseValues({side: 'SELL', quantity: '1'}),
        baseContext({availableToSell: 0})
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.quantity);
});

test('sell with unknown holdings is blocked (no unlimited selling)', () => {
    const result = validateOrder(
        baseValues({side: 'SELL', quantity: '1'}),
        baseContext({availableToSell: null})
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.general);
});

test('conditional sell exceeding holdings still fails', () => {
    const result = validateOrder(
        baseValues({side: 'SELL', orderType: 'CONDITIONAL', quantity: '150', triggerPrice: '900'}),
        baseContext({availableToSell: 100})
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.quantity);
});

test('conditional order requires a positive trigger price', () => {
    const result = validateOrder(
        baseValues({orderType: 'CONDITIONAL', triggerPrice: ''}),
        baseContext()
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.triggerPrice);
});

test('buy exceeding buying power fails', () => {
    const result = validateOrder(
        baseValues({quantity: '1000', price: '1000'}),
        baseContext({buyingPower: 100})
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.general);
});
