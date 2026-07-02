import {useCallback, useEffect, useMemo, useState} from 'react';
import type {SymbolSearchSuggestion} from '../../symbol-search/types';
import {getWatchlists, type Watchlist} from '../../watchlist/api';
import type {MainNavTab} from '../../navigation/mainNavTabState';
import {WATCHLIST_NAME_MAX_LENGTH} from '../constants';
import {isSymbolSearchSuggestion} from '../isSymbolSearchSuggestion';
import {
    addWatchlistSymbolRequest,
    deleteWatchlistRequest,
    removeWatchlistSymbolRequest,
    submitWatchlistModalRequest,
} from '../watchlistOperations';
import type {AddToWatchlistModalState, SidebarTab, WatchlistModalState} from '../types';
import {runWatchlistMutation, useWatchlistToastState} from './useWatchlistToast';

type UseWatchlistManagementParams = {
    accessToken: string;
    selectedSymbol: SymbolSearchSuggestion;
    setMainNavTab: (tab: MainNavTab) => void;
    setSidebarTab: (tab: SidebarTab) => void;
    setDrawerOpen: (open: boolean) => void;
};

export function useWatchlistManagement({
                                           accessToken,
                                           selectedSymbol,
                                           setMainNavTab,
                                           setSidebarTab,
                                           setDrawerOpen,
                                       }: UseWatchlistManagementParams) {
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [watchlistsLoading, setWatchlistsLoading] = useState(true);
    const [watchlistsError, setWatchlistsError] = useState<string | null>(null);
    const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
    const [watchlistModal, setWatchlistModal] = useState<WatchlistModalState | null>(null);
    const [addToWatchlistModal, setAddToWatchlistModal] = useState<AddToWatchlistModalState | null>(null);
    const [watchlistNameDraft, setWatchlistNameDraft] = useState('');
    const [watchlistNameError, setWatchlistNameError] = useState<string | null>(null);
    const [watchlistSubmitting, setWatchlistSubmitting] = useState(false);
    const [watchlistBusy, setWatchlistBusy] = useState(false);
    const {watchlistToast, setWatchlistToast, showWatchlistToast} = useWatchlistToastState();

    const replaceWatchlistInState = useCallback((updatedWatchlist: Watchlist) => {
        setWatchlists((prev) => {
            const index = prev.findIndex((item) => item.id === updatedWatchlist.id);
            if (index === -1) {
                return [...prev, updatedWatchlist].sort((a, b) => a.id - b.id);
            }
            const next = [...prev];
            next[index] = updatedWatchlist;
            return next;
        });
    }, []);

    const loadWatchlists = useCallback(async () => {
        setWatchlistsLoading(true);
        setWatchlistsError(null);
        try {
            const payload = await getWatchlists(accessToken);
            setWatchlists(payload);
            setSelectedWatchlistId((prev) => {
                if (payload.length === 0) return null;
                if (prev !== null && payload.some((item) => item.id === prev)) return prev;
                return payload[0].id;
            });
        } catch (error) {
            setWatchlistsError(error instanceof Error ? error.message : 'دریافت دیده‌بان با خطا مواجه شد.');
            setWatchlists([]);
            setSelectedWatchlistId(null);
        } finally {
            setWatchlistsLoading(false);
        }
    }, [accessToken]);

    const selectedWatchlist = useMemo(
        () => watchlists.find((watchlist) => watchlist.id === selectedWatchlistId) ?? watchlists[0] ?? null,
        [watchlists, selectedWatchlistId]
    );

    const selectedWatchlistSymbol = useMemo(
        () => selectedWatchlist?.symbols.find((item) => item.symbolKey === selectedSymbol.key) ?? null,
        [selectedSymbol.key, selectedWatchlist]
    );

    const openWatchlistSection = useCallback(() => {
        setMainNavTab('بازار');
        setSidebarTab('watchlist');
    }, [setMainNavTab, setSidebarTab]);

    const openWatchlistDrawer = useCallback(() => {
        openWatchlistSection();
        setDrawerOpen(true);
    }, [openWatchlistSection, setDrawerOpen]);

    const openCreateWatchlistModal = useCallback((pendingSymbol?: SymbolSearchSuggestion) => {
        setWatchlistModal({
            mode: 'create',
            pendingSymbol: isSymbolSearchSuggestion(pendingSymbol) ? pendingSymbol : undefined,
        });
        setWatchlistNameDraft('');
        setWatchlistNameError(null);
    }, []);

    const openEditWatchlistModal = useCallback((watchlistId: number) => {
        const target = watchlists.find((item) => item.id === watchlistId);
        if (!target) return;
        setWatchlistModal({mode: 'edit', watchlistId, originalName: target.name});
        setWatchlistNameDraft(target.name);
        setWatchlistNameError(null);
    }, [watchlists]);

    const closeWatchlistModal = useCallback(() => {
        setWatchlistModal(null);
        setWatchlistNameError(null);
        setWatchlistSubmitting(false);
    }, []);

    const submitWatchlistModal = useCallback(async () => {
        if (!watchlistModal) return;
        const normalizedName = watchlistNameDraft.trim().replace(/\s+/g, ' ');
        if (normalizedName === '') {
            setWatchlistNameError('نمی‌تواند خالی باشد.');
            return;
        }
        if (normalizedName.length > WATCHLIST_NAME_MAX_LENGTH) {
            setWatchlistNameError(`نام دیده‌بان حداکثر ${WATCHLIST_NAME_MAX_LENGTH} کاراکتر است.`);
            return;
        }

        setWatchlistSubmitting(true);
        setWatchlistNameError(null);
        try {
            const {watchlist: savedWatchlist, createdWithSymbol} = await submitWatchlistModalRequest(
                accessToken,
                watchlistModal,
                normalizedName
            );
            if (watchlistModal.mode === 'create') {
                setWatchlists((prev) => [...prev, savedWatchlist].sort((a, b) => a.id - b.id));
            } else {
                replaceWatchlistInState(savedWatchlist);
            }
            setSelectedWatchlistId(savedWatchlist.id);
            setWatchlistModal(null);
            showWatchlistToast(
                watchlistModal.mode === 'create'
                    ? createdWithSymbol
                        ? `دیده‌بان ${savedWatchlist.name} ساخته شد و نماد ${createdWithSymbol.symbol} اضافه شد.`
                        : `دیده‌بان ${savedWatchlist.name} ساخته شد.`
                    : `ویرایش نام دیده‌بان ${watchlistModal.originalName} انجام شد.`
            );
        } catch (error) {
            setWatchlistNameError(error instanceof Error ? error.message : 'ذخیره دیده‌بان ناموفق بود.');
        } finally {
            setWatchlistSubmitting(false);
        }
    }, [accessToken, replaceWatchlistInState, showWatchlistToast, watchlistModal, watchlistNameDraft]);

    const handleDeleteWatchlist = useCallback(async (watchlistId: number) => {
        if (watchlistBusy) return;
        const target = watchlists.find((item) => item.id === watchlistId);
        if (!target) return;
        await runWatchlistMutation(setWatchlistBusy, async () => {
            try {
                await deleteWatchlistRequest(accessToken, watchlistId);
                const nextWatchlists = watchlists.filter((item) => item.id !== watchlistId);
                setWatchlists(nextWatchlists);
                if (selectedWatchlistId === watchlistId) {
                    setSelectedWatchlistId(nextWatchlists[0]?.id ?? null);
                }
                showWatchlistToast(`دیده‌بان ${target.name} حذف شد.`);
            } catch (error) {
                showWatchlistToast(error instanceof Error ? error.message : 'حذف دیده‌بان ناموفق بود.', 'error');
            }
        });
    }, [accessToken, selectedWatchlistId, showWatchlistToast, watchlistBusy, watchlists]);

    const handleRemoveSymbolFromWatchlist = useCallback(async (symbolId: number) => {
        if (watchlistBusy || !selectedWatchlist) return;
        const targetSymbol = selectedWatchlist.symbols.find((item) => item.id === symbolId);
        if (!targetSymbol) return;
        await runWatchlistMutation(setWatchlistBusy, async () => {
            try {
                const updated = await removeWatchlistSymbolRequest(accessToken, selectedWatchlist.id, symbolId);
                replaceWatchlistInState(updated);
                showWatchlistToast(`نماد ${targetSymbol.symbol} از دیده‌بان ${selectedWatchlist.name} حذف شد.`);
            } catch (error) {
                showWatchlistToast(error instanceof Error ? error.message : 'حذف نماد از دیده‌بان ناموفق بود.', 'error');
            }
        });
    }, [accessToken, replaceWatchlistInState, selectedWatchlist, showWatchlistToast, watchlistBusy]);

    const handleAddSymbolToWatchlist = useCallback(async (watchlistId: number, symbol: SymbolSearchSuggestion) => {
        if (watchlistBusy) return;
        const targetWatchlist = watchlists.find((item) => item.id === watchlistId);
        if (!targetWatchlist) return;
        if (targetWatchlist.symbols.some((item) => item.symbolKey === symbol.key)) {
            showWatchlistToast(`نماد ${symbol.symbol} قبلاً در دیده‌بان ${targetWatchlist.name} وجود دارد.`, 'error');
            return;
        }
        await runWatchlistMutation(setWatchlistBusy, async () => {
            try {
                const updated = await addWatchlistSymbolRequest(accessToken, watchlistId, symbol);
                replaceWatchlistInState(updated);
                setSelectedWatchlistId(watchlistId);
                setAddToWatchlistModal(null);
                showWatchlistToast(`نماد ${symbol.symbol} به دیده‌بان ${targetWatchlist.name} اضافه شد.`);
            } catch (error) {
                showWatchlistToast(error instanceof Error ? error.message : 'افزودن نماد به دیده‌بان ناموفق بود.', 'error');
            }
        });
    }, [accessToken, replaceWatchlistInState, showWatchlistToast, watchlistBusy, watchlists]);

    const handleToggleFavorite = useCallback(async () => {
        if (watchlistBusy) return;
        if (selectedWatchlistSymbol && selectedWatchlist) {
            await runWatchlistMutation(setWatchlistBusy, async () => {
                try {
                    const updated = await removeWatchlistSymbolRequest(
                        accessToken,
                        selectedWatchlist.id,
                        selectedWatchlistSymbol.id
                    );
                    replaceWatchlistInState(updated);
                    showWatchlistToast(`نماد ${selectedSymbol.symbol} از دیده‌بان ${selectedWatchlist.name} حذف شد.`);
                } catch (error) {
                    showWatchlistToast(error instanceof Error ? error.message : 'به‌روزرسانی دیده‌بان ناموفق بود.', 'error');
                }
            });
            return;
        }
        if (watchlists.length === 0) {
            openCreateWatchlistModal(selectedSymbol);
            return;
        }
        setAddToWatchlistModal({symbol: selectedSymbol});
    }, [
        accessToken,
        openCreateWatchlistModal,
        replaceWatchlistInState,
        selectedSymbol,
        selectedWatchlist,
        selectedWatchlistSymbol,
        showWatchlistToast,
        watchlistBusy,
        watchlists.length,
    ]);

    useEffect(() => {
        void loadWatchlists();
    }, [loadWatchlists]);

    return {
        watchlists,
        watchlistsLoading,
        watchlistsError,
        selectedWatchlistId,
        setSelectedWatchlistId,
        selectedWatchlist,
        loadWatchlists,
        watchlistModal,
        addToWatchlistModal,
        watchlistNameDraft,
        setWatchlistNameDraft,
        watchlistNameError,
        setWatchlistNameError,
        watchlistSubmitting,
        watchlistBusy,
        watchlistToast,
        setWatchlistToast,
        showWatchlistToast,
        openCreateWatchlistModal,
        closeAddToWatchlistModal: () => setAddToWatchlistModal(null),
        openCreateWatchlistFromAddModal: () => {
            if (!addToWatchlistModal) return;
            const symbol = addToWatchlistModal.symbol;
            setAddToWatchlistModal(null);
            openCreateWatchlistModal(symbol);
        },
        openEditWatchlistModal,
        closeWatchlistModal,
        submitWatchlistModal,
        handleDeleteWatchlist,
        handleRemoveSymbolFromWatchlist,
        handleAddSymbolToWatchlist,
        handleToggleFavorite,
        favoriteButtonTitle: selectedWatchlistSymbol
            ? 'حذف نماد از دیده‌بان'
            : watchlists.length === 0
                ? 'ابتدا دیده‌بان بسازید'
                : 'افزودن نماد به دیده‌بان',
        isSymbolInSelectedWatchlist: selectedWatchlistSymbol !== null,
        openWatchlistSection,
        openWatchlistDrawer,
    };
}
