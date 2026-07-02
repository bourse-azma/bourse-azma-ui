import type {Dispatch, MutableRefObject, SetStateAction} from 'react';
import {X} from 'lucide-react';
import {toMarketLabel} from './mappers';
import type {SymbolSearchSuggestion} from './types';

type SymbolSearchMode = 'recent' | 'results';

type SymbolSearchDropdownProps = {
    listboxId: string;
    sectionLabel: string;
    mode: SymbolSearchMode;
    query: string;
    loading: boolean;
    error: string | null;
    retry: () => void;
    visibleItems: SymbolSearchSuggestion[];
    selectedSymbol: SymbolSearchSuggestion | null;
    highlightedIndex: number;
    setHighlightedIndex: Dispatch<SetStateAction<number>>;
    optionRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
    selectItem: (item: SymbolSearchSuggestion) => void;
    removeRecentItem: (item: SymbolSearchSuggestion) => void;
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

export default function SymbolSearchDropdown({
                                                 listboxId,
                                                 sectionLabel,
                                                 mode,
                                                 query,
                                                 loading,
                                                 error,
                                                 retry,
                                                 visibleItems,
                                                 selectedSymbol,
                                                 highlightedIndex,
                                                 setHighlightedIndex,
                                                 optionRefs,
                                                 selectItem,
                                                 removeRecentItem,
                                             }: SymbolSearchDropdownProps) {
    return (
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
    );
}
