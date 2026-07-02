import {Loader2, Search} from 'lucide-react';
import {useEffect, useId, useMemo, useRef, useState} from 'react';
import type {SymbolSearchSuggestion} from './types';
import {useSymbolSearch} from './useSymbolSearch';
import {loadRecentItems, mergeRecentItems, saveRecentItems} from './recentSymbols';
import SymbolSearchDropdown from './SymbolSearchDropdown';

type SymbolSearchComboboxProps = {
    selectedSymbol: SymbolSearchSuggestion | null;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
    onPreviewSymbolChange: (symbol: SymbolSearchSuggestion | null) => void;
    placeholder?: string;
};

export default function SymbolSearchCombobox({
                                                 selectedSymbol,
                                                 onSelectSymbol,
                                                 onPreviewSymbolChange,
                                                 placeholder = 'جستجوی نماد یا شرکت',
                                             }: SymbolSearchComboboxProps) {
    const listboxId = useId();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(selectedSymbol?.symbol ?? '');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [recentItems, setRecentItems] = useState<SymbolSearchSuggestion[]>(() => loadRecentItems());

    const query = inputValue.trim();
    const {loading, error, results, retry} = useSymbolSearch(query, open);

    const visibleItems = useMemo(() => (query === '' ? recentItems : results), [query, recentItems, results]);
    const mode = query === '' ? 'recent' : 'results';
    const sectionLabel =
        mode === 'recent' ? 'جستجوهای اخیر' : `مرتبط‌ترین نتیجه در ${visibleItems[0]?.type === 'FUND' ? 'صندوق' : 'سهام'}`;

    useEffect(() => {
        if (open) return;
        setInputValue(selectedSymbol?.symbol ?? '');
    }, [open, selectedSymbol]);

    useEffect(() => {
        if (!open) {
            setHighlightedIndex(-1);
            onPreviewSymbolChange(null);
            return;
        }

        setHighlightedIndex(visibleItems.length > 0 ? 0 : -1);
    }, [onPreviewSymbolChange, open, visibleItems]);

    useEffect(() => {
        if (!open || highlightedIndex < 0 || highlightedIndex >= visibleItems.length) {
            onPreviewSymbolChange(null);
            return;
        }
        onPreviewSymbolChange(visibleItems[highlightedIndex]);
    }, [highlightedIndex, onPreviewSymbolChange, open, visibleItems]);

    useEffect(() => {
        if (highlightedIndex < 0) return;
        optionRefs.current[highlightedIndex]?.scrollIntoView({block: 'nearest'});
    }, [highlightedIndex]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target;
            if (!target || !(target instanceof Node)) return;
            if (rootRef.current?.contains(target)) return;
            setOpen(false);
            onPreviewSymbolChange(null);
        };

        window.addEventListener('pointerdown', handlePointerDown);
        return () => window.removeEventListener('pointerdown', handlePointerDown);
    }, [onPreviewSymbolChange]);

    const selectItem = (item: SymbolSearchSuggestion) => {
        setInputValue(item.symbol);
        onSelectSymbol(item);
        setRecentItems((prev) => {
            const merged = mergeRecentItems(prev, item);
            saveRecentItems(merged);
            return merged;
        });
        setOpen(false);
        setHighlightedIndex(-1);
        onPreviewSymbolChange(null);
    };

    const removeRecentItem = (target: SymbolSearchSuggestion) => {
        setRecentItems((prev) => {
            const next = prev.filter((item) => item.key !== target.key);
            saveRecentItems(next);
            return next;
        });
    };

    const activeDescendantId =
        highlightedIndex >= 0 && highlightedIndex < visibleItems.length
            ? `${listboxId}-option-${highlightedIndex}`
            : undefined;

    return (
        <div dir="rtl" ref={rootRef} className="relative block lg:col-span-7">
            <Search className="pointer-events-none absolute right-3 top-1/2 z-20 h-4 w-4 -translate-y-1/2 text-muted"/>
            <input
                value={inputValue}
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                    setInputValue(event.target.value);
                    setOpen(true);
                }}
                onKeyDown={(event) => {
                    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                        setOpen(true);
                        event.preventDefault();
                        return;
                    }

                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setHighlightedIndex((prev) => {
                            if (visibleItems.length === 0) return -1;
                            const next = prev + 1;
                            return next >= visibleItems.length ? 0 : next;
                        });
                        return;
                    }

                    if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setHighlightedIndex((prev) => {
                            if (visibleItems.length === 0) return -1;
                            if (prev <= 0) return visibleItems.length - 1;
                            return prev - 1;
                        });
                        return;
                    }

                    if (event.key === 'Enter' && open) {
                        if (highlightedIndex >= 0 && highlightedIndex < visibleItems.length) {
                            event.preventDefault();
                            selectItem(visibleItems[highlightedIndex]);
                        }
                        return;
                    }

                    if (event.key === 'Escape') {
                        event.preventDefault();
                        setOpen(false);
                        setHighlightedIndex(-1);
                        onPreviewSymbolChange(null);
                        return;
                    }

                    if (event.key === 'Tab') {
                        setOpen(false);
                        setHighlightedIndex(-1);
                        onPreviewSymbolChange(null);
                    }
                }}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={activeDescendantId}
                className="h-10 w-full rounded-xl border border-border/80 bg-surface pr-10 pl-10 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                placeholder={placeholder}
            />
            {loading ?
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"/> : null}

            {open ? (
                <SymbolSearchDropdown
                    listboxId={listboxId}
                    sectionLabel={sectionLabel}
                    mode={mode}
                    query={query}
                    loading={loading}
                    error={error}
                    retry={retry}
                    visibleItems={visibleItems}
                    selectedSymbol={selectedSymbol}
                    highlightedIndex={highlightedIndex}
                    setHighlightedIndex={setHighlightedIndex}
                    optionRefs={optionRefs}
                    selectItem={selectItem}
                    removeRecentItem={removeRecentItem}
                />
            ) : null}
        </div>
    );
}
