import {Loader2, Search, X} from 'lucide-react';
import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {toMarketLabel} from './mappers';
import type {SymbolSearchSuggestion} from './types';
import {useSymbolSearch} from './useSymbolSearch';

const RECENT_SYMBOLS_STORAGE_KEY = 'bourse-azma-recent-symbols';
const MAX_RECENT_ITEMS = 6;

type SymbolSearchComboboxProps = {
    selectedSymbol: SymbolSearchSuggestion | null;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
    onPreviewSymbolChange: (symbol: SymbolSearchSuggestion | null) => void;
    placeholder?: string;
};

const loadRecentItems = (): SymbolSearchSuggestion[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(RECENT_SYMBOLS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as SymbolSearchSuggestion[];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (item) =>
                item &&
                typeof item === 'object' &&
                typeof item.key === 'string' &&
                typeof item.symbol === 'string' &&
                typeof item.name === 'string'
        );
    } catch {
        return [];
    }
};

const saveRecentItems = (items: SymbolSearchSuggestion[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RECENT_SYMBOLS_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT_ITEMS)));
};

const mergeRecentItems = (current: SymbolSearchSuggestion[], target: SymbolSearchSuggestion) => {
    const filtered = current.filter((item) => item.key !== target.key);
    return [target, ...filtered].slice(0, MAX_RECENT_ITEMS);
};

const normalize = (value: string) =>
    value
        .replace('ي', 'ی')
        .replace('ك', 'ک')
        .toLowerCase();

const HighlightedText = ({text, query}: { text: string; query: string }) => {
    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query).trim();
    if (normalizedQuery === '') return <>{text}</>;

    const matchIndex = normalizedText.indexOf(normalizedQuery);
    if (matchIndex === -1) return <>{text}</>;

    const endIndex = matchIndex + normalizedQuery.length;
    return (
        <>
            {text.slice(0, matchIndex)}
            <mark className="rounded bg-primary/15 px-0.5 text-text">{text.slice(matchIndex, endIndex)}</mark>
            {text.slice(endIndex)}
        </>
    );
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
                <div
                    className="absolute inset-x-0 top-[calc(100%+2px)] z-50 overflow-hidden rounded-xl border border-border/80 bg-surface shadow-card">
                    <div className="border-b border-border/60 px-3 py-2 text-xs text-muted">{sectionLabel}</div>
                    <div id={listboxId} role="listbox" className="thin-scrollbar max-h-72 overflow-y-auto py-1">
                        {mode === 'results' && error ? (
                            <div className="px-3 py-3 text-xs">
                                <p className="text-negative">دریافت نتایج با خطا مواجه شد.</p>
                                <button
                                    type="button"
                                    onClick={retry}
                                    className="mt-2 rounded-full border border-negative/40 bg-negative/10 px-3 py-1 text-[11px] text-negative transition hover:bg-negative/15"
                                >
                                    تلاش مجدد
                                </button>
                            </div>
                        ) : null}

                        {loading && mode === 'results' ? (
                            Array.from({length: 4}, (_, index) => (
                                <div key={`symbol-skeleton-${index + 1}`} className="px-3 py-2.5">
                                    <div className="mb-1 h-3.5 w-1/3 animate-pulse rounded bg-border/70"/>
                                    <div className="h-3 w-2/3 animate-pulse rounded bg-border/55"/>
                                </div>
                            ))
                        ) : null}

                        {!loading && !error && visibleItems.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-muted">
                                {mode === 'recent' ? 'جستجوی اخیر ذخیره نشده است.' : 'نتیجه‌ای پیدا نشد.'}
                            </div>
                        ) : null}

                        {!loading && visibleItems.length > 0
                            ? visibleItems.map((item, index) => {
                                const highlighted = index === highlightedIndex;
                                const isSelected = selectedSymbol?.key === item.key;
                                return (
                                    <div key={item.key} className="group relative px-1.5">
                                        <button
                                            id={`${listboxId}-option-${index}`}
                                            ref={(element) => {
                                                optionRefs.current[index] = element;
                                            }}
                                            type="button"
                                            role="option"
                                            aria-selected={highlighted}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                selectItem(item);
                                            }}
                                            className={`flex w-full items-start justify-between rounded-lg px-2.5 py-2.5 text-right transition ${
                                                highlighted || isSelected ? 'bg-surface-2' : 'hover:bg-surface-2/70'
                                            }`}
                                        >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-text">
                            <HighlightedText text={item.symbol} query={query}/>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            <HighlightedText text={item.name} query={query}/>
                          </span>
                        </span>
                                            {toMarketLabel(item.type) && (
                                                <span className="mr-2 shrink-0 text-[11px] text-muted">
                                                    {toMarketLabel(item.type)}
                                                </span>
                                            )}
                                        </button>

                                        {mode === 'recent' ? (
                                            <button
                                                type="button"
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    removeRecentItem(item);
                                                }}
                                                className="absolute left-3 mt-[-33px] hidden h-6 w-6 items-center justify-center rounded-full border border-border/70 bg-surface text-muted transition hover:text-text group-hover:flex focus-visible:flex"
                                                aria-label={`remove ${item.symbol} from history`}
                                            >
                                                <X className="h-3.5 w-3.5"/>
                                            </button>
                                        ) : null}
                                    </div>
                                );
                            })
                            : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
