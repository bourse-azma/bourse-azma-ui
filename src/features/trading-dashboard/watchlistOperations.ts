import type {SymbolSearchSuggestion} from '../symbol-search/types';
import {
    addSymbolToWatchlist,
    createWatchlist,
    deleteWatchlist,
    removeSymbolFromWatchlist,
    updateWatchlist,
    type Watchlist,
} from '../watchlist/api';
import type {WatchlistModalState} from './types';

export async function submitWatchlistModalRequest(
    accessToken: string,
    watchlistModal: WatchlistModalState,
    normalizedName: string
): Promise<{ watchlist: Watchlist; createdWithSymbol: SymbolSearchSuggestion | null }> {
    if (watchlistModal.mode === 'create') {
        const created = await createWatchlist(accessToken, normalizedName);
        if (!watchlistModal.pendingSymbol) {
            return {watchlist: created, createdWithSymbol: null};
        }
        const savedWatchlist = await addSymbolToWatchlist(accessToken, created.id, watchlistModal.pendingSymbol);
        return {watchlist: savedWatchlist, createdWithSymbol: watchlistModal.pendingSymbol};
    }

    const updated = await updateWatchlist(accessToken, watchlistModal.watchlistId, normalizedName);
    return {watchlist: updated, createdWithSymbol: null};
}

export async function deleteWatchlistRequest(accessToken: string, watchlistId: number): Promise<void> {
    await deleteWatchlist(accessToken, watchlistId);
}

export async function removeWatchlistSymbolRequest(
    accessToken: string,
    watchlistId: number,
    symbolId: number
): Promise<Watchlist> {
    return removeSymbolFromWatchlist(accessToken, watchlistId, symbolId);
}

export async function addWatchlistSymbolRequest(
    accessToken: string,
    watchlistId: number,
    symbol: SymbolSearchSuggestion
): Promise<Watchlist> {
    return addSymbolToWatchlist(accessToken, watchlistId, symbol);
}
