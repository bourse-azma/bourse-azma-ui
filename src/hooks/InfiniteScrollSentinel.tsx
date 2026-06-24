import type {Ref} from 'react';

/** Invisible sentinel placed inside list rows — no layout shift, no visible loader. */
export const InfiniteScrollSentinel = ({
                                           sentinelRef,
                                       }: {
    sentinelRef: Ref<HTMLDivElement | null>;
}) => (
    <div
        ref={sentinelRef as Ref<HTMLDivElement>}
        className="pointer-events-none h-px w-full shrink-0 opacity-0"
        aria-hidden="true"
    />
);
