import {useRef, useState} from 'react';
import {ChartToolbar} from './components/ChartToolbar';
import {useChartDrawings} from './hooks/useChartDrawings';
import {useChartLifecycle} from './hooks/useChartLifecycle';
import {panelShellClass} from './chartPanelUtils';
import type {ChartTimeframe, DrawingToolId} from './chartConfig';

type TechnicalChartPanelProps = {
    instrumentCode: string | null;
    symbol: string;
    symbolName: string;
};

export default function TechnicalChartPanel({instrumentCode, symbol, symbolName}: TechnicalChartPanelProps) {
    const instrumentCodeRef = useRef<string | null>(instrumentCode);
    instrumentCodeRef.current = instrumentCode;

    const [timeframe, setTimeframe] = useState<ChartTimeframe>('1D');
    const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolId>('cursor');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [emptyData, setEmptyData] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [dataReady, setDataReady] = useState(false);

    const drawings = useChartDrawings(instrumentCodeRef);

    const chartContainerRef = useChartLifecycle({
        instrumentCode,
        retryKey,
        timeframe,
        activeDrawingTool,
        isPlacingDrawing: drawings.isPlacingDrawing,
        selectedDrawing: drawings.selectedDrawing,
        drawingManagerRef: drawings.drawingManagerRef,
        setSelectedDrawing: drawings.setSelectedDrawing,
        setIsPlacingDrawing: drawings.setIsPlacingDrawing,
        setActiveDrawingTool,
        persistDrawings: drawings.persistDrawings,
        onLoadingChange: setLoading,
        onError: setError,
        onEmptyData: setEmptyData,
        onDataReady: setDataReady,
        dataReady,
    });

    if (!instrumentCode) {
        return (
            <div className={`${panelShellClass} items-center justify-center px-4 text-center text-xs text-muted`}>
                نماد معتبر انتخاب نشده است.
            </div>
        );
    }

    return (
        <div className={panelShellClass}>
            <ChartToolbar
                symbol={symbol}
                symbolName={symbolName}
                timeframe={timeframe}
                activeDrawingTool={activeDrawingTool}
                selectedDrawing={drawings.selectedDrawing}
                onTimeframeChange={setTimeframe}
                onDrawingToolChange={setActiveDrawingTool}
                onDeleteSelected={drawings.deleteSelectedDrawing}
                onClearAll={drawings.clearAllDrawings}
                onStyleChange={drawings.updateSelectedDrawingStyle}
            />

            <div className="relative min-h-0 flex-1">
                {loading ? (
                    <div className="absolute inset-0 z-10 flex animate-pulse flex-col gap-2 p-4">
                        <div className="h-4 w-32 rounded bg-border/60"/>
                        <div className="flex-1 rounded bg-border/45"/>
                    </div>
                ) : null}
                {error ? (
                    <div
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center text-xs text-negative">
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
                ) : null}
                {emptyData && !loading && !error ? (
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
