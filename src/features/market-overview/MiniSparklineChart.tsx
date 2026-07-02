import {
    AreaSeries,
    ColorType,
    createChart,
    type IChartApi,
    type ISeriesApi,
    type LineData,
    type UTCTimestamp
} from 'lightweight-charts';
import {useEffect, useRef} from 'react';
import type {SparklinePoint} from './types';

type MiniSparklineChartProps = {
    points: SparklinePoint[];
    positive?: boolean;
    height?: number;
    interactive?: boolean;
    className?: string;
};

export default function MiniSparklineChart({
                                               points,
                                               positive = true,
                                               height = 120,
                                               interactive = true,
                                               className = '',
                                           }: MiniSparklineChartProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const chart = createChart(container, {
            width: container.clientWidth,
            height,
            layout: {
                background: {type: ColorType.Solid, color: 'transparent'},
                textColor: 'rgba(255,255,255,0.45)',
                fontFamily: 'Vazirmatn, sans-serif',
                attributionLogo: false,
            },
            grid: {
                vertLines: {visible: false},
                horzLines: {visible: false},
            },
            rightPriceScale: {visible: false},
            leftPriceScale: {visible: false},
            timeScale: {visible: false},
            crosshair: {
                mode: interactive ? 1 : 0,
                vertLine: {visible: interactive, color: 'rgba(0,229,201,0.35)'},
                horzLine: {visible: interactive, color: 'rgba(0,229,201,0.35)'},
            },
            handleScroll: interactive,
            handleScale: interactive,
        });

        const lineColor = positive ? '#00E5C9' : '#FF6B7A';
        const areaTop = positive ? 'rgba(0,229,201,0.28)' : 'rgba(255,107,122,0.24)';
        const areaBottom = 'rgba(7,18,37,0)';

        const series = chart.addSeries(AreaSeries, {
            lineColor,
            topColor: areaTop,
            bottomColor: areaBottom,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });

        chartRef.current = chart;
        seriesRef.current = series;

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            chart.applyOptions({width: entry.contentRect.width});
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [height, interactive, positive]);

    useEffect(() => {
        const series = seriesRef.current;
        if (!series) return;

        const chartData: LineData<UTCTimestamp>[] = points.map((point) => ({
            time: Math.floor(point.time / 1000) as UTCTimestamp,
            value: point.value,
        }));

        if (chartData.length === 0) {
            series.setData([]);
            return;
        }

        series.setData(chartData);
        chartRef.current?.timeScale().fitContent();
    }, [points]);

    return (
        <div
            ref={containerRef}
            className={`w-full overflow-hidden rounded-lg ${className}`}
            style={{height}}
            aria-hidden={points.length === 0}
        />
    );
}
