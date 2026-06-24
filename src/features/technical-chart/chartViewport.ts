import type {IChartApi} from 'lightweight-charts';
import {type ChartTimeframe, VISIBLE_BARS_BY_TIMEFRAME} from './chartConfig';

export const applyChartViewport = (
    chart: IChartApi,
    barCount: number,
    timeframe: ChartTimeframe
) => {
    if (barCount <= 0) {
        return;
    }

    const targetVisibleBars = VISIBLE_BARS_BY_TIMEFRAME[timeframe];
    const visibleBars = Math.min(targetVisibleBars, barCount);

    if (visibleBars >= barCount) {
        chart.timeScale().fitContent();
        return;
    }

    chart.timeScale().setVisibleLogicalRange({
        from: barCount - visibleBars - 0.5,
        to: barCount - 0.5,
    });
};
