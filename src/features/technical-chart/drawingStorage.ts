import {getToolRegistry, type IDrawing, type SerializedDrawing} from 'lightweight-charts-drawing';

const storageKey = (instrumentCode: string) => `chart-drawings:${instrumentCode}`;

export const saveDrawings = (instrumentCode: string, data: SerializedDrawing[]) => {
    try {
        sessionStorage.setItem(storageKey(instrumentCode), JSON.stringify(data));
    } catch {
        // Ignore quota errors.
    }
};

export const loadDrawings = (instrumentCode: string): SerializedDrawing[] => {
    try {
        const raw = sessionStorage.getItem(storageKey(instrumentCode));
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw) as SerializedDrawing[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const createDrawingFromSerialized = (data: SerializedDrawing): IDrawing | null =>
    getToolRegistry().createDrawing(data.type, data.id, data.anchors, data.style, data.options);

export const importDrawingsFactory = (type: string, data: SerializedDrawing): IDrawing | null => {
    if (data.type !== type) {
        return null;
    }
    return createDrawingFromSerialized(data);
};
