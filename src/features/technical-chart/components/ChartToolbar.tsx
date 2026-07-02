import {Trash2, X} from 'lucide-react';
import type {IDrawing} from 'lightweight-charts-drawing';
import {CHART_TIMEFRAMES, type ChartTimeframe, DRAWING_TOOLS, type DrawingToolId} from '../chartConfig';
import {drawingToolIcon} from '../chartPanelUtils';

type ChartToolbarProps = {
    symbol: string;
    symbolName: string;
    timeframe: ChartTimeframe;
    activeDrawingTool: DrawingToolId;
    selectedDrawing: IDrawing | null;
    onTimeframeChange: (timeframe: ChartTimeframe) => void;
    onDrawingToolChange: (tool: DrawingToolId) => void;
    onDeleteSelected: () => void;
    onClearAll: () => void;
    onStyleChange: (patch: { lineColor?: string; lineWidth?: number }) => void;
};

export function ChartToolbar({
                                 symbol,
                                 symbolName,
                                 timeframe,
                                 activeDrawingTool,
                                 selectedDrawing,
                                 onTimeframeChange,
                                 onDrawingToolChange,
                                 onDeleteSelected,
                                 onClearAll,
                                 onStyleChange,
                             }: ChartToolbarProps) {
    return (
        <div className="border-b border-border/60 bg-surface-2/95 px-2 py-2">
            <div className="mb-2 px-1 text-[11px] text-muted">
                <span className="truncate font-medium text-text">
                    {symbol}
                    {symbolName ? ` · ${symbolName}` : ''}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
                <div className="flex gap-1 rounded-lg border border-border/60 bg-surface p-0.5">
                    {CHART_TIMEFRAMES.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onTimeframeChange(item.id)}
                            className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                                timeframe === item.id ? 'bg-primary/15 text-primary' : 'text-muted hover:text-text'
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
                                onClick={() => onDrawingToolChange(item.id)}
                                className={`rounded-md p-1.5 transition ${
                                    activeDrawingTool === item.id ? 'bg-primary/15 text-primary' : 'text-muted hover:text-text'
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
                        onClick={onDeleteSelected}
                        className="rounded-md p-1.5 text-muted transition hover:text-negative disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                    <button
                        type="button"
                        title="پاک کردن همه"
                        onClick={onClearAll}
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
                            onChange={(event) => onStyleChange({lineColor: event.target.value})}
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
                            onChange={(event) => onStyleChange({lineWidth: Number(event.target.value)})}
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
    );
}
