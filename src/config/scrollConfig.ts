const DEFAULT_CALM_SCROLL_DAMPING_PERCENT = 42;
const DEFAULT_INFINITE_SCROLL_PREFETCH_PERCENT = 120;
const DEFAULT_INFINITE_SCROLL_MIN_PREFETCH_PX = 320;
const DEFAULT_INFINITE_SCROLL_PREFETCH_ITEMS_FROM_END = 15;

/** Items loaded per infinite-scroll request (all sections). */
export const INFINITE_SCROLL_PAGE_SIZE = 20;

/** Reads a percentage from env (e.g. 42 or 42%) and returns a 0–1 ratio. */
const parseOptionalPercent = (
    raw: string | undefined,
    fallbackPercent: number,
    key: string,
    maxPercent = 100,
) => {
    if (raw === undefined || raw.trim() === '') {
        return fallbackPercent / 100;
    }

    const normalized = raw.trim().replace(/%$/, '');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > maxPercent) {
        throw new Error(`Invalid env value for ${key}: ${raw} (expected 1–${maxPercent})`);
    }

    return parsed / 100;
};

const parseOptionalPositiveInt = (
    raw: string | undefined,
    fallback: number,
    key: string,
) => {
    if (raw === undefined || raw.trim() === '') {
        return fallback;
    }

    const parsed = Number(raw.trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid env value for ${key}: ${raw}`);
    }

    return Math.floor(parsed);
};

export const scrollConfig = Object.freeze({
    // List scroll speed (42 = 42% of normal)
    calmScrollDampingFactor: parseOptionalPercent(
        import.meta.env.VITE_CALM_SCROLL_DAMPING_FACTOR,
        DEFAULT_CALM_SCROLL_DAMPING_PERCENT,
        'VITE_CALM_SCROLL_DAMPING_FACTOR',
    ),
    // Extra early-load margin (% of list height)
    infiniteScrollPrefetchRatio: parseOptionalPercent(
        import.meta.env.VITE_INFINITE_SCROLL_PREFETCH_RATIO,
        DEFAULT_INFINITE_SCROLL_PREFETCH_PERCENT,
        'VITE_INFINITE_SCROLL_PREFETCH_RATIO',
        200,
    ),
    // Extra early-load margin (pixels)
    infiniteScrollMinPrefetchPx: parseOptionalPositiveInt(
        import.meta.env.VITE_INFINITE_SCROLL_MIN_PREFETCH_PX,
        DEFAULT_INFINITE_SCROLL_MIN_PREFETCH_PX,
        'VITE_INFINITE_SCROLL_MIN_PREFETCH_PX',
    ),
    // Load next page N items before the end
    infiniteScrollPrefetchItemsFromEnd: parseOptionalPositiveInt(
        import.meta.env.VITE_INFINITE_SCROLL_PREFETCH_ITEMS_FROM_END,
        DEFAULT_INFINITE_SCROLL_PREFETCH_ITEMS_FROM_END,
        'VITE_INFINITE_SCROLL_PREFETCH_ITEMS_FROM_END',
    ),
});

/** Index in the current list where the invisible prefetch sentinel is rendered. */
export const getInfiniteScrollTriggerIndex = (itemCount: number) => {
    if (itemCount <= 0) {
        return -1;
    }

    return Math.max(0, itemCount - scrollConfig.infiniteScrollPrefetchItemsFromEnd);
};
