import assert from 'node:assert/strict';
import test from 'node:test';
import {computeAccountSummary} from './accountSummary.ts';

test('net assets equals portfolio value plus customer balance', () => {
    const summary = computeAccountSummary(
        '1000000',
        [
            {quantity: 12000, buyPrice: 7326, livePrice: 8050},
            {quantity: 45000, buyPrice: 18828, livePrice: 20030},
        ],
        [{side: 'BUY', quantity: 100, remainingQuantity: 100, orderPrice: 5000, status: 'REQUESTED'}]
    );

    assert.equal(summary.customerBalance, 1_000_000);
    assert.equal(summary.portfolioValue, 12_000 * 8_050 + 45_000 * 20_030);
    assert.equal(summary.netAssets, summary.portfolioValue + summary.customerBalance);
    assert.equal(summary.blockedAmount, 500_000);
    assert.equal(summary.buyingPower, 500_000);
    assert.notEqual(summary.buyingPower, summary.customerBalance);
});

test('customer balance stays as wallet total when blocked exceeds buying power', () => {
    const summary = computeAccountSummary(
        1_000_000,
        [],
        [{
            side: 'BUY',
            quantity: 10_000,
            remainingQuantity: 10_000,
            orderPrice: 7929,
            orderValue: 79_290_000,
            status: 'REQUESTED'
        }]
    );

    assert.equal(summary.customerBalance, 1_000_000);
    assert.equal(summary.blockedAmount, 79_290_000);
    assert.equal(summary.buyingPower, 0);
});

test('blocked amount uses remaining quantity for partially filled orders', () => {
    const summary = computeAccountSummary(
        2_000_000,
        [],
        [{side: 'BUY', quantity: 100, remainingQuantity: 60, orderPrice: 5000, status: 'PARTIALLY_FILLED'}]
    );

    assert.equal(summary.blockedAmount, 300_000);
    assert.equal(summary.buyingPower, 1_700_000);
    assert.equal(summary.customerBalance, 2_000_000);
});

test('blocked amount accepts lowercase side and status from API payloads', () => {
    const summary = computeAccountSummary(
        1_000_000,
        [],
        [{side: 'buy', quantity: 50, remainingQuantity: 50, orderPrice: 4000, status: 'requested'}]
    );

    assert.equal(summary.blockedAmount, 200_000);
    assert.equal(summary.buyingPower, 800_000);
    assert.equal(summary.customerBalance, 1_000_000);
});

test('cancelled and completed orders do not count as blocked', () => {
    const summary = computeAccountSummary(
        1_000_000,
        [],
        [
            {side: 'BUY', quantity: 100, remainingQuantity: 0, orderPrice: 5000, status: 'COMPLETED'},
            {side: 'BUY', quantity: 100, remainingQuantity: 0, orderPrice: 5000, status: 'CANCELLED'},
        ]
    );

    assert.equal(summary.blockedAmount, 0);
    assert.equal(summary.buyingPower, 1_000_000);
});
