import {useEffect, useMemo, useState} from 'react';
import {AlertCircle, Search} from 'lucide-react';
import {getIndustries, getIndustrySymbols} from './api';
import type {IndustrySummary, IndustrySymbol} from './types';
import type {SymbolSearchSuggestion} from '../symbol-search/types';
import IndustrySymbolsModal from './IndustrySymbolsModal';

const formatFaInteger = (value: number) => new Intl.NumberFormat('en-US').format(value);

type IndustriesTabContentProps = {
    accessToken: string;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
};

export default function IndustriesTabContent({accessToken, onSelectSymbol}: IndustriesTabContentProps) {
    const [industries, setIndustries] = useState<IndustrySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState<IndustrySummary | null>(null);
    const [symbols, setSymbols] = useState<IndustrySymbol[]>([]);
    const [symbolsLoading, setSymbolsLoading] = useState(false);
    const [symbolsError, setSymbolsError] = useState<string | null>(null);
    const [symbolSearchQuery, setSymbolSearchQuery] = useState('');

    const loadIndustries = () => {
        setLoading(true);
        setError(null);
        void getIndustries(accessToken)
            .then((items) => {
                setIndustries(items);
            })
            .catch((loadError: unknown) => {
                setIndustries([]);
                setError(loadError instanceof Error ? loadError.message : 'دریافت لیست صنایع ناموفق بود.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadIndustries();
    }, [accessToken]);

    useEffect(() => {
        if (!selectedIndustry) {
            setSymbols([]);
            setSymbolsError(null);
            setSymbolsLoading(false);
            setSymbolSearchQuery('');
            return;
        }

        const controller = new AbortController();
        setSymbolsLoading(true);
        setSymbolsError(null);
        setSymbols([]);
        setSymbolSearchQuery('');

        void getIndustrySymbols(accessToken, selectedIndustry.name, controller.signal)
            .then((result) => {
                setSymbols(result.symbols);
            })
            .catch((loadError: unknown) => {
                if (controller.signal.aborted) return;
                setSymbols([]);
                setSymbolsError(loadError instanceof Error ? loadError.message : 'دریافت نمادهای صنعت ناموفق بود.');
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setSymbolsLoading(false);
                }
            });

        return () => controller.abort();
    }, [accessToken, selectedIndustry]);

    const filteredIndustries = useMemo(() => {
        const normalized = searchQuery.trim().toLowerCase();
        if (!normalized) return industries;
        return industries.filter((industry) => industry.name.toLowerCase().includes(normalized));
    }, [industries, searchQuery]);

    const closeModal = () => {
        setSelectedIndustry(null);
    };

    if (loading) {
        return (
            <div className="space-y-2">
                <div className="h-10 animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
                <div className="h-[250px] animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-negative/35 bg-negative/10 p-3 text-xs text-negative">
                <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4"/>
                    {error}
                </div>
                <button
                    type="button"
                    onClick={loadIndustries}
                    className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="relative mb-3">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="جستجوی صنعت..."
                    className="h-10 w-full rounded-xl border border-border/80 bg-surface px-3 pr-9 text-xs text-text outline-none transition placeholder:text-muted focus:border-primary/35"
                />
            </div>

            <section className="rounded-xl border border-border/70 bg-surface">
                <header
                    className="border-b border-border/70 bg-surface-2 px-3 py-2 text-[11px] font-semibold text-muted">
                    <div className="flex items-center justify-between gap-2">
                        <span>نام صنعت</span>
                        <span>تعداد نماد</span>
                    </div>
                </header>

                {filteredIndustries.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-6 text-center">
                        <h4 className="text-sm font-semibold text-text">صنعتی یافت نشد</h4>
                        <p className="mt-1 text-xs text-muted">عبارت جستجو را تغییر دهید.</p>
                    </div>
                ) : (
                    <div className="thin-scrollbar max-h-[292px] overflow-y-auto">
                        {filteredIndustries.map((industry) => (
                            <button
                                key={industry.name}
                                type="button"
                                onClick={() => setSelectedIndustry(industry)}
                                className="flex w-full items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5 text-right text-xs transition last:border-b-0 hover:bg-surface-2/70"
                            >
                                <span className="min-w-0 flex-1 truncate font-semibold text-text">{industry.name}</span>
                                <span
                                    className="shrink-0 rounded-full border border-border/70 bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-muted">
                                    {formatFaInteger(industry.symbolCount)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {selectedIndustry ? (
                <IndustrySymbolsModal
                    selectedIndustry={selectedIndustry}
                    symbols={symbols}
                    symbolsLoading={symbolsLoading}
                    symbolsError={symbolsError}
                    symbolSearchQuery={symbolSearchQuery}
                    onSymbolSearchQueryChange={setSymbolSearchQuery}
                    onSelectSymbol={onSelectSymbol}
                    onRetry={() => setSelectedIndustry({...selectedIndustry})}
                    onClose={closeModal}
                    formatFaInteger={formatFaInteger}
                />
            ) : null}
        </>
    );
}
