import assert from 'node:assert/strict';
import test from 'node:test';
import {buildOrderSuccessDetails} from './orderSuccess.ts';
import type {CreateOrderResult} from '../api.ts';

const formatNumber = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : String(value);

const baseOrder = {
    id: 1,
    side: 'BUY' as const,
    sideLabel: 'خرید',
    symbol: 'فولاد',
    instrumentCode: 'IRO1FOLD0001',
    quantity: 100,
    remainingQuantity: 100,
    executedQuantity: 0,
    orderPrice: 5000,
    livePrice: 5000,
    averageExecutedPrice: null,
    orderTime: '2026-01-01T10:00:00Z',
    cancelledAt: null,
    status: 'REQUESTED' as const,
    statusLabel: 'در صف',
    cancellable: true,
};

test('buildOrderSuccessDetails reports queued order', () => {
    const result: CreateOrderResult = {order: baseOrder, trades: []};
    const details = buildOrderSuccessDetails(result, formatNumber);

    assert.equal(details.title, 'سفارش ثبت شد');
    assert.match(details.message, /فولاد/);
    assert.equal(details.tone, 'buy');
});

test('buildOrderSuccessDetails reports completed order', () => {
    const result: CreateOrderResult = {
        order: {
            ...baseOrder,
            status: 'COMPLETED',
            statusLabel: 'اجرا شده',
            executedQuantity: 100,
            remainingQuantity: 0,
        },
        trades: [{id: 1, quantity: 100, price: 5000, value: 500000, executedAt: '2026-01-01T10:00:01Z'}],
    };
    const details = buildOrderSuccessDetails(result, formatNumber);

    assert.equal(details.title, 'سفارش با موفقیت اجرا شد');
});
