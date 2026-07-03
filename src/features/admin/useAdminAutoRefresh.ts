import {useEffect} from 'react';

export function useAdminAutoRefresh(
    refresh: () => void | Promise<void>,
    enabled: boolean,
    intervalMs: number,
) {
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        let timer: number | undefined;
        const tick = async () => {
            await refresh();
            if (!cancelled) timer = window.setTimeout(tick, intervalMs);
        };

        timer = window.setTimeout(tick, intervalMs);
        return () => {
            cancelled = true;
            if (timer !== undefined) window.clearTimeout(timer);
        };
    }, [enabled, intervalMs, refresh]);
}
