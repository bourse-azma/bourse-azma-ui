import {useEffect, useRef, useState} from 'react';
import {Check, ChevronDown, Pencil, Plus, Trash2} from 'lucide-react';
import type {Watchlist} from '../api';

type WatchlistDropdownProps = {
    watchlists: Watchlist[];
    selectedWatchlist: Watchlist;
    onSelectWatchlist: (watchlistId: number) => void;
    onRequestCreateWatchlist: () => void;
    onRequestEditWatchlist: (watchlistId: number) => void;
    onRequestDeleteWatchlist: (watchlistId: number) => void;
};

export function WatchlistDropdown({
                                      watchlists,
                                      selectedWatchlist,
                                      onSelectWatchlist,
                                      onRequestCreateWatchlist,
                                      onRequestEditWatchlist,
                                      onRequestDeleteWatchlist,
                                  }: WatchlistDropdownProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!dropdownOpen) return;
        const closeDropdown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            if (dropdownRef.current?.contains(target)) return;
            setDropdownOpen(false);
        };

        window.addEventListener('mousedown', closeDropdown);
        return () => window.removeEventListener('mousedown', closeDropdown);
    }, [dropdownOpen]);

    return (
        <div className="mb-3 flex items-center gap-2">
            <div ref={dropdownRef} className="relative min-w-0 flex-1">
                <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex h-10 w-full items-center justify-between rounded-xl border border-border/80 bg-surface px-3 text-xs text-text transition hover:border-primary/30"
                >
                    <span className="truncate">{selectedWatchlist.name}</span>
                    <ChevronDown className={`h-4 w-4 text-muted transition ${dropdownOpen ? 'rotate-180' : ''}`}/>
                </button>

                {dropdownOpen ? (
                    <div
                        className="absolute inset-x-0 top-[calc(100%+6px)] z-30 rounded-xl border border-border/80 bg-surface shadow-card">
                        <button
                            type="button"
                            onClick={() => {
                                setDropdownOpen(false);
                                onRequestCreateWatchlist();
                            }}
                            className="flex h-10 w-full items-center justify-center gap-1 border-b border-border/70 px-3 text-xs font-semibold text-positive transition hover:bg-surface-2"
                        >
                            <Plus className="h-3.5 w-3.5"/>
                            ساخت دیده‌بان جدید
                        </button>

                        <div className="max-h-48 overflow-y-auto py-1">
                            {watchlists.map((watchlist) => {
                                const isActive = watchlist.id === selectedWatchlist.id;
                                return (
                                    <div
                                        key={watchlist.id}
                                        className={`group flex items-center justify-between px-2 py-1.5 text-xs transition ${
                                            isActive ? 'bg-surface-2 text-text' : 'text-muted hover:bg-surface-2 hover:text-text'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                onSelectWatchlist(watchlist.id);
                                            }}
                                            className="flex min-w-0 flex-1 items-center justify-between px-1 text-right"
                                        >
                                            <span className="truncate">{watchlist.name}</span>
                                            {isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-positive"/> : null}
                                        </button>

                                        <div className="mr-1 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    onRequestEditWatchlist(watchlist.id);
                                                }}
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-70 transition hover:bg-surface hover:text-text group-hover:opacity-100"
                                                aria-label={`edit watchlist ${watchlist.name}`}
                                            >
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    onRequestDeleteWatchlist(watchlist.id);
                                                }}
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-negative/90 opacity-70 transition hover:bg-negative/10 hover:text-negative group-hover:opacity-100"
                                                aria-label={`delete watchlist ${watchlist.name}`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>

            <button
                type="button"
                onClick={onRequestCreateWatchlist}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-positive/30 bg-positive/10 px-3 text-xs font-semibold text-positive transition hover:bg-positive/15 focus-visible:ring-2 focus-visible:ring-positive/45"
            >
                <Plus className="h-3.5 w-3.5"/>
                ساخت
            </button>
        </div>
    );
}
