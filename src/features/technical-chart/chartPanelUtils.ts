import {Minus, MousePointer2, TrendingUp, Waves} from 'lucide-react';
import {ORDERBOOK_SLOT_HEIGHT_CLASS} from '../symbol-search/PeerGroupPanel';
import type {DrawingToolId} from './chartConfig';

export const panelShellClass = `flex ${ORDERBOOK_SLOT_HEIGHT_CLASS} flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-2`;

export const drawingToolIcon = (toolId: DrawingToolId) => {
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

export const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

export const measureChartSize = (container: HTMLElement) => {
    const width = container.clientWidth || container.parentElement?.clientWidth || 320;
    const height = container.clientHeight || container.parentElement?.clientHeight || 360;
    return {width: Math.max(width, 200), height: Math.max(height, 200)};
};

export const waitForChartContainer = async (
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
