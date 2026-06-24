export type ChartTimeframe = '1D' | '1W' | '1M' | '12M';

export type ChartTimeframeOption = {
    id: ChartTimeframe;
    label: string;
};

export const CHART_TIMEFRAMES: ChartTimeframeOption[] = [
    {id: '1D', label: 'روزانه'},
    {id: '1W', label: 'هفتگی'},
    {id: '1M', label: 'ماهانه'},
    {id: '12M', label: 'سالانه'},
];

/** Default number of recent bars visible on first load (avoids over-zoomed daily view). */
export const VISIBLE_BARS_BY_TIMEFRAME: Record<ChartTimeframe, number> = {
    '1D': 60,
    '1W': 48,
    '1M': 24,
    '12M': 16,
};

export type DrawingToolId = 'cursor' | 'trend-line' | 'horizontal-line' | 'fib-retracement';

export type DrawingToolOption = {
    id: DrawingToolId;
    label: string;
    toolType: string | null;
};

export const DRAWING_TOOLS: DrawingToolOption[] = [
    {id: 'cursor', label: 'مکان‌نما', toolType: null},
    {id: 'trend-line', label: 'خط روند', toolType: 'trend-line'},
    {id: 'horizontal-line', label: 'خط افقی', toolType: 'horizontal-line'},
    {id: 'fib-retracement', label: 'فیبوناچی', toolType: 'fib-retracement'},
];
