import {useCallback, useEffect, useRef, useState} from 'react';
import {CandlestickSeries, createChart, HistogramSeries, type IChartApi, type ISeriesApi} from 'lightweight-charts';
import {DrawingManager} from 'lightweight-charts-drawing';
import {attachChartDrawingInteraction} from '../chartDrawingInteraction';
import {applyChartInteractionMode} from '../chartInteractionMode';
import {applyTimeframeLocalization} from '../chartTimeframeLocalization';
import {clearChartBarCache, fetchChartBars} from '../chartDataService';
import {type ChartTimeframe, DRAWING_TOOLS, type DrawingToolId} from '../chartConfig';
import {buildCandlestickSeriesOptions, buildLightweightChartOptions, chartColors} from '../chartTheme';
import {importDrawingsFactory, loadDrawings} from '../drawingStorage';
import type {ChartBar} from '../chartBarTypes';
import {toCandlestickData, toVolumeData} from '../chartBarExport';
import {applyChartViewport} from '../chartViewport';
import {isAbortError, measureChartSize, waitForChartContainer} from '../chartPanelUtils';
import {liveBarPollIntervalMs, pollAndUpdateLiveBar} from '../liveBarPolling';

type UseChartLifecycleParams = {
    instrumentCode: string | null;
    retryKey: number;
    timeframe: ChartTimeframe;
    activeDrawingTool: DrawingToolId;
    isPlacingDrawing: boolean;
    selectedDrawing: import('lightweight-charts-drawing').IDrawing | null;
    drawingManagerRef: React.MutableRefObject<DrawingManager | null>;
    setSelectedDrawing: (drawing: import('lightweight-charts-drawing').IDrawing | null) => void;
    setIsPlacingDrawing: (value: boolean) => void;
    setActiveDrawingTool: (tool: DrawingToolId) => void;
    persistDrawings: () => void;
    onLoadingChange: (loading: boolean) => void;
    onError: (error: string | null) => void;
    onEmptyData: (empty: boolean) => void;
    onDataReady: (ready: boolean) => void;
    dataReady: boolean;
};

export function useChartLifecycle({
                                      instrumentCode,
                                      retryKey,
                                      timeframe,
                                      activeDrawingTool,
                                      isPlacingDrawing,
                                      selectedDrawing,
                                      drawingManagerRef,
                                      setSelectedDrawing,
                                      setIsPlacingDrawing,
                                      setActiveDrawingTool,
                                      persistDrawings,
                                      onLoadingChange,
                                      onError,
                                      onEmptyData,
                                      onDataReady,
                                      dataReady,
                                  }: UseChartLifecycleParams) {
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const barsRef = useRef<ChartBar[]>([]);
    const activeDrawingToolRef = useRef<DrawingToolId>('cursor');
    const timeframeRef = useRef<ChartTimeframe>('1D');
    const [chartMounted, setChartMounted] = useState(false);

    const onLoadingChangeRef = useRef(onLoadingChange);
    const onErrorRef = useRef(onError);
    const onEmptyDataRef = useRef(onEmptyData);
    const onDataReadyRef = useRef(onDataReady);
    const setSelectedDrawingRef = useRef(setSelectedDrawing);
    const setIsPlacingDrawingRef = useRef(setIsPlacingDrawing);
    const setActiveDrawingToolRef = useRef(setActiveDrawingTool);
    const persistDrawingsRef = useRef(persistDrawings);

    onLoadingChangeRef.current = onLoadingChange;
    onErrorRef.current = onError;
    onEmptyDataRef.current = onEmptyData;
    onDataReadyRef.current = onDataReady;
    setSelectedDrawingRef.current = setSelectedDrawing;
    setIsPlacingDrawingRef.current = setIsPlacingDrawing;
    setActiveDrawingToolRef.current = setActiveDrawingTool;
    persistDrawingsRef.current = persistDrawings;

    const restoreDrawings = useCallback((code: string) => {
        const manager = drawingManagerRef.current;
        if (!manager) return;
        manager.clearAll();
        const saved = loadDrawings(code);
        if (saved.length > 0) {
            manager.importDrawings(saved, importDrawingsFactory);
        }
    }, [drawingManagerRef]);

    useEffect(() => {
        timeframeRef.current = timeframe;
    }, [timeframe]);

    useEffect(() => {
        activeDrawingToolRef.current = activeDrawingTool;
        const tool = DRAWING_TOOLS.find((item) => item.id === activeDrawingTool);
        drawingManagerRef.current?.setActiveTool(tool?.toolType ?? null);
    }, [activeDrawingTool, drawingManagerRef]);

    useEffect(() => {
        if (!chartRef.current) return;
        applyChartInteractionMode(chartRef.current, activeDrawingTool, isPlacingDrawing || selectedDrawing !== null);
    }, [activeDrawingTool, isPlacingDrawing, selectedDrawing]);

    useEffect(() => {
        if (!instrumentCode) return;

        let disposed = false;
        let detachDrawingInteraction: (() => void) | undefined;
        let resizeObserver: ResizeObserver | undefined;

        const mount = async () => {
            onLoadingChangeRef.current(true);
            onErrorRef.current(null);
            onEmptyDataRef.current(false);
            onDataReadyRef.current(false);
            setSelectedDrawingRef.current(null);
            setChartMounted(false);
            barsRef.current = [];

            const container = await waitForChartContainer(() => chartContainerRef.current, () => disposed);
            if (disposed) return;
            if (!container) {
                onErrorRef.current('بارگذاری نمودار تکنیکال ناموفق بود. لطفاً دوباره تلاش کنید.');
                onLoadingChangeRef.current(false);
                return;
            }

            const {width, height} = measureChartSize(container);
            const chart = createChart(container, buildLightweightChartOptions(width, height, timeframeRef.current));
            const candleSeries = chart.addSeries(CandlestickSeries, buildCandlestickSeriesOptions());
            const volumeSeries = chart.addSeries(HistogramSeries, {
                priceFormat: {type: 'volume'},
                priceScaleId: 'volume',
            });
            chart.priceScale('volume').applyOptions({scaleMargins: {top: 0.8, bottom: 0}});
            chart.priceScale('right').applyOptions({scaleMargins: {top: 0.1, bottom: 0.25}});

            const drawingManager = new DrawingManager();
            drawingManager.attach(chart, candleSeries, container);
            drawingManagerRef.current = drawingManager;
            restoreDrawings(instrumentCode);

            detachDrawingInteraction = attachChartDrawingInteraction({
                chart,
                series: candleSeries,
                container,
                drawingManager,
                getActiveTool: () => {
                    const tool = DRAWING_TOOLS.find((item) => item.id === activeDrawingToolRef.current);
                    return tool?.toolType ?? null;
                },
                lineColor: chartColors().primary,
                onPlacementActiveChange: (active) => setIsPlacingDrawingRef.current(active),
                onDrawingCreated: (drawingId) => {
                    setActiveDrawingToolRef.current('cursor');
                    drawingManager.selectDrawing(drawingId);
                    setSelectedDrawingRef.current(drawingManager.getDrawing(drawingId) ?? null);
                    persistDrawingsRef.current();
                },
                onDrawingRemoved: () => {
                    setSelectedDrawingRef.current(drawingManager.getSelectedDrawing());
                    persistDrawingsRef.current();
                },
                onDrawingUpdated: () => persistDrawingsRef.current(),
                onSelectionChanged: (drawing) => setSelectedDrawingRef.current(drawing),
            });

            chartRef.current = chart;
            candleSeriesRef.current = candleSeries;
            volumeSeriesRef.current = volumeSeries;

            resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;
                const nextSize = entry.contentRect;
                if (nextSize.width > 0 && nextSize.height > 0) {
                    chart.applyOptions({width: nextSize.width, height: nextSize.height});
                    if (barsRef.current.length > 0) {
                        applyChartViewport(chart, barsRef.current.length, timeframeRef.current);
                    }
                }
            });
            resizeObserver.observe(container);
            setChartMounted(true);
        };

        void mount();

        return () => {
            disposed = true;
            detachDrawingInteraction?.();
            resizeObserver?.disconnect();
            drawingManagerRef.current?.detach();
            chartRef.current?.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            volumeSeriesRef.current = null;
            drawingManagerRef.current = null;
            barsRef.current = [];
            setChartMounted(false);
        };
    }, [instrumentCode, retryKey, drawingManagerRef, restoreDrawings]);

    useEffect(() => {
        if (!instrumentCode || !chartMounted || !chartRef.current) return;

        const controller = new AbortController();
        let disposed = false;

        const loadBars = async () => {
            onLoadingChangeRef.current(true);
            onErrorRef.current(null);
            onEmptyDataRef.current(false);
            onDataReadyRef.current(false);
            clearChartBarCache(instrumentCode);

            try {
                const bars = await fetchChartBars(instrumentCode, timeframe, controller.signal);
                if (disposed) return;

                barsRef.current = bars;
                const chart = chartRef.current;
                const candleSeries = candleSeriesRef.current;
                const volumeSeries = volumeSeriesRef.current;
                if (!chart || !candleSeries || !volumeSeries) return;

                if (bars.length === 0) {
                    candleSeries.setData([]);
                    volumeSeries.setData([]);
                    onEmptyDataRef.current(true);
                    onLoadingChangeRef.current(false);
                    return;
                }

                const colors = chartColors();
                candleSeries.setData(toCandlestickData(bars, timeframe));
                volumeSeries.setData(toVolumeData(bars, colors.positive, colors.negative, timeframe));
                applyTimeframeLocalization(chart, timeframe, bars);
                applyChartViewport(chart, bars.length, timeframe);
                onDataReadyRef.current(true);
                onLoadingChangeRef.current(false);
            } catch (loadError) {
                if (disposed || isAbortError(loadError)) return;
                onErrorRef.current(
                    loadError instanceof Error ? loadError.message : 'بارگذاری داده‌های نمودار ناموفق بود.'
                );
                onLoadingChangeRef.current(false);
            }
        };

        void loadBars();
        return () => {
            disposed = true;
            controller.abort();
        };
    }, [instrumentCode, timeframe, retryKey, chartMounted]);

    useEffect(() => {
        if (!instrumentCode || !dataReady || timeframe !== '1D' || barsRef.current.length === 0) return;

        const pollLiveBar = async () => {
            try {
                await pollAndUpdateLiveBar(instrumentCode, {
                    barsRef,
                    candleSeriesRef,
                    volumeSeriesRef,
                });
            } catch {
                // Ignore transient polling errors.
            }
        };

        void pollLiveBar();
        const timerId = window.setInterval(pollLiveBar, liveBarPollIntervalMs);
        return () => window.clearInterval(timerId);
    }, [instrumentCode, timeframe, retryKey, dataReady]);

    return chartContainerRef;
}
