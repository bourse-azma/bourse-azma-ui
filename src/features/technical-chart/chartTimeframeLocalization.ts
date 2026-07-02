import type {IChartApi} from 'lightweight-charts';
import {
    buildChartLocalization,
    buildTickMarkFormatter,
    clearWeeklyPeriodLabels,
    syncWeeklyPeriodLabels,
} from './chartLocalization';
import type {ChartTimeframe} from './chartConfig';
import type {ChartBar} from './chartBarTypes';

export const applyTimeframeLocalization = (chart: IChartApi, timeframe: ChartTimeframe, bars: ChartBar[]) => {
    if (timeframe === '1W') {
        syncWeeklyPeriodLabels(bars);
    } else {
        clearWeeklyPeriodLabels();
    }
    chart.applyOptions({
        localization: buildChartLocalization(timeframe),
        timeScale: {
            tickMarkFormatter: buildTickMarkFormatter(timeframe),
        },
    });
};
