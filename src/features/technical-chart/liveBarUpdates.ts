import type {ISeriesApi} from 'lightweight-charts';
import type {TsetmcClosingPriceInfo} from '../symbol-search/types';
import type {ChartBar} from './chartBarTypes';
import {toCandlestickData, toVolumeData} from './chartBarExport';
import {chartColors} from './chartTheme';

type LiveBarSeriesRefs = {
    barsRef: { current: ChartBar[] };
    candleSeriesRef: { current: ISeriesApi<'Candlestick'> | null };
    volumeSeriesRef: { current: ISeriesApi<'Histogram'> | null };
};

export const applyLiveBarUpdate = (live: TsetmcClosingPriceInfo, refs: LiveBarSeriesRefs) => {
    const bars = refs.barsRef.current;
    const lastBar = bars[bars.length - 1];
    if (!lastBar) return;

    const open = live.firstTradePrice ?? lastBar.open;
    const close = live.lastTradePrice ?? live.closingPrice ?? lastBar.close;
    const high = Math.max(
        live.dayMaxPrice ?? lastBar.high,
        live.lastTradePrice ?? lastBar.high,
        live.closingPrice ?? lastBar.high,
        lastBar.high
    );
    const low = Math.min(
        live.dayMinPrice ?? lastBar.low,
        live.lastTradePrice ?? lastBar.low,
        live.closingPrice ?? lastBar.low,
        lastBar.low
    );
    const volume = live.tradeVolume ?? lastBar.volume ?? 0;
    const updatedBar: ChartBar = {...lastBar, open, high, low, close, volume};
    refs.barsRef.current = [...bars.slice(0, -1), updatedBar];

    const colors = chartColors();
    refs.candleSeriesRef.current?.update(toCandlestickData([updatedBar])[0]);
    refs.volumeSeriesRef.current?.update(toVolumeData([updatedBar], colors.positive, colors.negative)[0]);
};
