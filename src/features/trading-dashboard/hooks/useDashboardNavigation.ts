import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useClock} from '../../../hooks/useClock';
import {
    MAIN_NAV_TABS,
    type MainNavTab,
    persistMainNavTabToUrl,
    readMainNavTabFromUrl,
} from '../../navigation/mainNavTabState';
import type {BottomPanelTab, OrderbookTab, OrderFilter, SidebarTab, SymbolTab, UserProfile} from '../types';

type UseDashboardNavigationParams = {
    userProfile?: UserProfile;
};

export function useDashboardNavigation({userProfile}: UseDashboardNavigationParams) {
    const clock = useClock();
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    const [orderbookTab, setOrderbookTab] = useState<OrderbookTab>('info');
    const [symbolTab, setSymbolTab] = useState<SymbolTab>('details');
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>('watchlist');
    const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
    const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('orders');
    const [mainNavTab, setMainNavTabState] = useState<MainNavTab>(() => readMainNavTabFromUrl() ?? 'بازار');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [marketPanelOpen, setMarketPanelOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const setMainNavTab = useCallback((tab: MainNavTab) => {
        setMainNavTabState(tab);
        persistMainNavTabToUrl(tab);
    }, []);

    useEffect(() => {
        const syncTabFromUrl = () => {
            setMainNavTabState(readMainNavTabFromUrl() ?? 'بازار');
        };
        window.addEventListener('popstate', syncTabFromUrl);
        return () => window.removeEventListener('popstate', syncTabFromUrl);
    }, []);

    const isAdmin = userProfile?.role === 'ADMIN';
    const isSupportTabActive = mainNavTab === 'درخواست‌ها';
    const isMarketViewActive = mainNavTab === 'بازار';

    const clockValue = useMemo(
        () =>
            clock.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Tehran',
            }),
        [clock]
    );

    const openWalletPanel = useCallback(() => {
        setMainNavTab('بازار');
        setSidebarTab('wallet');
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            setDrawerOpen(true);
        }
    }, [setMainNavTab]);

    const resetSymbolTab = useCallback(() => {
        setSymbolTab('details');
    }, []);

    useEffect(() => {
        if (!profileMenuOpen) return;

        const onClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            // The responsive header renders both its mobile and desktop variants.
            // Only one ref can point at a variant, so identify either menu from the
            // event target instead of treating taps in the other variant as outside.
            if (target instanceof Element && target.closest('[data-profile-menu]')) return;
            setProfileMenuOpen(false);
        };

        window.addEventListener('click', onClickOutside, true);
        return () => window.removeEventListener('click', onClickOutside, true);
    }, [profileMenuOpen]);

    const bottomPanelTabs: Array<{ key: BottomPanelTab; label: string }> = [
        {key: 'orders', label: 'سفارشات'},
        {key: 'portfolio', label: 'سبد سهام'},
    ];

    const orderbookTabs: Array<{ key: OrderbookTab; label: string }> = [
        {key: 'peers', label: 'هم‌گروه'},
        {key: 'info', label: 'اطلاعات نماد'},
        {key: 'technical', label: 'تکنیکال'},
    ];

    return {
        mainNavTab,
        setMainNavTab,
        mainNavTabs: MAIN_NAV_TABS,
        isAdmin,
        isSupportTabActive,
        isMarketViewActive,
        orderbookTab,
        setOrderbookTab,
        symbolTab,
        setSymbolTab,
        sidebarTab,
        setSidebarTab,
        orderFilter,
        setOrderFilter,
        bottomPanelTab,
        setBottomPanelTab,
        drawerOpen,
        setDrawerOpen,
        marketPanelOpen,
        setMarketPanelOpen,
        profileMenuOpen,
        setProfileMenuOpen,
        profileMenuRef,
        clockValue,
        openWalletPanel,
        resetSymbolTab,
        bottomPanelTabs,
        orderbookTabs,
    };
}
