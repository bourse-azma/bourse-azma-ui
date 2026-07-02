import {type ChartOptions, ColorType, CrosshairMode, type DeepPartial} from 'lightweight-charts';
import type {ChartTimeframe} from './chartConfig';
import {buildChartLocalization, buildTickMarkFormatter} from './chartLocalization';

const readCssHsl = (variableName: string, fallback: string) => {
    if (typeof document === 'undefined') {
        return fallback;
    }

    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    if (!value) {
        return fallback;
    }

    return `hsl(${value})`;
};

export const chartColors = () => ({
    background: readCssHsl('--surface-2', '#1a1f2e'),
    text: readCssHsl('--muted', '#9aa3b5'),
    grid: readCssHsl('--border', '#3a4254'),
    positive: readCssHsl('--positive', '#22c55e'),
    negative: readCssHsl('--negative', '#ef4444'),
    primary: readCssHsl('--primary', '#3b82f6'),
});

export const buildLightweightChartOptions = (
    width: number,
    height: number,
    timeframe: ChartTimeframe = '1D'
): DeepPartial<ChartOptions> => {
    const colors = chartColors();

    return {
        width,
        height,
        layout: {
            background: {type: ColorType.Solid, color: colors.background},
            textColor: colors.text,
            fontFamily: 'Vazirmatn, sans-serif',
            attributionLogo: false,
        },
        grid: {
            vertLines: {color: colors.grid},
            horzLines: {color: colors.grid},
        },
        localization: buildChartLocalization(timeframe),
        rightPriceScale: {
            borderColor: colors.grid,
        },
        timeScale: {
            borderColor: colors.grid,
            timeVisible: true,
            secondsVisible: false,
            barSpacing: 10,
            minBarSpacing: 6,
            tickMarkFormatter: buildTickMarkFormatter(timeframe),
        },
        crosshair: {
            mode: CrosshairMode.Normal,
        },
        handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
        },
    };
};

export const buildCandlestickSeriesOptions = () => {
    const colors = chartColors();
    return {
        upColor: colors.positive,
        downColor: colors.negative,
        borderUpColor: colors.positive,
        borderDownColor: colors.negative,
        wickUpColor: colors.positive,
        wickDownColor: colors.negative,
        autoscaleInfoProvider: (original: () => { priceRange: { minValue: number; maxValue: number } } | null) => {
            const info = original();
            if (!info) {
                return info;
            }
            return {
                ...info,
                priceRange: {
                    ...info.priceRange,
                    minValue: Math.max(0, info.priceRange.minValue),
                },
            };
        },
    };
};
