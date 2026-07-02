import {type RefObject, useEffect, useRef} from 'react';
import {scrollConfig} from '../config/scrollConfig';

type UseInfiniteScrollLoadMoreOptions = {
    /** Scroll container; omit for viewport (window) scroll. */
    rootRef?: RefObject<HTMLElement | null>;
    sentinelRef: RefObject<HTMLElement | null>;
    enabled: boolean;
    onLoadMore: () => void;
    /** Skip triggers while a page request is already in flight. */
    isFetching?: boolean;
    /** Re-observe when rendered list length changes. */
    itemCount: number;
    prefetchRatio?: number;
    minPrefetchPx?: number;
};

const resolvePrefetchMargin = (containerHeight: number, prefetchRatio: number, minPrefetchPx: number) => {
    const bottomPx = Math.max(minPrefetchPx, Math.round(containerHeight * prefetchRatio));
    return `0px 0px ${bottomPx}px 0px`;
};

export function useInfiniteScrollLoadMore({
                                              rootRef,
                                              sentinelRef,
                                              enabled,
                                              onLoadMore,
                                              isFetching = false,
                                              itemCount,
                                              prefetchRatio = scrollConfig.infiniteScrollPrefetchRatio,
                                              minPrefetchPx = scrollConfig.infiniteScrollMinPrefetchPx,
                                          }: UseInfiniteScrollLoadMoreOptions) {
    const onLoadMoreRef = useRef(onLoadMore);
    const isFetchingRef = useRef(isFetching);

    useEffect(() => {
        onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        isFetchingRef.current = isFetching;
    }, [isFetching]);

    useEffect(() => {
        const root = rootRef?.current ?? null;
        const sentinel = sentinelRef.current;
        if (!sentinel || !enabled) {
            return;
        }

        let observer: IntersectionObserver | null = null;

        const resolveRootHeight = () => root?.clientHeight ?? window.innerHeight;

        const observe = () => {
            observer?.disconnect();

            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }
                        if (isFetchingRef.current) {
                            return;
                        }
                        onLoadMoreRef.current();
                    });
                },
                {
                    root,
                    rootMargin: resolvePrefetchMargin(resolveRootHeight(), prefetchRatio, minPrefetchPx),
                    threshold: 0,
                },
            );

            observer.observe(sentinel);
        };

        observe();

        if (root) {
            const resizeObserver = new ResizeObserver(() => {
                observe();
            });
            resizeObserver.observe(root);

            return () => {
                observer?.disconnect();
                resizeObserver.disconnect();
            };
        }

        const handleWindowResize = () => {
            observe();
        };
        window.addEventListener('resize', handleWindowResize);

        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', handleWindowResize);
        };
    }, [
        enabled,
        isFetching,
        itemCount,
        minPrefetchPx,
        prefetchRatio,
        rootRef,
        sentinelRef,
    ]);
}
