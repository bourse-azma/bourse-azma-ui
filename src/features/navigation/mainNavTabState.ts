export type MainNavTab = 'بازار' | 'درخواست‌ها' | 'گزارشات';

const TAB_PARAM = 'view';

const TAB_TO_PARAM: Record<MainNavTab, string> = {
    'بازار': 'market',
    'درخواست‌ها': 'support',
    'گزارشات': 'reports',
};

const PARAM_TO_TAB: Record<string, MainNavTab> = {
    market: 'بازار',
    support: 'درخواست‌ها',
    reports: 'گزارشات',
};

export const MAIN_NAV_TABS: MainNavTab[] = ['بازار', 'درخواست‌ها', 'گزارشات'];

export const readMainNavTabFromUrl = (): MainNavTab | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    const param = new URL(window.location.href).searchParams.get(TAB_PARAM);
    if (!param) {
        return null;
    }
    return PARAM_TO_TAB[param] ?? null;
};

export const persistMainNavTabToUrl = (tab: MainNavTab): void => {
    if (typeof window === 'undefined') {
        return;
    }
    const url = new URL(window.location.href);
    if (tab === 'بازار') {
        url.searchParams.delete(TAB_PARAM);
    } else {
        url.searchParams.set(TAB_PARAM, TAB_TO_PARAM[tab]);
    }
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
};
