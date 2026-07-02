import type {Dispatch, SetStateAction} from 'react';
import {useCallback, useEffect, useState} from 'react';
import type {WatchlistToast} from '../types';

export function useWatchlistToastState() {
    const [watchlistToast, setWatchlistToast] = useState<WatchlistToast | null>(null);

    const showWatchlistToast = useCallback((
        message: string,
        tone: WatchlistToast['tone'] = 'success',
        title?: string
    ) => {
        setWatchlistToast({id: Date.now() + Math.floor(Math.random() * 1000), title, message, tone});
    }, []);

    useEffect(() => {
        if (!watchlistToast) return;
        const timer = window.setTimeout(() => {
            setWatchlistToast((prev: WatchlistToast | null) => (prev?.id === watchlistToast.id ? null : prev));
        }, 4200);
        return () => window.clearTimeout(timer);
    }, [watchlistToast]);

    return {watchlistToast, setWatchlistToast, showWatchlistToast};
}

export async function runWatchlistMutation(
    setWatchlistBusy: Dispatch<SetStateAction<boolean>>,
    action: () => Promise<void>
) {
    setWatchlistBusy(true);
    try {
        await action();
    } finally {
        setWatchlistBusy(false);
    }
}
