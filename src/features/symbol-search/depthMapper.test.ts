import assert from 'node:assert/strict';
import test from 'node:test';
import {buildDepthRowsFromClientType} from './depthMapper.ts';
import type {TsetmcClientType} from './types.ts';

const shatranClientType: TsetmcClientType = {
    individualBuyVolume: 1_180_000_000,
    institutionalBuyVolume: 867_100_000,
    uncategorizedBuyVolume: null,
    individualBuyCount: 5535,
    institutionalBuyCount: 63,
    uncategorizedBuyCount: null,
    individualSellVolume: 1_390_000_000,
    institutionalSellVolume: 664_530_000,
    individualSellCount: 4383,
    institutionalSellCount: 47,
};

test('شتران: حقیقی counts exceed حقوقی', () => {
    const rows = buildDepthRowsFromClientType(shatranClientType);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.id, 'real');
    assert.equal(rows[0]?.label, 'حقیقی');
    assert.ok((rows[0]?.buyCount ?? 0) > (rows[1]?.buyCount ?? 0));
    assert.ok((rows[0]?.sellCount ?? 0) > (rows[1]?.sellCount ?? 0));
});

test('شتران: sell percentages sum to ~100%', () => {
    const rows = buildDepthRowsFromClientType(shatranClientType);
    const sellSum = (rows[0]?.sellPercent ?? 0) + (rows[1]?.sellPercent ?? 0);
    assert.ok(Math.abs(sellSum - 100) < 0.1);
    assert.ok(Math.abs((rows[0]?.sellPercent ?? 0) - 68) < 1);
});

test('وبملت: DDD volume included in buy total denominator', () => {
    const webmellat: TsetmcClientType = {
        individualBuyVolume: 15_410_000_000,
        institutionalBuyVolume: 5_570_000_000,
        uncategorizedBuyVolume: 100_000_000,
        individualBuyCount: 22723,
        institutionalBuyCount: 156,
        uncategorizedBuyCount: 5,
        individualSellVolume: 17_690_000_000,
        institutionalSellVolume: 3_300_000_000,
        individualSellCount: 15448,
        institutionalSellCount: 125,
    };
    const rows = buildDepthRowsFromClientType(webmellat);
    const withoutDdd = buildDepthRowsFromClientType({...webmellat, uncategorizedBuyVolume: null});
    assert.ok((rows[0]?.buyPercent ?? 0) < (withoutDdd[0]?.buyPercent ?? 0));
    assert.ok(Math.abs((rows[0]?.sellPercent ?? 0) - 84.3) < 1);
});

test('salam: institutional dominates sell side', () => {
    const salam: TsetmcClientType = {
        individualBuyVolume: 10_820_000,
        institutionalBuyVolume: 5_180_000,
        uncategorizedBuyVolume: null,
        individualBuyCount: 180,
        institutionalBuyCount: 8,
        uncategorizedBuyCount: null,
        individualSellVolume: 4_930_000,
        institutionalSellVolume: 11_060_000,
        individualSellCount: 137,
        institutionalSellCount: 5,
    };
    const rows = buildDepthRowsFromClientType(salam);
    assert.ok((rows[1]?.sellPercent ?? 0) > 65);
    assert.ok((rows[0]?.buyPercent ?? 0) > 65);
});
