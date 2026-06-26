import {useEffect} from 'react';
import {appConfig} from '../../config/appConfig';

export function useSupportTicketsAutoRefresh(
    refresh: (silent: boolean) => void | Promise<void>,
    enabled: boolean,
) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let timer: number | undefined;
        const tick = async () => {
            await refresh(true);
            timer = window.setTimeout(tick, appConfig.supportTicketsRefreshMs);
        };

        timer = window.setTimeout(tick, appConfig.supportTicketsRefreshMs);

        return () => {
            if (timer !== undefined) {
                window.clearTimeout(timer);
            }
        };
    }, [enabled, refresh]);
}
