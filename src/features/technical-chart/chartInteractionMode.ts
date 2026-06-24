import type {IChartApi} from 'lightweight-charts';
import type {DrawingToolId} from './chartConfig';

export const applyChartInteractionMode = (
    chart: IChartApi,
    activeDrawingTool: DrawingToolId,
    blockChartPan: boolean
) => {
    const allowChartPan = activeDrawingTool === 'cursor' && !blockChartPan;

    chart.applyOptions({
        handleScroll: {
            mouseWheel: allowChartPan,
            pressedMouseMove: allowChartPan,
            horzTouchDrag: allowChartPan,
            vertTouchDrag: allowChartPan,
        },
    });
};
