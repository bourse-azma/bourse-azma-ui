import type {IChartApi, ISeriesApi} from 'lightweight-charts';
import {type Anchor, type DrawingManager, getToolRegistry, type IDrawing,} from 'lightweight-charts-drawing';

const PREVIEW_DRAWING_ID = '__chart-drawing-preview__';

type AttachChartDrawingInteractionOptions = {
    chart: IChartApi;
    series: ISeriesApi<'Candlestick'>;
    container: HTMLElement;
    drawingManager: DrawingManager;
    getActiveTool: () => string | null;
    lineColor: string;
    onPlacementActiveChange?: (active: boolean) => void;
    onDrawingCreated?: (drawingId: string) => void;
    onDrawingRemoved?: () => void;
    onDrawingUpdated?: () => void;
    onSelectionChanged?: (drawing: IDrawing | null) => void;
};

const getRequiredAnchors = (toolType: string) =>
    getToolRegistry().get(toolType)?.requiredAnchors ?? 2;

const pointToAnchor = (
    chart: IChartApi,
    series: ISeriesApi<'Candlestick'>,
    x: number,
    y: number
): Anchor | null => {
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (time === null || price === null) {
        return null;
    }
    return {time, price};
};

export const attachChartDrawingInteraction = ({
                                                  chart,
                                                  series,
                                                  container,
                                                  drawingManager,
                                                  getActiveTool,
                                                  lineColor,
                                                  onDrawingCreated,
                                                  onPlacementActiveChange,
                                                  onDrawingRemoved,
                                                  onDrawingUpdated,
                                                  onSelectionChanged,
                                              }: AttachChartDrawingInteractionOptions) => {
    const pendingAnchors: Anchor[] = [];
    let previewDrawing: IDrawing | null = null;
    let drawingIdCounter = 0;

    const setPlacementActive = (active: boolean) => {
        onPlacementActiveChange?.(active);
    };

    const removePreview = () => {
        if (previewDrawing) {
            drawingManager.removeDrawing(PREVIEW_DRAWING_ID);
            previewDrawing = null;
        }
    };

    const cancelPlacement = () => {
        removePreview();
        pendingAnchors.length = 0;
        setPlacementActive(false);
    };

    const updatePreview = (mouseAnchor: Anchor) => {
        const toolType = getActiveTool();
        if (!toolType) {
            return;
        }

        const registry = getToolRegistry();
        const requiredAnchors = getRequiredAnchors(toolType);
        const previewAnchors = [...pendingAnchors];

        while (previewAnchors.length < requiredAnchors) {
            previewAnchors.push({...mouseAnchor});
        }

        removePreview();

        previewDrawing = registry.createDrawing(
            toolType,
            PREVIEW_DRAWING_ID,
            previewAnchors,
            {
                lineColor,
                lineWidth: 2,
                fillColor: `${lineColor}33`,
            }
        );

        if (previewDrawing) {
            drawingManager.addDrawing(previewDrawing);
        }
    };

    const updatePreviewWithMouse = (mouseAnchor: Anchor) => {
        if (!previewDrawing) {
            return;
        }

        const toolType = getActiveTool();
        if (!toolType) {
            return;
        }

        const updateIndex = pendingAnchors.length;
        if (updateIndex < getRequiredAnchors(toolType)) {
            previewDrawing.updateAnchor(updateIndex, mouseAnchor);
        }
    };

    const createDrawing = (toolType: string, anchors: Anchor[]) => {
        const id = `drawing-${drawingIdCounter + 1}`;
        drawingIdCounter += 1;

        const drawing = getToolRegistry().createDrawing(toolType, id, anchors, {
            lineColor,
            lineWidth: 2,
            fillColor: `${lineColor}33`,
        });

        if (drawing) {
            drawingManager.addDrawing(drawing);
            onDrawingCreated?.(id);
        }
    };

    const onContainerMouseDown = (event: MouseEvent) => {
        const toolType = getActiveTool();
        if (!toolType) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    };

    const onContainerClick = (event: MouseEvent) => {
        const toolType = getActiveTool();
        if (!toolType) {
            return;
        }

        const rect = container.getBoundingClientRect();
        const anchor = pointToAnchor(
            chart,
            series,
            event.clientX - rect.left,
            event.clientY - rect.top
        );
        if (!anchor) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        pendingAnchors.push(anchor);
        setPlacementActive(true);

        if (pendingAnchors.length >= getRequiredAnchors(toolType)) {
            removePreview();
            createDrawing(toolType, [...pendingAnchors]);
            pendingAnchors.length = 0;
            setPlacementActive(false);
            return;
        }

        updatePreview(anchor);
    };

    const onContainerMouseMove = (event: MouseEvent) => {
        const toolType = getActiveTool();
        if (!toolType || pendingAnchors.length === 0) {
            return;
        }

        event.preventDefault();

        const rect = container.getBoundingClientRect();
        const anchor = pointToAnchor(
            chart,
            series,
            event.clientX - rect.left,
            event.clientY - rect.top
        );
        if (!anchor) {
            return;
        }

        updatePreviewWithMouse(anchor);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            cancelPlacement();
            return;
        }

        if (event.key !== 'Delete' && event.key !== 'Backspace') {
            return;
        }

        const selected = drawingManager.getSelectedDrawing();
        if (selected) {
            drawingManager.removeDrawing(selected.id);
            onDrawingRemoved?.();
        }
    };

    const unsubscribeSelected = drawingManager.on('drawing:selected', (event) => {
        const drawing = event.drawing ?? (event.drawingId ? drawingManager.getDrawing(event.drawingId) : undefined);
        onSelectionChanged?.(drawing ?? null);
    });
    const unsubscribeDeselected = drawingManager.on('drawing:deselected', () => {
        onSelectionChanged?.(null);
    });
    const unsubscribeRemoved = drawingManager.on('drawing:removed', () => {
        onDrawingRemoved?.();
        onSelectionChanged?.(drawingManager.getSelectedDrawing());
    });
    const unsubscribeUpdated = drawingManager.on('drawing:updated', () => {
        onDrawingUpdated?.();
    });

    container.addEventListener('mousedown', onContainerMouseDown, {capture: true});
    container.addEventListener('click', onContainerClick);
    container.addEventListener('mousemove', onContainerMouseMove);
    window.addEventListener('keydown', onKeyDown);

    return () => {
        container.removeEventListener('mousedown', onContainerMouseDown, {capture: true});
        container.removeEventListener('click', onContainerClick);
        container.removeEventListener('mousemove', onContainerMouseMove);
        window.removeEventListener('keydown', onKeyDown);
        unsubscribeSelected();
        unsubscribeDeselected();
        unsubscribeRemoved();
        unsubscribeUpdated();
        cancelPlacement();
    };
};
