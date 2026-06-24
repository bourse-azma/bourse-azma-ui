import {type RefObject, useEffect} from 'react';
import {scrollConfig} from '../config/scrollConfig';

type UseCalmVerticalScrollOptions = {
    dampingFactor?: number;
    /** Re-run when list content changes so the listener stays on the active node. */
    contentLength?: number;
};

export function useCalmVerticalScroll(
    containerRef: RefObject<HTMLElement | null>,
    options?: UseCalmVerticalScrollOptions,
) {
    const dampingFactor = options?.dampingFactor ?? scrollConfig.calmScrollDampingFactor;
    const contentLength = options?.contentLength;

    useEffect(() => {
        const element = containerRef.current;
        if (!element) {
            return;
        }

        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey) {
                return;
            }

            const deltaY = event.deltaY;
            if (deltaY === 0) {
                return;
            }

            const maxScrollTop = element.scrollHeight - element.clientHeight;
            if (maxScrollTop <= 0) {
                return;
            }

            const atTop = element.scrollTop <= 0;
            const atBottom = element.scrollTop >= maxScrollTop - 1;
            const scrollingUpPastTop = deltaY < 0 && atTop;
            const scrollingDownPastBottom = deltaY > 0 && atBottom;

            if (scrollingUpPastTop || scrollingDownPastBottom) {
                return;
            }

            event.preventDefault();

            const nextScrollTop = element.scrollTop + deltaY * dampingFactor;
            element.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
        };

        element.addEventListener('wheel', onWheel, {passive: false});

        return () => {
            element.removeEventListener('wheel', onWheel);
        };
    }, [containerRef, dampingFactor, contentLength]);
}
