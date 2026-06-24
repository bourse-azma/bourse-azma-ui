import {useCallback, useEffect, useRef, useState} from 'react';
import {CandlestickSeries, createChart, HistogramSeries, type IChartApi, type ISeriesApi,} from 'lightweight-charts';
import {DrawingManager, type IDrawing} from 'lightweight-charts-drawing';
import {Minus, MousePointer2, Trash2, TrendingUp, Waves, X} from 'lucide-react';
import {appConfig} from '../../config/appConfig';
import {getTsetmcClosingPriceInfo} from '../symbol-search/api';
import {ORDERBOOK_SLOT_HEIGHT_CLASS} from '../symbol-search/PeerGroupPanel';
import {clearChartBarCache, fetchChartBars} from './chartDataService';
import {CHART_TIMEFRAMES, type ChartTimeframe, DRAWING_TOOLS, type DrawingToolId,} from './chartConfig';
import {
    buildChartLocalization,
    buildTickMarkFormatter,
    clearWeeklyPeriodLabels,
    syncWeeklyPeriodLabels
} from './chartLocalization';
import {applyChartInteractionMode} from './chartInteractionMode';
import {attachChartDrawingInteraction} from './chartDrawingInteraction';
import {buildCandlestickSeriesOptions, buildLightweightChartOptions, chartColors,} from './chartTheme';
import {importDrawingsFactory, loadDrawings, saveDrawings} from './drawingStorage';
import {type ChartBar, toCandlestickData, toVolumeData} from './mapChartBars';
import {applyChartViewport} from './chartViewport';

type TechnicalChartPanelProps = {
    instrumentCode: string | null;
    symbol: string;
    symbolName: string;
};

const panelShellClass = `flex ${ORDERBOOK_SLOT_HEIGHT_CLASS} flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-2`;

const drawingToolIcon = (toolId: DrawingToolId) => {
    switch (toolId) {
        case 'cursor':
            return MousePointer2;
        case 'trend-line':
            return TrendingUp;
        case 'horizontal-line':
            return Minus;
        case 'fib-retracement':
            return Waves;
    }
};

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

const measureChartSize = (container: HTMLElement) => {
    const width = container.clientWidth || container.parentElement?.clientWidth || 320;
    const height = container.clientHeight || container.parentElement?.clientHeight || 360;
    return {width: Math.max(width, 200), height: Math.max(height, 200)};
};

const waitForChartContainer = async (
    getContainer: () => HTMLDivElement | null,
    isDisposed: () => boolean
) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        if (isDisposed()) {
            return null;
        }

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });

        const container = getContainer();
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            return container;
        }
    }

    return getContainer();
};

const applyTimeframeLocalization = (chart: IChartApi, timeframe: ChartTimeframe, bars: ChartBar[]) => {
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

export default function TechnicalChartPanel({
                                                instrumentCode,
                                                symbol,
                                                symbolName,
                                            }: TechnicalChartPanelProps) {
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const drawingManagerRef = useRef<DrawingManager | null>(null);
    const barsRef = useRef<ChartBar[]>([]);
    const activeDrawingToolRef = useRef<DrawingToolId>('cursor');
    const timeframeRef = useRef<ChartTimeframe>('1D');
    const instrumentCodeRef = useRef<string | null>(instrumentCode);

    const [timeframe, setTimeframe] = useState<ChartTimeframe>('1D');
    const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolId>('cursor');
    const [selectedDrawing, setSelectedDrawing] = useState<IDrawing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [emptyData, setEmptyData] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [dataReady, setDataReady] = useState(false);
    const [chartMounted, setChartMounted] = useState(false);
    const [isPlacingDrawing, setIsPlacingDrawing] = useState(false);

    const persistDrawings = useCallback(() => {
        const code = instrumentCodeRef.current;
        const manager = drawingManagerRef.current;
        if (!code || !manager) {
            return;
        }
        saveDrawings(code, manager.exportDrawings());
    }, []);

    const restoreDrawings = useCallback((code: string) => {
        const manager = drawingManagerRef.current;
        if (!manager) {
            return;
        }
        manager.clearAll();
        const saved = loadDrawings(code);
        if (saved.length > 0) {
            manager.importDrawings(saved, importDrawingsFactory);
        }
    }, []);

    const deleteSelectedDrawing = useCallback(() => {
        const manager = drawingManagerRef.current;
        const selected = manager?.getSelectedDrawing();
        if (!manager || !selected) {
            return;
        }
        manager.removeDrawing(selected.id);
        setSelectedDrawing(null);
        persistDrawings();
    }, [persistDrawings]);

    const clearAllDrawings = useCallback(() => {
        const manager = drawingManagerRef.current;
        if (!manager || manager.getAllDrawings().length === 0) {
            return;
        }
        manager.clearAll();
        setSelectedDrawing(null);
        persistDrawings();
    }, [persistDrawings]);

    const updateSelectedDrawingStyle = useCallback(
        (patch: { lineColor?: string; lineWidth?: number }) => {
            const drawing = drawingManagerRef.current?.getSelectedDrawing();
            if (!drawing) {
                return;
            }
            drawing.updateStyle(patch);
            drawing.requestUpdate();
            setSelectedDrawing(drawingManagerRef.current?.getSelectedDrawing() ?? null);
            persistDrawings();
        },
        [persistDrawings]
    );

    useEffect(() => {
        timeframeRef.current = timeframe;
    }, [timeframe]);

    useEffect(() => {
        instrumentCodeRef.current = instrumentCode;
    }, [instrumentCode]);

    useEffect(() => {
        if (!instrumentCode) {
            return;
        }

        let disposed = false;
        let detachDrawingInteraction: (() => void) | undefined;
        let resizeObserver: ResizeObserver | undefined;

        const mount = async () => {
            setLoading(true);
            setError(null);
            setEmptyData(false);
            setDataReady(false);
            setSelectedDrawing(null);
            setChartMounted(false);
            barsRef.current = [];

            const container = await waitForChartContainer(
                () => chartContainerRef.current,
                () => disposed
            );
            if (disposed) {
                return;
            }
            if (!container) {
                setError('بارگذاری نمودار تکنیکال ناموفق بود. لطفاً دوباره تلاش کنید.');
                setLoading(false);
                return;
            }

            const {width, height} = measureChartSize(container);
            const chart = createChart(
                container,
                buildLightweightChartOptions(width, height, timeframeRef.current)
            );
            const candleSeries = chart.addSeries(CandlestickSeries, buildCandlestickSeriesOptions());
            const volumeSeries = chart.addSeries(HistogramSeries, {
                priceFormat: {type: 'volume'},
                priceScaleId: 'volume',
            });
            chart.priceScale('volume').applyOptions({
                scaleMargins: {top: 0.8, bottom: 0},
            });
            chart.priceScale('right').applyOptions({
                scaleMargins: {top: 0.1, bottom: 0.25},
            });

            const drawingManager = new DrawingManager();
            drawingManager.attach(chart, candleSeries, container);
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
                onPlacementActiveChange: setIsPlacingDrawing,
                onDrawingCreated: (drawingId) => {
                    setActiveDrawingTool('cursor');
                    drawingManager.selectDrawing(drawingId);
                    setSelectedDrawing(drawingManager.getDrawing(drawingId) ?? null);
                    persistDrawings();
                },
                onDrawingRemoved: () => {
                    setSelectedDrawing(drawingManager.getSelectedDrawing());
                    persistDrawings();
                },
                onDrawingUpdated: persistDrawings,
                onSelectionChanged: (drawing) => {
                    setSelectedDrawing(drawing);
                },
            });

            chartRef.current = chart;
            candleSeriesRef.current = candleSeries;
            volumeSeriesRef.current = volumeSeries;
            drawingManagerRef.current = drawingManager;

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
    }, [instrumentCode, retryKey, persistDrawings, restoreDrawings]);

    useEffect(() => {
        if (!instrumentCode || !chartMounted || !chartRef.current) {
            return;
        }

        const controller = new AbortController();
        let disposed = false;

        const loadBars = async () => {
            setLoading(true);
            setError(null);
            setEmptyData(false);
            setDataReady(false);
            clearChartBarCache(instrumentCode);

            try {
                const bars = await fetchChartBars(instrumentCode, timeframe, controller.signal);
                if (disposed) {
                    return;
                }

                barsRef.current = bars;
                const chart = chartRef.current;
                const candleSeries = candleSeriesRef.current;
                const volumeSeries = volumeSeriesRef.current;

                if (!chart || !candleSeries || !volumeSeries) {
                    return;
                }

                if (bars.length === 0) {
                    candleSeries.setData([]);
                    volumeSeries.setData([]);
                    setEmptyData(true);
                    setLoading(false);
                    return;
                }

                const colors = chartColors();
                candleSeries.setData(toCandlestickData(bars, timeframe));
                volumeSeries.setData(toVolumeData(bars, colors.positive, colors.negative, timeframe));
                applyTimeframeLocalization(chart, timeframe, bars);
                applyChartViewport(chart, bars.length, timeframe);
                setDataReady(true);
                setLoading(false);
            } catch (loadError) {
                if (disposed || isAbortError(loadError)) {
                    return;
                }
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'بارگذاری داده‌های نمودار ناموفق بود.'
                );
                setLoading(false);
            }
        };

        void loadBars();

        return () => {
            disposed = true;
            controller.abort();
        };
    }, [instrumentCode, timeframe, retryKey, chartMounted]);

    useEffect(() => {
        if (!instrumentCode || !dataReady || timeframe !== '1D' || barsRef.current.length === 0) {
            return;
        }

        const pollLiveBar = async () => {
            try {
                const live = await getTsetmcClosingPriceInfo(instrumentCode);
                const bars = barsRef.current;
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

                const updatedBar: ChartBar = {
                    ...lastBar,
                    open,
                    high,
                    low,
                    close,
                    volume,
                };
                barsRef.current = [...bars.slice(0, -1), updatedBar];

                const colors = chartColors();
                candleSeriesRef.current?.update(toCandlestickData([updatedBar])[0]);
                volumeSeriesRef.current?.update(toVolumeData([updatedBar], colors.positive, colors.negative)[0]);
            } catch {
                // Ignore transient polling errors.
            }
        };

        void pollLiveBar();
        const timerId = window.setInterval(pollLiveBar, appConfig.tsetmcChartRefreshMs);
        return () => window.clearInterval(timerId);
    }, [instrumentCode, timeframe, retryKey, dataReady]);

    useEffect(() => {
        activeDrawingToolRef.current = activeDrawingTool;
        const tool = DRAWING_TOOLS.find((item) => item.id === activeDrawingTool);
        drawingManagerRef.current?.setActiveTool(tool?.toolType ?? null);
    }, [activeDrawingTool]);

    useEffect(() => {
        if (!chartRef.current) {
            return;
        }
        applyChartInteractionMode(
            chartRef.current,
            activeDrawingTool,
            isPlacingDrawing || selectedDrawing !== null
        );
    }, [activeDrawingTool, isPlacingDrawing, selectedDrawing, chartMounted]);

    if (!instrumentCode) {
        return (
            <div className={`${panelShellClass} items-center justify-center px-4 text-center text-xs text-muted`}>
                نماد معتبر انتخاب نشده است.
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${panelShellClass} items-center justify-center px-4 text-center text-xs text-negative`}>
                <p className="font-medium">{error}</p>
                <button
                    type="button"
                    onClick={() => {
                        setError(null);
                        setLoading(true);
                        setRetryKey((value) => value + 1);
                    }}
                    className="mt-3 rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className={panelShellClass}>
            <div className="border-b border-border/60 bg-surface-2/95 px-2 py-2">
                <div className="mb-2 flex items-center justify-between gap-2 px-1 text-[11px] text-muted">
                    <span className="truncate font-medium text-text">
                        {symbol}
                        {symbolName ? ` · ${symbolName}` : ''}
                    </span>
                    <span className="shrink-0">تاریخ شمسی</span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                    <div className="flex gap-1 rounded-lg border border-border/60 bg-surface p-0.5">
                        {CHART_TIMEFRAMES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTimeframe(item.id)}
                                className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                                    timeframe === item.id
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-muted hover:text-text'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-0.5 rounded-lg border border-border/60 bg-surface p-0.5">
                        {DRAWING_TOOLS.map((item) => {
                            const Icon = drawingToolIcon(item.id);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    title={item.label}
                                    onClick={() => setActiveDrawingTool(item.id)}
                                    className={`rounded-md p-1.5 transition ${
                                        activeDrawingTool === item.id
                                            ? 'bg-primary/15 text-primary'
                                            : 'text-muted hover:text-text'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5"/>
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            title="حذف انتخاب‌شده"
                            disabled={!selectedDrawing}
                            onClick={deleteSelectedDrawing}
                            className="rounded-md p-1.5 text-muted transition hover:text-negative disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Trash2 className="h-3.5 w-3.5"/>
                        </button>
                        <button
                            type="button"
                            title="پاک کردن همه"
                            onClick={clearAllDrawings}
                            className="rounded-md p-1.5 text-muted transition hover:text-negative"
                        >
                            <X className="h-3.5 w-3.5"/>
                        </button>
                    </div>
                </div>

                {selectedDrawing ? (
                    <div
                        className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-surface px-2 py-1.5 text-[10px] text-muted">
                        <span className="font-medium text-text">ویرایش خط</span>
                        <label className="flex items-center gap-1">
                            رنگ
                            <input
                                type="color"
                                value={selectedDrawing.style.lineColor}
                                onChange={(event) =>
                                    updateSelectedDrawingStyle({lineColor: event.target.value})
                                }
                                className="h-5 w-8 cursor-pointer rounded border border-border/60 bg-transparent"
                            />
                        </label>
                        <label className="flex items-center gap-1">
                            ضخامت
                            <input
                                type="range"
                                min={1}
                                max={5}
                                value={selectedDrawing.style.lineWidth}
                                onChange={(event) =>
                                    updateSelectedDrawingStyle({lineWidth: Number(event.target.value)})
                                }
                                className="w-16"
                            />
                        </label>
                        <span className="text-[9px]">برای جابه‌جایی، نقاط خط را بکشید</span>
                    </div>
                ) : (
                    <p className="mt-1.5 px-1 text-[9px] text-muted">
                        برای ویرایش یا حذف، ابزار مکان‌نما را انتخاب کنید و روی خط کلیک کنید.
                    </p>
                )}
            </div>

            <div className="relative min-h-0 flex-1">
                {loading ? (
                    <div className="absolute inset-0 z-10 flex animate-pulse flex-col gap-2 p-4">
                        <div className="h-4 w-32 rounded bg-border/60"/>
                        <div className="flex-1 rounded bg-border/45"/>
                    </div>
                ) : null}
                {emptyData && !loading ? (
                    <div
                        className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-xs text-muted">
                        داده‌ای برای این بازه زمانی موجود نیست.
                    </div>
                ) : null}
                <div ref={chartContainerRef} className="h-full w-full min-h-[280px] [direction:ltr]"/>
            </div>
        </div>
    );
}
