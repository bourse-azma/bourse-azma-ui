import {type MutableRefObject, useCallback, useRef, useState} from 'react';
import type {DrawingManager, IDrawing} from 'lightweight-charts-drawing';
import {saveDrawings} from '../drawingStorage';

export function useChartDrawings(instrumentCodeRef: MutableRefObject<string | null>) {
    const drawingManagerRef = useRef<DrawingManager | null>(null);
    const [selectedDrawing, setSelectedDrawing] = useState<IDrawing | null>(null);
    const [isPlacingDrawing, setIsPlacingDrawing] = useState(false);

    const persistDrawings = useCallback(() => {
        const code = instrumentCodeRef.current;
        const manager = drawingManagerRef.current;
        if (!code || !manager) return;
        saveDrawings(code, manager.exportDrawings());
    }, [instrumentCodeRef]);

    const deleteSelectedDrawing = useCallback(() => {
        const manager = drawingManagerRef.current;
        const selected = manager?.getSelectedDrawing();
        if (!manager || !selected) return;
        manager.removeDrawing(selected.id);
        setSelectedDrawing(null);
        persistDrawings();
    }, [persistDrawings]);

    const clearAllDrawings = useCallback(() => {
        const manager = drawingManagerRef.current;
        if (!manager || manager.getAllDrawings().length === 0) return;
        manager.clearAll();
        setSelectedDrawing(null);
        persistDrawings();
    }, [persistDrawings]);

    const updateSelectedDrawingStyle = useCallback(
        (patch: { lineColor?: string; lineWidth?: number }) => {
            const drawing = drawingManagerRef.current?.getSelectedDrawing();
            if (!drawing) return;
            drawing.updateStyle(patch);
            drawing.requestUpdate();
            setSelectedDrawing(drawingManagerRef.current?.getSelectedDrawing() ?? null);
            persistDrawings();
        },
        [persistDrawings]
    );

    return {
        drawingManagerRef,
        selectedDrawing,
        setSelectedDrawing,
        isPlacingDrawing,
        setIsPlacingDrawing,
        persistDrawings,
        deleteSelectedDrawing,
        clearAllDrawings,
        updateSelectedDrawingStyle,
    };
}
