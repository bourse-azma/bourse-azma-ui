import {useCallback, useEffect, useState} from 'react';
import type {SymbolSearchSuggestion} from '../../symbol-search/types';
import {
    loadStoredSelectedSymbol,
    persistSelectedSymbol,
    pickRandomFeaturedSymbol,
} from '../../symbol-search/selectedSymbolState';
import {DEFAULT_SELECTED_SYMBOL} from '../constants';

type UseSelectedSymbolStateParams = {
    loginEpoch: string;
    setDrawerOpen: (open: boolean) => void;
    resetSymbolTab: () => void;
};

export function useSelectedSymbolState({
                                           loginEpoch,
                                           setDrawerOpen,
                                           resetSymbolTab,
                                       }: UseSelectedSymbolStateParams) {
    const [selectedSymbol, setSelectedSymbolState] = useState<SymbolSearchSuggestion>(
        () => loadStoredSelectedSymbol(loginEpoch) ?? DEFAULT_SELECTED_SYMBOL
    );

    const setSelectedSymbol = useCallback((symbol: SymbolSearchSuggestion) => {
        setSelectedSymbolState(symbol);
        persistSelectedSymbol(symbol, loginEpoch);
    }, [loginEpoch]);

    const [, setPreviewSymbol] = useState<SymbolSearchSuggestion | null>(null);

    const handleSelectSymbol = useCallback((symbol: SymbolSearchSuggestion) => {
        setPreviewSymbol(null);
        setSelectedSymbol(symbol);
        setDrawerOpen(false);
    }, [setDrawerOpen, setSelectedSymbol]);

    useEffect(() => {
        const stored = loadStoredSelectedSymbol(loginEpoch);
        if (stored) {
            setSelectedSymbolState(stored);
            return;
        }

        const randomSymbol = pickRandomFeaturedSymbol();
        persistSelectedSymbol(randomSymbol, loginEpoch);
        setSelectedSymbolState(randomSymbol);
    }, [loginEpoch]);

    useEffect(() => {
        resetSymbolTab();
    }, [selectedSymbol.symbol, resetSymbolTab]);

    return {
        selectedSymbol,
        setSelectedSymbol,
        setPreviewSymbol,
        handleSelectSymbol,
    };
}
