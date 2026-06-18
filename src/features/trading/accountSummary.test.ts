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
        [{side: 'BUY', quantity: 100, orderPrice: 5000, status: 'REQUESTED'}]
    );

    assert.equal(summary.customerBalance, 1_000_000);
    assert.equal(summary.portfolioValue, 12_000 * 8_050 + 45_000 * 20_030);
    assert.equal(summary.netAssets, summary.portfolioValue + summary.customerBalance);
    assert.equal(summary.blockedAmount, 500_000);
    assert.equal(summary.buyingPower, 500_000);
});
