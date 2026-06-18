import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Bell,
    Building2,
    Check,
    ChevronDown,
    Clock3,
    Coins,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    Loader2,
    Menu,
    Moon,
    Pencil,
    Plus,
    RefreshCw,
    Star,
    Sun,
    Trash2,
    UserRound,
    Wallet,
    X,
} from 'lucide-react';
import type {Theme} from './hooks/useTheme';
import {appConfig} from './config/appConfig';
import SymbolSearchCombobox from './features/symbol-search/SymbolSearchCombobox';
import {getCodalNotices} from './features/symbol-search/api';
import {toExchangeBadge, toMarketLabel} from './features/symbol-search/mappers';
import type {SymbolSearchSuggestion} from './features/symbol-search/types';
import {loadStoredSelectedSymbol, persistSelectedSymbol} from './features/symbol-search/selectedSymbolState';
import {useSymbolDetails} from './features/symbol-search/useSymbolDetails';
import {usePeerGroup} from './features/symbol-search/usePeerGroup';
import {useSymbolSearch} from './features/symbol-search/useSymbolSearch';
import OrderBookPanel from './features/symbol-search/OrderBookPanel';
import OrderBookDepthPanel from './features/symbol-search/OrderBookDepthPanel';
import PeerGroupPanel, {ORDERBOOK_SLOT_HEIGHT_CLASS} from './features/symbol-search/PeerGroupPanel';
import {getAskPriceRange, getBidPriceRange, normalizeOrderBookRows} from './features/symbol-search/orderBookUtils';
import AccountStatusBar from './features/trading/AccountStatusBar';
import IndustriesTabContent from './features/industries/IndustriesTabContent';
import {type AccountSummary, computeAccountSummary} from './features/trading/accountSummary';
import {
    cancelTradingOrder,
    type CreateOrderResult,
    getPortfolioHoldings,
    getTradingOrders,
    type OrderSide,
    type OrderStatusType,
    type PortfolioHolding,
    type TradingOrder
} from './features/trading/api';
import {useInstrumentLivePrices} from './features/trading/useInstrumentLivePrices';
import OrderPlacementModal from './features/trading/order-placement/OrderPlacementModal';
import type {OrderSymbolContext} from './features/trading/order-placement/types';
import {
    createDefaultNoticeFilters,
    type JalaliDateParts,
    type NoticeUiFilters,
    toAppliedNoticeFilters,
    toNoticeQuery,
    withNoticeSymbol,
} from './features/notices/filterState';
import {
    addSymbolToWatchlist,
    createWatchlist,
    deleteWatchlist,
    getWatchlists,
    removeSymbolFromWatchlist,
    updateWatchlist,
    type Watchlist,
} from './features/watchlist/api';

type SidebarTab = 'watchlist' | 'industries' | 'wallet';
type MainNavTab = 'بازار' | 'درخواست‌ها' | 'گزارشات';
type SymbolTab = 'notices' | 'details';
type OrderbookTab = 'peers' | 'info' | 'technical';
type OrderFilter = 'open' | 'partial' | 'done' | 'cancelled' | 'failed' | 'all';
type BottomPanelTab = 'orders' | 'portfolio';

type DemoOrderRow = {
    id: number;
    type: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    remainingQuantity: number;
    executedQuantity: number;
    orderPrice: number;
    averageExecutedPrice: number | null;
    livePrice: number | null;
    time: string;
    status: OrderStatusType;
    statusLabel: string;
    cancellable: boolean;
};

type DemoPortfolioRow = {
    id: string;
    time: string;
    symbol: string;
    quantity: number;
    buyPrice: number;
    livePrice: number | null;
};

type UserProfile = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    nationalCode: string;
    phoneNumber: string;
    email: string;
    role: string;
    balance?: number;
};

type TradingDashboardProps = {
    theme: Theme;
    accessToken: string;
    onToggleTheme: (origin?: { x: number; y: number }) => void;
    profileDisplayName: string;
    onOpenProfile: () => void;
    onLogout: () => void;
    userProfile?: UserProfile;
    onProfileUpdated?: (profile: UserProfile) => void;
};

type MarketOverviewResult = {
    indexValue: number;
    indexChange: number;
    totalTrades: number;
    totalTradeValue: number;
    totalTradeVolume: number;
    marketStateTitle: string;
};

type MarketOverviewApiResult = {
    marketOverview?: {
        totalIndexValue: number;
        totalIndexChange: number;
        totalTradeCount: number;
        totalTradeValue: number;
        totalTradeVolume: number;
        marketStateTitle: string;
    };
};

type MarketOverviewApiResponse = {
    code: number;
    result?: MarketOverviewApiResult;
};

type CodalNoticeSupervision = {
    underSupervision: number;
    additionalInfo: string;
    reasons: string[];
};

type CodalNotice = {
    tracingNumber: number;
    symbol: string;
    companyName: string;
    underSupervision: number;
    supervision: CodalNoticeSupervision;
    title: string;
    letterCode: string;
    sentDateTime: string;
    publishDateTime: string;
    reportUrl: string;
    pdfUrl: string;
    excelUrl: string;
    attachmentUrl: string;
    hasPdf: boolean;
    hasExcel: boolean;
    hasAttachment: boolean;
};

type CodalNoticesResult = {
    totalCount: number;
    page: number;
    notices: CodalNotice[];
};

type CodalNoticesQuery = {
    includeAudited: boolean;
    auditorRef: number;
    categoryCode: number;
    includeChildCategories: boolean;
    companyState: number;
    companyType: number;
    includeConsolidated: boolean;
    isNotAuditedFilter: boolean;
    length: number;
    letterType: number;
    includeMainCategories: boolean;
    includeNotAudited: boolean;
    includeNotConsolidated: boolean;
    page: number;
    publisher: boolean;
    reportingType: number;
    symbol: string;
    tracingNumber: number;
};

type NoticeGroup = {
    id: string;
    title: string;
    publishDateTime: string;
    symbols: string[];
    notices: CodalNotice[];
    hasUnderSupervision: boolean;
};

type WatchlistModalState =
    | { mode: 'create'; pendingSymbol?: SymbolSearchSuggestion }
    | {
    mode: 'edit';
    watchlistId: number;
    originalName: string;
};

const WATCHLIST_TABLE_GRID = 'grid grid-cols-[minmax(0,1fr)_5.25rem_4.5rem] items-center gap-x-2';

type WatchlistToast = {
    id: number;
    title?: string;
    message: string;
    tone: 'success' | 'error';
};

const JALALI_MONTHS = [
    {value: 1, label: 'فروردین'},
    {value: 2, label: 'اردیبهشت'},
    {value: 3, label: 'خرداد'},
    {value: 4, label: 'تیر'},
    {value: 5, label: 'مرداد'},
    {value: 6, label: 'شهریور'},
    {value: 7, label: 'مهر'},
    {value: 8, label: 'آبان'},
    {value: 9, label: 'آذر'},
    {value: 10, label: 'دی'},
    {value: 11, label: 'بهمن'},
    {value: 12, label: 'اسفند'},
] as const;

const CODAL_MAX_LENGTH = 12;
const CODAL_MAX_PAGE_LENGTH = CODAL_MAX_LENGTH;
const SYMBOL_NOTICE_PAGES_PER_LOAD = 2;

const DEFAULT_CODAL_NOTICE_QUERY: CodalNoticesQuery = {
    includeAudited: true,
    auditorRef: -1,
    categoryCode: -1,
    includeChildCategories: true,
    companyState: -1,
    companyType: -1,
    includeConsolidated: true,
    isNotAuditedFilter: false,
    length: CODAL_MAX_LENGTH,
    letterType: -1,
    includeMainCategories: true,
    includeNotAudited: true,
    includeNotConsolidated: true,
    page: 1,
    publisher: false,
    reportingType: -1,
    symbol: '',
    tracingNumber: -1,
};

const DEFAULT_SELECTED_SYMBOL: SymbolSearchSuggestion = {
    key: 'TSE:فولاد:46348559193224090',
    type: 'TSE',
    symbol: 'فولاد',
    name: 'فولاد مبارکه اصفهان',
    instrumentCode: '46348559193224090',
    isin: 'IRO1FOLD0001',
    oldInstrumentCodes: [],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toLtrIsolated = (value: string) => `\u2066${value}\u2069`;

export const formatNumberFa = (value: number, digits = 0) =>
    toLtrIsolated(
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(value)
    );

export const formatPercentFa = (value: number, digits = 2) => {
    const sign = value > 0 ? '+' : '';
    return toLtrIsolated(`${sign}${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value)}%`);
};

const formatNumberOrDash = (value: number | null | undefined, digits = 0) =>
    value === null || value === undefined || Number.isNaN(value) ? 'ناموجود' : formatNumberFa(value, digits);

const formatOrderBookValue = (value: number | null | undefined, digits = 0) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }
    return formatNumberFa(value, digits);
};

const formatDepthPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '0%';
    }
    return formatPercentFa(value, 0);
};

const formatPercentOrDash = (value: number | null | undefined, digits = 2) =>
    value === null || value === undefined || Number.isNaN(value) ? 'ناموجود' : formatPercentFa(value, digits);

const formatCompactValue = (value: number, unit: 'T' | 'B') => {
    const divisor = unit === 'T' ? 1_000_000_000_000 : 1_000_000_000;
    return `${formatNumberFa(value / divisor, 2)}${unit}`;
};

const formatCompactValueOrUnavailable = (value: number | null | undefined, unit: 'T' | 'B') =>
    value === null || value === undefined || Number.isNaN(value) ? 'ناموجود' : formatCompactValue(value, unit);

const formatCompactAmountFa = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'ناموجود';
    const absolute = Math.abs(value);
    if (absolute >= 1_000_000_000_000) {
        return `${formatNumberFa(value / 1_000_000_000_000, 2)}T`;
    }
    if (absolute >= 1_000_000_000) {
        return `${formatNumberFa(value / 1_000_000_000, 2)}B`;
    }
    if (absolute >= 1_000_000) {
        return `${formatNumberFa(value / 1_000_000, 2)}M`;
    }
    if (absolute >= 1_000) {
        return `${formatNumberFa(value / 1_000, 2)}K`;
    }
    return formatNumberFa(value);
};

const formatNumberWithUnit = (value: number | null | undefined, unit: string, digits = 0) => {
    const formatted = formatNumberOrDash(value, digits);
    return formatted === 'ناموجود' ? formatted : `${formatted} ${unit}`;
};

const extractApiErrorMessage = (data: unknown, fallback: string) => {
    if (!data || typeof data !== 'object') return fallback;
    const response = data as { message?: string; result?: { detail?: string; errors?: Record<string, string> } };
    const fieldError = response.result?.errors ? Object.values(response.result.errors)[0] : null;
    if (typeof fieldError === 'string' && fieldError.trim() !== '') return fieldError;
    if (typeof response.result?.detail === 'string' && response.result.detail.trim() !== '') return response.result.detail;
    if (typeof response.message === 'string' && response.message.trim() !== '') return response.message;
    return fallback;
};

const formatFaInteger = (value: number) => new Intl.NumberFormat('fa-IR').format(value);
const formatFaPlainInteger = (value: number) =>
    new Intl.NumberFormat('fa-IR', {useGrouping: false}).format(value);

const formatInstantFa = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'ناموجود';
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tehran',
    }).format(date);
};

const toEnglishDigits = (value: string) =>
    value
        .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const parseJalaliDateTime = (value: string) => {
    const normalized = toEnglishDigits(value).trim();
    const match = normalized.match(
        /(?<year>\d{4})\/(?<month>\d{1,2})\/(?<day>\d{1,2})(?:\s+(?<hour>\d{1,2}):(?<minute>\d{1,2})(?::(?<second>\d{1,2}))?)?/
    );

    if (!match?.groups) return null;

    const year = Number(match.groups.year);
    const month = Number(match.groups.month);
    const day = Number(match.groups.day);
    const hour = Number(match.groups.hour ?? '0');
    const minute = Number(match.groups.minute ?? '0');
    const second = Number(match.groups.second ?? '0');

    if ([year, month, day, hour, minute, second].some((part) => Number.isNaN(part))) return null;

    const dateKey = Number(
        `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
    );

    const dateTimeKey = Number(
        `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day
            .toString()
            .padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute
            .toString()
            .padStart(2, '0')}${second.toString().padStart(2, '0')}`
    );

    return {year, month, day, dateKey, dateTimeKey};
};

const dateKeyFromParts = (parts: JalaliDateParts) =>
    Number(
        `${parts.year.toString().padStart(4, '0')}${parts.month
            .toString()
            .padStart(2, '0')}${parts.day.toString().padStart(2, '0')}`
    );

const stripHtml = (value: string) =>
    value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n')
        .trim();

const normalizePath = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const joinUrl = (baseUrl: string, path: string) => `${trimTrailingSlash(baseUrl)}${normalizePath(path)}`;
const applyTemplate = (template: string, values: Record<string, string>) => {
    let resolved = template;
    Object.entries(values).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return resolved;
};

const buildCodalNoticeParams = (query: CodalNoticesQuery) => {
    const params = new URLSearchParams();
    const safeLength = clamp(Math.floor(query.length), 1, CODAL_MAX_PAGE_LENGTH);
    params.set('includeAudited', String(query.includeAudited));
    params.set('auditorRef', String(query.auditorRef));
    params.set('categoryCode', String(query.categoryCode));
    params.set('includeChildCategories', String(query.includeChildCategories));
    params.set('companyState', String(query.companyState));
    params.set('companyType', String(query.companyType));
    params.set('includeConsolidated', String(query.includeConsolidated));
    params.set('isNotAuditedFilter', String(query.isNotAuditedFilter));
    params.set('length', String(safeLength));
    params.set('letterType', String(query.letterType));
    params.set('includeMainCategories', String(query.includeMainCategories));
    params.set('includeNotAudited', String(query.includeNotAudited));
    params.set('includeNotConsolidated', String(query.includeNotConsolidated));
    params.set('page', String(query.page));
    params.set('publisher', String(query.publisher));
    params.set('reportingType', String(query.reportingType));
    params.set('tracingNumber', String(query.tracingNumber));

    const symbol = query.symbol.trim();
    if (symbol !== '') {
        params.set('symbol', symbol);
    }

    return params;
};

const toNoticeIdentityKey = (notice: CodalNotice) =>
    `${notice.tracingNumber}|${notice.symbol}|${notice.publishDateTime}|${notice.title}`;

const toSingleNoticeGroup = (notice: CodalNotice): NoticeGroup => {
    const noticeSymbols = getNoticeSymbols(notice);
    const underSupervision = notice.supervision?.underSupervision === 1 || notice.underSupervision === 1;

    return {
        id: toNoticeIdentityKey(notice),
        title: notice.title.trim() || 'بدون عنوان',
        publishDateTime: notice.publishDateTime || notice.sentDateTime || 'ناموجود',
        symbols: noticeSymbols,
        notices: [notice],
        hasUnderSupervision: underSupervision,
    };
};

const mergeUniqueNotices = (existing: CodalNotice[], incoming: CodalNotice[]) => {
    const seen = new Set(existing.map(toNoticeIdentityKey));
    const merged = [...existing];

    incoming.forEach((notice) => {
        const key = toNoticeIdentityKey(notice);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(notice);
    });

    return merged;
};

const NON_SYMBOL_TITLE_TOKENS = new Set([
    'اصلاحیه',
    'حسابرسی',
    'حسابرسیشده',
    'حسابرسی نشده',
    'حسابرسی‌شده',
    'حسابرسی‌نشده',
    'حسابرسي',
    'شده',
    'نشده',
    'بورس',
    'فرابورس',
    'کارگزاری',
    'کارگزاري',
]);

const normalizeSymbolText = (value: string) =>
    value
        .replace(/[()]/g, '')
        .replace(/[ـ]/g, '')
        .replace(/\u200c/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const parseNumberish = (value: string) => {
    const normalized = toEnglishDigits(value).replace(/[,_\s\u066C\u060C]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
};

const isLikelyMarketSymbol = (value: string) => {
    if (value === '') return false;
    if (value.length < 2 || value.length > 20) return false;
    if (NON_SYMBOL_TITLE_TOKENS.has(value)) return false;
    if (value.includes(' ')) return false;
    return /^[\u0600-\u06FFA-Za-z0-9-]+$/u.test(value);
};

const extractSymbolsFromTitle = (title: string) => {
    const fromParentheses = Array.from(title.matchAll(/\(([^()]+)\)/g))
        .flatMap((match) => match[1].split(/[،,]/))
        .flatMap((part) => part.split(/\s+و\s+/))
        .map((item) => normalizeSymbolText(item))
        .filter(isLikelyMarketSymbol);

    return Array.from(new Set(fromParentheses));
};

const getNoticeSymbols = (notice: CodalNotice) => {
    const extracted = extractSymbolsFromTitle(notice.title ?? '');
    const symbol = normalizeSymbolText(notice.symbol ?? '');
    const symbolLooksGeneric = /بورس|فرابورس|کارگزاری|کارگزاري/.test(symbol);

    const result: string[] = [];

    // Keep API symbol by default (even with spaces), unless title already provides explicit symbols
    // and API symbol is a generic organization label.
    if (!(extracted.length > 0 && symbolLooksGeneric) && symbol !== '' && symbol !== '-') {
        result.push(symbol);
    }

    extracted.forEach((item) => {
        if (!result.includes(item)) {
            result.push(item);
        }
    });

    return result;
};

export function useClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    return now;
}

function useMarketOverview(marketId: '1' | '2') {
    const [data, setData] = useState<MarketOverviewResult | null>(null);

    useEffect(() => {
        let timer = 0;
        let active = true;

        const fetchOverview = async () => {
            try {
                const response = await fetch(
                    joinUrl(
                        appConfig.marketOverviewApiBaseUrl,
                        applyTemplate(appConfig.marketOverviewApiPath, {marketId})
                    )
                );
                if (!response.ok) return;

                const payload = (await response.json()) as MarketOverviewApiResponse;
                const overview = payload.result?.marketOverview;
                if (!active || payload.code !== 200 || !overview) return;

                setData({
                    indexValue: overview.totalIndexValue,
                    indexChange: overview.totalIndexChange,
                    totalTrades: overview.totalTradeCount,
                    totalTradeValue: overview.totalTradeValue,
                    totalTradeVolume: overview.totalTradeVolume,
                    marketStateTitle: overview.marketStateTitle,
                });
            } catch {
                // Keep previously rendered data on transient network failures.
            }
        };

        const tick = async () => {
            await fetchOverview();
            if (!active) return;
            timer = window.setTimeout(tick, appConfig.marketOverviewRefreshMs);
        };

        void tick();

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [marketId]);

    return data;
}

function useCodalNotices(
    query: CodalNoticesQuery,
    options?: {
        enabled?: boolean;
        autoRefresh?: boolean;
        errorMessage?: string;
        pagesPerLoad?: number;
    }
) {
    const enabled = options?.enabled ?? true;
    const autoRefresh = options?.autoRefresh ?? true;
    const errorMessage = options?.errorMessage ?? 'دریافت پیام‌های ناظر با خطا مواجه شد.';
    const pagesPerLoad = clamp(Math.floor(options?.pagesPerLoad ?? 1), 1, 4);

    const [state, setState] = useState<{
        notices: CodalNotice[];
        totalCount: number;
        page: number;
        loading: boolean;
        loadingMore: boolean;
        refreshing: boolean;
        hasMore: boolean;
        error: string | null;
    }>({
        notices: [],
        totalCount: 0,
        page: 1,
        loading: true,
        loadingMore: false,
        refreshing: false,
        hasMore: true,
        error: null,
    });

    const [pageToLoad, setPageToLoad] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);
    const didInitRef = useRef(false);
    const requestInFlightRef = useRef(false);
    const loadedPageRef = useRef(0);

    const querySignature = useMemo(() => {
        const params = buildCodalNoticeParams({...query, page: 1});
        params.delete('page');
        return params.toString();
    }, [query]);

    useEffect(() => {
        if (!enabled) {
            setState({
                notices: [],
                totalCount: 0,
                page: 1,
                loading: false,
                loadingMore: false,
                refreshing: false,
                hasMore: false,
                error: null,
            });
            loadedPageRef.current = 0;
            setPageToLoad(1);
            loadedPageRef.current = 0;
            return;
        }

        if (!didInitRef.current) {
            didInitRef.current = true;
            return;
        }

        setState((prev) => ({
            ...prev,
            notices: [],
            totalCount: 0,
            page: 1,
            loading: true,
            loadingMore: false,
            refreshing: false,
            hasMore: true,
            error: null,
        }));
        loadedPageRef.current = 0;
        setPageToLoad(1);
        setReloadKey((prev) => prev + 1);
    }, [enabled, querySignature]);

    useEffect(() => {
        if (!enabled) return;

        let active = true;
        const controller = new AbortController();
        const isFirstPage = pageToLoad === 1;
        const requestLength = clamp(Math.floor(query.length), 1, CODAL_MAX_PAGE_LENGTH);
        requestInFlightRef.current = true;

        setState((prev) => ({
            ...prev,
            loading: isFirstPage && prev.notices.length === 0,
            refreshing: isFirstPage && prev.notices.length > 0,
            loadingMore: !isFirstPage,
            error: null,
        }));

        const fetchNotices = async () => {
            try {
                let mergedNotices: CodalNotice[] = [];
                let totalCount = 0;
                let lastLoadedPage = isFirstPage ? 0 : pageToLoad - 1;
                const pagesToFetch = isFirstPage ? 1 : pagesPerLoad;

                for (let index = 0; index < pagesToFetch; index += 1) {
                    const requestPage = isFirstPage ? 1 : pageToLoad + index;
                    const requestQuery: CodalNoticesQuery = {
                        ...query,
                        page: requestPage,
                        length: requestLength,
                    };
                    const queryString = buildCodalNoticeParams(requestQuery).toString();
                    const payload = await getCodalNotices<CodalNoticesResult>(queryString, controller.signal);
                    if (!active) return;

                    const incoming = payload.notices ?? [];
                    totalCount = payload.totalCount ?? totalCount;
                    mergedNotices = mergeUniqueNotices(mergedNotices, incoming);
                    lastLoadedPage = requestPage;

                    const reachedTotal = totalCount > 0 && mergedNotices.length >= totalCount;
                    const pageIncomplete = incoming.length < requestLength;
                    if (reachedTotal || pageIncomplete) break;
                }

                setState((prev) => {
                    const notices = isFirstPage
                        ? mergedNotices
                        : mergeUniqueNotices(prev.notices, mergedNotices);
                    const resolvedTotalCount = totalCount > 0 ? totalCount : prev.totalCount;
                    const hasMore =
                        resolvedTotalCount > 0
                            ? notices.length < resolvedTotalCount
                            : mergedNotices.length >= requestLength;

                    loadedPageRef.current = lastLoadedPage;

                    return {
                        notices,
                        totalCount: resolvedTotalCount,
                        page: lastLoadedPage,
                        loading: false,
                        loadingMore: false,
                        refreshing: false,
                        hasMore,
                        error: null,
                    };
                });
            } catch {
                if (!active || controller.signal.aborted) return;
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    loadingMore: false,
                    refreshing: false,
                    error: errorMessage,
                }));
            } finally {
                requestInFlightRef.current = false;
            }
        };

        void fetchNotices();

        return () => {
            active = false;
            requestInFlightRef.current = false;
            controller.abort();
        };
    }, [enabled, errorMessage, pagesPerLoad, pageToLoad, query, reloadKey]);

    const loadMore = () => {
        if (requestInFlightRef.current) return;
        if (state.loading || state.loadingMore || state.refreshing || !state.hasMore) return;
        setState((prev) => ({...prev, loadingMore: true}));
        requestInFlightRef.current = true;
        setPageToLoad(loadedPageRef.current + 1);
    };

    const refresh = () => {
        setPageToLoad(1);
        setReloadKey((prev) => prev + 1);
    };

    useEffect(() => {
        if (!enabled || !autoRefresh) return;

        let timer: number;
        let active = true;
        const tick = () => {
            if (!active) return;
            if (requestInFlightRef.current) {
                timer = window.setTimeout(tick, 1000);
                return;
            }
            setPageToLoad(1);
            setReloadKey((prev) => prev + 1);
            timer = window.setTimeout(tick, state.error ? appConfig.apiErrorRetryMs : appConfig.codalNoticesRefreshMs);
        };
        timer = window.setTimeout(tick, state.error ? appConfig.apiErrorRetryMs : appConfig.codalNoticesRefreshMs);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [autoRefresh, enabled, querySignature, state.error]);

    return {...state, loadMore, refresh};
}

const cardClass = 'rounded-2xl border border-border/70 bg-surface shadow-card dark:shadow-none';
const actionBtnClass =
    'inline-flex h-10 items-center justify-center rounded-xl border border-border/80 bg-surface-2 px-3 text-muted transition hover:border-primary/35 hover:text-text focus-visible:ring-2 focus-visible:ring-primary/45';

type WalletTx = {
    id: number;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
};

function WalletReportsPanel({accessToken}: { accessToken: string }) {
    const [txs, setTxs] = useState<WalletTx[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTxs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/wallet/transactions', {
                headers: {Authorization: `Bearer ${accessToken}`},
            });
            const data = await res.json();
            if (res.ok && data.result) {
                setTxs(data.result);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        void fetchTxs();
    }, [fetchTxs]);

    const totalCount = txs.length;
    const totalNet = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const inflowCount = txs.filter((tx) => tx.amount > 0).length;
    const outflowCount = txs.filter((tx) => tx.amount < 0).length;
    const latestTx = txs[0];

    return (
        <section dir="rtl" className={`${cardClass} overflow-hidden`}>
            <div
                className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div
                            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface-2 px-3 py-1 text-[10px] text-muted">
                            <Wallet className="h-3.5 w-3.5 text-primary"/>
                            گزارشات مالی
                        </div>
                        <h2 className="mt-3 text-base font-bold text-text">گزارشات کیف پول</h2>
                        <p className="mt-1 max-w-xl text-xs leading-6 text-muted">
                            مرور سریع تراکنش‌ها، تشخیص جریان ورود و خروج، و بررسی آخرین تغییرات موجودی.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void fetchTxs()}
                        disabled={loading}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-surface-2 px-3 text-xs font-medium text-muted transition hover:border-primary/30 hover:text-text disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> :
                            <RefreshCw className="h-3.5 w-3.5"/>}
                        بروزرسانی
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/60 bg-surface-2/80 px-3 py-3">
                        <div className="text-[10px] text-muted">تراکنش‌ها</div>
                        <div
                            className="mt-1 text-lg font-bold tabular-nums text-text">{formatFaInteger(totalCount)}</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-surface-2/80 px-3 py-3">
                        <div className="text-[10px] text-muted">جریان خالص</div>
                        <div
                            className={`mt-1 text-lg font-bold tabular-nums ${totalNet >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {totalNet >= 0 ? '+' : ''}{formatFaInteger(totalNet)} ریال
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-surface-2/80 px-3 py-3">
                        <div className="text-[10px] text-muted">ورودی‌ها</div>
                        <div
                            className="mt-1 text-lg font-bold tabular-nums text-positive">{formatFaInteger(inflowCount)}</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-surface-2/80 px-3 py-3">
                        <div className="text-[10px] text-muted">خروجی‌ها</div>
                        <div
                            className="mt-1 text-lg font-bold tabular-nums text-negative">{formatFaInteger(outflowCount)}</div>
                    </div>
                    <div
                        className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-border/60 bg-surface-2/80 px-3 py-3">
                        <div className="text-[10px] text-muted">آخرین وضعیت</div>
                        <div className="mt-1 text-sm font-semibold text-text">
                            {latestTx ? (latestTx.amount > 0 ? 'افزایش موجودی' : 'کاهش موجودی') : 'بدون تراکنش'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-5">
                {loading && txs.length === 0 ? (
                    <div
                        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-surface-2 py-12 text-xs text-muted">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        در حال بارگذاری گزارشات...
                    </div>
                ) : txs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-surface-2 p-8 text-center">
                        <div
                            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-surface text-muted">
                            <Wallet className="h-5 w-5"/>
                        </div>
                        <div className="text-sm font-semibold text-text">هنوز تراکنشی ثبت نشده است</div>
                        <p className="mt-1 text-xs leading-6 text-muted">
                            بعد از اولین واریز یا برداشت، جزئیات اینجا به صورت فهرست زمانی نمایش داده می‌شود.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {txs.map((tx) => {
                            const isIncrease = tx.amount > 0;
                            return (
                                <div
                                    key={tx.id}
                                    className="group flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-surface-2/70 p-3 text-xs transition hover:border-primary/25 hover:bg-surface-2"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span
                                            className={`mt-0.5 rounded-2xl p-2 ${isIncrease ? 'bg-positive/12 text-positive' : 'bg-negative/12 text-negative'}`}
                                        >
                                            {isIncrease ? <ArrowUpRight className="h-3.5 w-3.5"/> :
                                                <ArrowDownLeft className="h-3.5 w-3.5"/>}
                                        </span>
                                        <div className="min-w-0">
                                            <div
                                                className="font-semibold leading-relaxed text-text">{tx.description}</div>
                                            <div className="mt-1 text-[10px] text-muted">
                                                {new Date(tx.createdAt).toLocaleDateString('fa-IR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-left">
                                        <div
                                            className={`font-bold tabular-nums ${isIncrease ? 'text-positive' : 'text-negative'}`}>
                                            {isIncrease ? '+' : ''}{tx.amount.toLocaleString('fa-IR')} ریال
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-muted tabular-nums">
                                            موجودی: {tx.balanceAfter.toLocaleString('fa-IR')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

type WalletActionType = 'ADD' | 'SUBTRACT' | 'SET' | 'PERCENT_ADD' | 'PERCENT_SUBTRACT';

const WALLET_ACTIONS: { type: WalletActionType; label: string; hint: string }[] = [
    {type: 'ADD', label: 'افزایش', hint: 'واریز به کیف پول'},
    {type: 'SUBTRACT', label: 'کاهش', hint: 'برداشت از کیف پول'},
    {type: 'SET', label: 'تنظیم', hint: 'تعیین موجودی دقیق'},
    {type: 'PERCENT_ADD', label: '+ درصد', hint: 'افزایش درصدی'},
    {type: 'PERCENT_SUBTRACT', label: '- درصد', hint: 'کاهش درصدی'},
];

const computeProjectedBalance = (currentBalance: number, actionType: WalletActionType, rawValue: number) => {
    switch (actionType) {
        case 'SET':
            return rawValue;
        case 'ADD':
            return currentBalance + rawValue;
        case 'SUBTRACT':
            return currentBalance - rawValue;
        case 'PERCENT_ADD':
            return currentBalance + Math.round((currentBalance * rawValue) / 100);
        case 'PERCENT_SUBTRACT':
            return currentBalance - Math.round((currentBalance * rawValue) / 100);
        default:
            return currentBalance;
    }
};

function WalletTabContent({
                              userProfile,
                              accountSummary,
                              accessToken,
                              onProfileUpdated,
                          }: {
    userProfile?: UserProfile;
    accountSummary: AccountSummary;
    accessToken: string;
    onProfileUpdated?: (profile: UserProfile) => void;
}) {
    const [actionType, setActionType] = useState<WalletActionType>('ADD');
    const [value, setValue] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const currentBalance = accountSummary.customerBalance;
    const {buyingPower, blockedAmount} = accountSummary;
    const parsedValue = value.trim() === '' ? null : Number.parseFloat(value);
    const projectedBalance =
        parsedValue !== null && Number.isFinite(parsedValue)
            ? computeProjectedBalance(currentBalance, actionType, parsedValue)
            : null;
    const isPercentAction = actionType.startsWith('PERCENT');

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!value || parsedValue === null || !Number.isFinite(parsedValue)) return;
        if (parsedValue < 0) {
            setError('مقدار واردشده نمی‌تواند منفی باشد.');
            return;
        }
        if (isPercentAction && parsedValue > 100) {
            setError('درصد نمی‌تواند بیشتر از ۱۰۰ باشد.');
            return;
        }
        if (projectedBalance !== null && projectedBalance < 0) {
            setError('این عملیات موجودی را منفی می‌کند. مبلغ را کاهش دهید.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/v1/wallet/adjust', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    type: actionType,
                    value: parsedValue,
                    description: description.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(extractApiErrorMessage(data, 'خطا در انجام عملیات'));
            }
            if (data.result && onProfileUpdated) {
                onProfileUpdated(data.result);
            }
            setSuccess('موجودی با موفقیت به‌روزرسانی شد.');
            setValue('');
            setDescription('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'خطا در ثبت تغییرات');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            <div
                className="relative overflow-hidden rounded-3xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.98))] p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(15,23,42,0.98))]">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_42%)]"/>
                <div
                    className="pointer-events-none absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-slate-900/5 blur-2xl dark:bg-white/5"/>
                <div
                    className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"/>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div
                                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-1 text-[10px] text-muted">
                                <Wallet className="h-3.5 w-3.5 text-emerald-600"/>
                                کیف پول
                            </div>
                            <div className="mt-3 text-sm font-semibold text-text">
                                {userProfile?.firstName} {userProfile?.lastName}
                            </div>
                            <div className="mt-1 text-[10px] text-muted" dir="ltr">
                                @{userProfile?.username}
                            </div>
                        </div>
                        <div
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-surface text-emerald-600">
                            <Wallet className="h-4 w-4"/>
                        </div>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-border/70 bg-surface/90 px-4 py-3">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted">مانده مشتری</span>
                            <span className="font-semibold tabular-nums text-text">
                                {currentBalance.toLocaleString('fa-IR')} ریال
                            </span>
                        </div>
                        {blockedAmount > 0 ? (
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="text-muted">بلوکه شده</span>
                                <span className="font-semibold tabular-nums text-text">
                                    {blockedAmount.toLocaleString('fa-IR')} ریال
                                </span>
                            </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
                            <div>
                                <div className="text-[10px] text-muted">موجودی قابل استفاده</div>
                                <div className="mt-1 text-[11px] text-muted">قدرت خرید</div>
                            </div>
                            <div className="min-w-0 text-left">
                                <div
                                    className="break-all text-xl font-black leading-tight tabular-nums tracking-tight text-text sm:text-2xl">
                                    {buyingPower.toLocaleString('fa-IR')}
                                </div>
                                <div className="mt-1 text-[10px] text-muted">ریال</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleAdjust}
                  className="space-y-3 rounded-3xl border border-border/70 bg-surface/90 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-text">مدیریت موجودی</h4>
                        <p className="mt-1 text-[11px] text-muted">تنظیم دقیق، واریز، برداشت و عملیات درصدی</p>
                    </div>
                    <span
                        className="rounded-full border border-border/70 bg-surface-2 px-2.5 py-1 text-[10px] text-muted">ریال</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {WALLET_ACTIONS.map((action) => {
                        const active = actionType === action.type;
                        const isNegativeAction = action.type === 'SUBTRACT' || action.type === 'PERCENT_SUBTRACT';
                        return (
                            <button
                                key={action.type}
                                type="button"
                                title={action.hint}
                                onClick={() => {
                                    setActionType(action.type);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className={`rounded-xl border px-2 py-2 text-[10px] font-semibold transition ${
                                    active
                                        ? isNegativeAction
                                            ? 'border-negative/40 bg-negative/10 text-negative'
                                            : 'border-primary/40 bg-primary/10 text-primary'
                                        : 'border-border/70 bg-surface-2 text-muted hover:border-primary/25 hover:text-text'
                                }`}
                            >
                                {action.label}
                            </button>
                        );
                    })}
                </div>

                <div>
                    <label className="mb-1 block text-[10px] text-muted">
                        {isPercentAction ? 'درصد' : 'مبلغ (ریال)'}
                    </label>
                    <input
                        type="number"
                        min="0"
                        step={isPercentAction ? '0.1' : '1'}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(null);
                            setSuccess(null);
                        }}
                        placeholder={isPercentAction ? 'مثلا ۱۰' : 'مثلا ۲۰۰۰۰۰۰۰'}
                        required
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text tabular-nums focus:border-primary/45"
                    />
                    {!isPercentAction && parsedValue !== null && Number.isFinite(parsedValue) ? (
                        <div className="mt-1.5 text-[10px] text-muted">
                            معادل تومان: {(parsedValue / 10).toLocaleString('fa-IR')}
                        </div>
                    ) : null}
                </div>

                {isPercentAction ? (
                    <div className="flex flex-wrap gap-1.5">
                        {[5, 10, 20, 50, 100].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => setValue(pct.toString())}
                                className="rounded-lg border border-border/70 bg-surface-2 px-2.5 py-1 text-[10px] text-text transition hover:border-primary/35"
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {[1_000_000, 10_000_000, 100_000_000, 1_000_000_000].map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setValue(String(preset))}
                                className="rounded-lg border border-border/70 bg-surface-2 px-2.5 py-1 text-[10px] text-text transition hover:border-primary/35"
                            >
                                {formatNumberFa(preset)}
                            </button>
                        ))}
                    </div>
                )}

                {projectedBalance !== null ? (
                    <div
                        className={`rounded-xl border px-3 py-2 text-[10px] ${
                            projectedBalance < 0
                                ? 'border-negative/35 bg-negative/8 text-negative'
                                : 'border-border/70 bg-surface-2 text-muted'
                        }`}
                    >
                        <span className="text-muted">موجودی پس از عملیات: </span>
                        <span className="font-bold text-text tabular-nums">
                            {projectedBalance.toLocaleString('fa-IR')} ریال
                        </span>
                    </div>
                ) : null}

                <div>
                    <label className="mb-1 block text-[10px] text-muted">توضیحات (اختیاری)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="مثلا واریز سود مجمع یا اصلاح موجودی"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text"
                    />
                </div>

                {error ? (
                    <div
                        className="flex items-start gap-1.5 rounded-xl border border-negative/30 bg-negative/8 px-2.5 py-2 text-[10px] text-negative">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
                        <span>{error}</span>
                    </div>
                ) : null}
                {success ? (
                    <div
                        className="flex items-start gap-1.5 rounded-xl border border-positive/30 bg-positive/8 px-2.5 py-2 text-[10px] text-positive">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
                        <span>{success}</span>
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={isSubmitting || (projectedBalance !== null && projectedBalance < 0)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-text py-2 text-xs font-bold text-surface transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Coins className="h-3.5 w-3.5"/>}
                    {isSubmitting ? 'در حال ثبت...' : 'ثبت تراکنش'}
                </button>
            </form>
        </div>
    );
}

function WatchlistPanel({
                            activeTab,
                            onTabChange,
                            watchlists,
                            selectedWatchlistId,
                            onSelectWatchlist,
                            loading,
                            error,
                            onRetry,
                            onRequestCreateWatchlist,
                            onRequestEditWatchlist,
                            onRequestDeleteWatchlist,
                            onSelectSymbol,
                            onRemoveSymbol,
                            watchlistBusy,
                            currentSymbolKey,
                            currentSymbolPrice,
                            userProfile,
                            accountSummary,
                            accessToken,
                            onProfileUpdated,
                        }: {
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
    watchlists: Watchlist[];
    selectedWatchlistId: number | null;
    onSelectWatchlist: (watchlistId: number) => void;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onRequestCreateWatchlist: () => void;
    onRequestEditWatchlist: (watchlistId: number) => void;
    onRequestDeleteWatchlist: (watchlistId: number) => void;
    onSelectSymbol: (symbol: SymbolSearchSuggestion) => void;
    onRemoveSymbol: (symbolId: number) => void;
    watchlistBusy: boolean;
    currentSymbolKey: string;
    currentSymbolPrice: number | null;
    userProfile?: UserProfile;
    accountSummary: AccountSummary;
    accessToken: string;
    onProfileUpdated?: (profile: UserProfile) => void;
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const selectedWatchlist =
        watchlists.find((watchlist) => watchlist.id === selectedWatchlistId) ?? watchlists[0] ?? null;

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

    const emptyTitle = activeTab === 'watchlist' ? 'دیده‌بان ندارید!' : 'صنعتی انتخاب نشده است!';
    const emptyHelp =
        activeTab === 'watchlist'
            ? 'جهت ساخت دیده‌بان، دکمه زیر را انتخاب کنید.'
            : 'برای شروع، یک صنعت از لیست بالا انتخاب کنید.';

    return (
        <aside className={`${cardClass} w-full min-w-0 p-3`}>
            <div className="mb-3 border-b border-border/70 pb-2">
                <div className="flex items-center gap-3 text-xs">
                    <button
                        type="button"
                        onClick={() => onTabChange('watchlist')}
                        className={`relative inline-flex items-center gap-1.5 rounded-lg px-1 py-1 transition ${
                            activeTab === 'watchlist' ? 'text-text' : 'text-muted hover:text-text'
                        }`}
                    >
                        <Bell className="h-3.5 w-3.5"/>
                        دیدبان
                        {activeTab === 'watchlist' ? (
                            <span className="absolute inset-x-0 -bottom-[8px] h-0.5 rounded-full bg-primary"/>
                        ) : null}
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange('industries')}
                        className={`relative inline-flex items-center gap-1.5 rounded-lg px-1 py-1 transition ${
                            activeTab === 'industries' ? 'text-text' : 'text-muted hover:text-text'
                        }`}
                    >
                        <Building2 className="h-3.5 w-3.5"/>
                        صنایع
                        {activeTab === 'industries' ? (
                            <span className="absolute inset-x-0 -bottom-[8px] h-0.5 rounded-full bg-primary"/>
                        ) : null}
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange('wallet')}
                        className={`relative inline-flex items-center gap-1.5 rounded-lg px-1 py-1 transition ${
                            activeTab === 'wallet' ? 'text-text' : 'text-muted hover:text-text'
                        }`}
                    >
                        <Wallet className="h-3.5 w-3.5"/>
                        کیف پول
                        {activeTab === 'wallet' ? (
                            <span className="absolute inset-x-0 -bottom-[8px] h-0.5 rounded-full bg-primary"/>
                        ) : null}
                    </button>
                </div>
            </div>

            {activeTab === 'industries' ? (
                <IndustriesTabContent
                    accessToken={accessToken}
                    onSelectSymbol={onSelectSymbol}
                />
            ) : null}

            {activeTab === 'wallet' ? (
                <WalletTabContent
                    userProfile={userProfile}
                    accountSummary={accountSummary}
                    accessToken={accessToken}
                    onProfileUpdated={onProfileUpdated}
                />
            ) : null}

            {activeTab === 'watchlist' && loading ? (
                <div className="space-y-2">
                    <div className="h-10 animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
                    <div className="h-[250px] animate-pulse rounded-xl border border-border/70 bg-surface-2"/>
                </div>
            ) : null}

            {activeTab === 'watchlist' && !loading && error ? (
                <div className="rounded-xl border border-negative/35 bg-negative/10 p-3 text-xs text-negative">
                    <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4"/>
                        {error}
                    </div>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : null}

            {activeTab === 'watchlist' && !loading && !error && watchlists.length === 0 ? (
                <>
                    <button
                        type="button"
                        className="mb-4 flex h-10 w-full items-center justify-between rounded-xl border border-border/80 bg-surface-2 px-3 text-xs text-muted"
                        disabled
                    >
                        انتخاب کنید
                        <ChevronDown className="h-4 w-4"/>
                    </button>

                    <div
                        className="flex min-h-[292px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-2 px-5 text-center">
                        <div className="mb-4 grid grid-cols-2 gap-2 opacity-70">
                            <div className="h-11 w-11 rounded-lg bg-border/60"/>
                            <div className="h-11 w-11 rounded-lg bg-border/75"/>
                            <div className="h-11 w-11 rounded-lg bg-border/75"/>
                            <div className="h-11 w-11 rounded-lg bg-border/60"/>
                        </div>

                        <h3 className="text-sm font-semibold text-text">{emptyTitle}</h3>
                        <p className="mt-1 text-xs text-muted">{emptyHelp}</p>

                        <button
                            type="button"
                            onClick={onRequestCreateWatchlist}
                            className="mt-4 rounded-full border border-positive/30 bg-positive/10 px-4 py-1.5 text-xs font-semibold text-positive transition hover:bg-positive/15 focus-visible:ring-2 focus-visible:ring-positive/45"
                        >
                            ساخت دیدبان
                        </button>
                    </div>
                </>
            ) : null}

            {activeTab === 'watchlist' && !loading && !error && watchlists.length > 0 && selectedWatchlist ? (
                <>
                    <div ref={dropdownRef} className="relative mb-3">
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            className="flex h-10 w-full items-center justify-between rounded-xl border border-border/80 bg-surface px-3 text-xs text-text transition hover:border-primary/30"
                        >
                            <span className="truncate">{selectedWatchlist.name}</span>
                            <ChevronDown
                                className={`h-4 w-4 text-muted transition ${dropdownOpen ? 'rotate-180' : ''}`}/>
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
                                    ساخت دیدبان جدید
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
                                                    {isActive ?
                                                        <Check className="h-3.5 w-3.5 shrink-0 text-positive"/> : null}
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

                    <section className="rounded-xl border border-border/70 bg-surface">
                        <header
                            className={`${WATCHLIST_TABLE_GRID} border-b border-border/70 bg-surface-2 px-2 py-2 text-[11px] font-semibold text-muted`}>
                            <span>نام نماد</span>
                            <span className="text-center">قیمت لحظه‌ای</span>
                            <span className="text-center">عملیات</span>
                        </header>

                        {selectedWatchlist.symbols.length === 0 ? (
                            <div
                                className="flex min-h-[200px] flex-col items-center justify-center px-4 py-6 text-center">
                                <div className="mb-3 grid grid-cols-2 gap-2 opacity-60">
                                    <div className="h-9 w-11 rounded-lg bg-border/65"/>
                                    <div className="h-9 w-11 rounded-lg bg-border/80"/>
                                    <div className="h-9 w-11 rounded-lg bg-border/80"/>
                                    <div className="h-9 w-11 rounded-lg bg-border/65"/>
                                </div>
                                <h4 className="text-sm font-semibold text-text">دیده‌بان شما خالیست!</h4>
                                <p className="mt-1 text-xs text-muted">
                                    برای شروع، نماد جاری را با دکمه ستاره به دیده‌بان اضافه کنید.
                                </p>
                            </div>
                        ) : (
                            <div className="thin-scrollbar max-h-[245px] overflow-y-auto">
                                {selectedWatchlist.symbols.map((symbol) => {
                                    const livePrice = symbol.symbolKey === currentSymbolKey ? currentSymbolPrice : null;
                                    return (
                                        <div
                                            key={symbol.id}
                                            className={`${WATCHLIST_TABLE_GRID} border-b border-border/60 px-2 py-2.5 text-xs last:border-b-0 transition hover:bg-surface-2/60`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onSelectSymbol({
                                                    key: symbol.symbolKey,
                                                    type: symbol.sourceType || 'TSE',
                                                    symbol: symbol.symbol,
                                                    name: symbol.name,
                                                    instrumentCode: symbol.instrumentCode,
                                                    isin: symbol.isin,
                                                    oldInstrumentCodes: [],
                                                })}
                                                className="min-w-0 text-right"
                                            >
                                                <div className="truncate font-semibold text-text">{symbol.symbol}</div>
                                                <div className="truncate text-[11px] text-muted">{symbol.name}</div>
                                            </button>
                                            <span className="text-center tabular-nums text-text">
                                                {formatNumberOrDash(livePrice)}
                                            </span>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectSymbol({
                                                        key: symbol.symbolKey,
                                                        type: symbol.sourceType || 'TSE',
                                                        symbol: symbol.symbol,
                                                        name: symbol.name,
                                                        instrumentCode: symbol.instrumentCode,
                                                        isin: symbol.isin,
                                                        oldInstrumentCodes: [],
                                                    })}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface text-muted transition hover:border-primary/35 hover:text-text"
                                                    aria-label={`مشاهده ${symbol.symbol}`}
                                                >
                                                    <Eye className="h-4 w-4"/>
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={watchlistBusy}
                                                    onClick={() => onRemoveSymbol(symbol.id)}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface text-muted transition hover:border-negative/35 hover:text-negative disabled:cursor-not-allowed disabled:opacity-60"
                                                    aria-label={`حذف ${symbol.symbol} از دیده‌بان`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5"/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </>
            ) : null}
        </aside>
    );
}

export default function TradingDashboard({
                                             theme,
                                             accessToken,
                                             onToggleTheme,
                                             profileDisplayName,
                                             onOpenProfile,
                                             onLogout,
                                             userProfile,
                                             onProfileUpdated,
                                         }: TradingDashboardProps) {
    const clock = useClock();
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    const bourseOverview = useMarketOverview('1');
    const farabourseOverview = useMarketOverview('2');

    const marketIndex = bourseOverview?.indexValue ?? null;
    const marketDelta = bourseOverview?.indexChange ?? null;
    const farabourseIndex = farabourseOverview?.indexValue ?? null;
    const farabourseDelta = farabourseOverview?.indexChange ?? null;

    const marketStateText = bourseOverview?.marketStateTitle || farabourseOverview?.marketStateTitle || null;
    const isMarketOpen = marketStateText === 'باز';
    const [selectedSymbol, setSelectedSymbolState] = useState<SymbolSearchSuggestion>(
        () => loadStoredSelectedSymbol() ?? DEFAULT_SELECTED_SYMBOL
    );
    const setSelectedSymbol = useCallback((symbol: SymbolSearchSuggestion) => {
        setSelectedSymbolState(symbol);
        persistSelectedSymbol(symbol);
    }, []);
    const [previewSymbol, setPreviewSymbol] = useState<SymbolSearchSuggestion | null>(null);
    const activeSymbol = previewSymbol ?? selectedSymbol;
    const {
        data: activeSymbolData,
        loading: symbolLoading,
        error: symbolError,
        refresh: refreshSymbolDetails,
    } = useSymbolDetails(activeSymbol);

    const [orderbookTab, setOrderbookTab] = useState<OrderbookTab>('info');
    const {
        rows: peerGroupRows,
        sectorName: peerGroupSectorName,
        loading: peerGroupLoading,
        error: peerGroupError,
        refresh: refreshPeerGroup,
    } = usePeerGroup(activeSymbol.instrumentCode, orderbookTab === 'peers');
    const [symbolTab, setSymbolTab] = useState<SymbolTab>('details');
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>('watchlist');
    const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
    const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('orders');
    const [tradingOrders, setTradingOrders] = useState<TradingOrder[]>([]);
    const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([]);
    const [tradingAccountLoading, setTradingAccountLoading] = useState(true);
    const [tradingAccountError, setTradingAccountError] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [marketPanelOpen, setMarketPanelOpen] = useState(false);
    const [codalQuery, setCodalQuery] = useState<CodalNoticesQuery>(() => ({
        ...DEFAULT_CODAL_NOTICE_QUERY,
        symbol: '',
    }));
    const [noticeFilters, setNoticeFilters] = useState<NoticeUiFilters>(() => createDefaultNoticeFilters());
    const [noticeFilterDraft, setNoticeFilterDraft] = useState<NoticeUiFilters>(() => createDefaultNoticeFilters());
    const [noticeFilterOpen, setNoticeFilterOpen] = useState(false);
    const [noticeSymbolDropdownOpen, setNoticeSymbolDropdownOpen] = useState(false);
    const [activeNoticeGroup, setActiveNoticeGroup] = useState<NoticeGroup | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [watchlistsLoading, setWatchlistsLoading] = useState(true);
    const [watchlistsError, setWatchlistsError] = useState<string | null>(null);
    const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
    const [watchlistModal, setWatchlistModal] = useState<WatchlistModalState | null>(null);
    const [watchlistNameDraft, setWatchlistNameDraft] = useState('');
    const [watchlistNameError, setWatchlistNameError] = useState<string | null>(null);
    const [watchlistSubmitting, setWatchlistSubmitting] = useState(false);
    const [watchlistBusy, setWatchlistBusy] = useState(false);
    const [watchlistToast, setWatchlistToast] = useState<WatchlistToast | null>(null);
    const [mainNavTab, setMainNavTab] = useState<MainNavTab>('بازار');
    const [orderModalSide, setOrderModalSide] = useState<OrderSide | null>(null);

    const showWatchlistToast = useCallback((
        message: string,
        tone: WatchlistToast['tone'] = 'success',
        title?: string
    ) => {
        setWatchlistToast({id: Date.now() + Math.floor(Math.random() * 1000), title, message, tone});
    }, []);

    const loadTradingAccount = useCallback(async () => {
        setTradingAccountLoading(true);
        setTradingAccountError(null);
        try {
            const [orders, holdings] = await Promise.all([
                getTradingOrders(accessToken),
                getPortfolioHoldings(accessToken),
            ]);
            setTradingOrders(orders);
            setPortfolioHoldings(holdings);
        } catch (error) {
            setTradingAccountError(error instanceof Error ? error.message : 'دریافت اطلاعات معاملاتی ناموفق بود.');
            setTradingOrders([]);
            setPortfolioHoldings([]);
        } finally {
            setTradingAccountLoading(false);
        }
    }, [accessToken]);

    const refreshTradingAccountSilent = useCallback(async () => {
        try {
            const [orders, holdings] = await Promise.all([
                getTradingOrders(accessToken),
                getPortfolioHoldings(accessToken),
            ]);
            setTradingOrders(orders);
            setPortfolioHoldings(holdings);
        } catch {
            // Keep the last known state during background polling.
        }
    }, [accessToken]);

    useEffect(() => {
        void loadTradingAccount();
    }, [loadTradingAccount]);

    useEffect(() => {
        let timer: number | undefined;

        const tick = async () => {
            await refreshTradingAccountSilent();
            timer = window.setTimeout(tick, appConfig.tradingOrdersRefreshMs);
        };

        const hasActiveOrders = tradingOrders.some(
            (order) =>
                order.status === 'REQUESTED' ||
                order.status === 'PARTIALLY_FILLED' ||
                order.status === 'TRIGGER_PENDING'
        );

        if (!hasActiveOrders) {
            return undefined;
        }

        timer = window.setTimeout(tick, appConfig.tradingOrdersRefreshMs);
        return () => {
            if (timer !== undefined) {
                window.clearTimeout(timer);
            }
        };
    }, [refreshTradingAccountSilent, tradingOrders]);

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
            const message = error instanceof Error ? error.message : 'دریافت دیده‌بان با خطا مواجه شد.';
            setWatchlistsError(message);
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
    }, []);

    const openWatchlistDrawer = useCallback(() => {
        setMainNavTab('بازار');
        setSidebarTab('watchlist');
        setDrawerOpen(true);
    }, []);

    const openCreateWatchlistModal = useCallback((pendingSymbol?: SymbolSearchSuggestion) => {
        setWatchlistModal({mode: 'create', pendingSymbol});
        setWatchlistNameDraft('');
        setWatchlistNameError(null);
    }, []);

    const openEditWatchlistModal = useCallback(
        (watchlistId: number) => {
            const target = watchlists.find((item) => item.id === watchlistId);
            if (!target) return;
            setWatchlistModal({
                mode: 'edit',
                watchlistId,
                originalName: target.name,
            });
            setWatchlistNameDraft(target.name);
            setWatchlistNameError(null);
        },
        [watchlists]
    );

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

        setWatchlistSubmitting(true);
        setWatchlistNameError(null);
        try {
            if (watchlistModal.mode === 'create') {
                const created = await createWatchlist(accessToken, normalizedName);
                let savedWatchlist = created;
                if (watchlistModal.pendingSymbol) {
                    savedWatchlist = await addSymbolToWatchlist(
                        accessToken,
                        created.id,
                        watchlistModal.pendingSymbol
                    );
                }
                setWatchlists((prev) => [...prev, savedWatchlist].sort((a, b) => a.id - b.id));
                setSelectedWatchlistId(savedWatchlist.id);
                setWatchlistModal(null);
                if (watchlistModal.pendingSymbol) {
                    showWatchlistToast(
                        `دیدبان ${savedWatchlist.name} ساخته شد و نماد ${watchlistModal.pendingSymbol.symbol} اضافه شد.`
                    );
                } else {
                    showWatchlistToast(`دیدبان ${savedWatchlist.name} ساخته شد.`);
                }
            } else {
                const updated = await updateWatchlist(accessToken, watchlistModal.watchlistId, normalizedName);
                replaceWatchlistInState(updated);
                setSelectedWatchlistId(updated.id);
                setWatchlistModal(null);
                showWatchlistToast(`ویرایش نام دیدبان ${watchlistModal.originalName} انجام شد.`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'ذخیره دیده‌بان ناموفق بود.';
            setWatchlistNameError(message);
        } finally {
            setWatchlistSubmitting(false);
        }
    }, [accessToken, replaceWatchlistInState, showWatchlistToast, watchlistModal, watchlistNameDraft]);

    const handleDeleteWatchlist = useCallback(
        async (watchlistId: number) => {
            if (watchlistBusy) return;
            const target = watchlists.find((item) => item.id === watchlistId);
            if (!target) return;

            setWatchlistBusy(true);
            try {
                await deleteWatchlist(accessToken, watchlistId);
                const nextWatchlists = watchlists.filter((item) => item.id !== watchlistId);
                setWatchlists(nextWatchlists);
                if (selectedWatchlistId === watchlistId) {
                    setSelectedWatchlistId(nextWatchlists[0]?.id ?? null);
                }
                showWatchlistToast(`دیدبان ${target.name} حذف شد.`);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'حذف دیده‌بان ناموفق بود.';
                showWatchlistToast(message, 'error');
            } finally {
                setWatchlistBusy(false);
            }
        },
        [accessToken, selectedWatchlistId, showWatchlistToast, watchlistBusy, watchlists]
    );

    const handleRemoveSymbolFromWatchlist = useCallback(
        async (symbolId: number) => {
            if (watchlistBusy || !selectedWatchlist) return;
            const targetSymbol = selectedWatchlist.symbols.find((item) => item.id === symbolId);
            if (!targetSymbol) return;

            setWatchlistBusy(true);
            try {
                const updated = await removeSymbolFromWatchlist(accessToken, selectedWatchlist.id, symbolId);
                replaceWatchlistInState(updated);
                showWatchlistToast(`نماد ${targetSymbol.symbol} از دیدبان ${selectedWatchlist.name} حذف شد.`);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'حذف نماد از دیده‌بان ناموفق بود.';
                showWatchlistToast(message, 'error');
            } finally {
                setWatchlistBusy(false);
            }
        },
        [accessToken, replaceWatchlistInState, selectedWatchlist, showWatchlistToast, watchlistBusy]
    );

    const handleToggleFavorite = useCallback(async () => {
        if (watchlistBusy) return;

        if (!selectedWatchlist) {
            openCreateWatchlistModal(selectedSymbol);
            return;
        }

        setWatchlistBusy(true);
        try {
            if (selectedWatchlistSymbol) {
                const updated = await removeSymbolFromWatchlist(
                    accessToken,
                    selectedWatchlist.id,
                    selectedWatchlistSymbol.id
                );
                replaceWatchlistInState(updated);
                showWatchlistToast(`نماد ${selectedSymbol.symbol} از دیدبان ${selectedWatchlist.name} حذف شد.`);
            } else {
                const updated = await addSymbolToWatchlist(accessToken, selectedWatchlist.id, selectedSymbol);
                replaceWatchlistInState(updated);
                showWatchlistToast(`نماد ${selectedSymbol.symbol} به دیدبان ${selectedWatchlist.name} اضافه شد.`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'به‌روزرسانی دیده‌بان ناموفق بود.';
            showWatchlistToast(message, 'error');
        } finally {
            setWatchlistBusy(false);
        }
    }, [
        accessToken,
        openCreateWatchlistModal,
        replaceWatchlistInState,
        selectedSymbol,
        selectedWatchlist,
        selectedWatchlistSymbol,
        showWatchlistToast,
        watchlistBusy,
    ]);

    const {
        notices: codalNotices,
        totalCount: codalNoticesTotalCount,
        loading: codalNoticesLoading,
        loadingMore: codalNoticesLoadingMore,
        refreshing: codalNoticesRefreshing,
        hasMore: codalNoticesHasMore,
        error: codalNoticesError,
        loadMore: loadMoreCodalNotices,
        refresh: refreshCodalNotices,
    } = useCodalNotices(codalQuery);

    const noticeSymbolQuery = noticeFilterDraft.symbol.trim();
    const {
        loading: noticeSymbolLoading,
        error: noticeSymbolError,
        results: noticeSymbolResults,
        retry: retryNoticeSymbolSearch,
    } = useSymbolSearch(noticeSymbolQuery, noticeFilterOpen && noticeSymbolDropdownOpen);

    const noticeListRef = useRef<HTMLDivElement | null>(null);
    const noticeLoadMoreRef = useRef<HTMLDivElement | null>(null);
    const symbolNoticeListRef = useRef<HTMLDivElement | null>(null);
    const symbolNoticeLoadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        void loadWatchlists();
    }, [loadWatchlists]);

    useEffect(() => {
        if (!watchlistToast) return;
        const timer = window.setTimeout(() => {
            setWatchlistToast((prev) => (prev?.id === watchlistToast.id ? null : prev));
        }, 4200);
        return () => window.clearTimeout(timer);
    }, [watchlistToast]);

    useEffect(() => {
        setSymbolTab('details');
    }, [activeSymbol.symbol]);

    const marketPercent = useMemo(
        () =>
            marketIndex !== null && marketDelta !== null && marketIndex !== 0
                ? (marketDelta / marketIndex) * 100
                : null,
        [marketDelta, marketIndex]
    );

    const faraboursePercent = useMemo(
        () =>
            farabourseIndex !== null && farabourseDelta !== null && farabourseIndex !== 0
                ? (farabourseDelta / farabourseIndex) * 100
                : null,
        [farabourseDelta, farabourseIndex]
    );

    const marketPositive = marketDelta !== null ? marketDelta >= 0 : false;
    const faraboursePositive = farabourseDelta !== null ? farabourseDelta >= 0 : false;
    const symbolPrice = activeSymbolData?.lastPrice ?? null;
    const symbolPercent = activeSymbolData?.lastPricePercent ?? null;
    const symbolPositive = symbolPercent !== null ? symbolPercent >= 0 : false;
    const isSymbolInSelectedWatchlist = selectedWatchlistSymbol !== null;
    const selectedSymbolLivePrice =
        activeSymbol.key === selectedSymbol.key ? activeSymbolData?.closePrice ?? activeSymbolData?.lastPrice ?? null : null;

    const tradingInstrumentCodes = useMemo(
        () => [
            ...tradingOrders.map((order) => order.instrumentCode),
            ...portfolioHoldings.map((holding) => holding.instrumentCode),
        ],
        [portfolioHoldings, tradingOrders]
    );
    const instrumentLivePrices = useInstrumentLivePrices(tradingInstrumentCodes);

    const resolveDisplayLivePrice = useCallback(
        (instrumentCode: string) => {
            const normalized = instrumentCode.trim();
            if (normalized === '') return null;

            const cachedPrice = instrumentLivePrices[normalized];
            if (cachedPrice !== null && cachedPrice !== undefined) {
                return cachedPrice;
            }

            const activeInstrumentCode = activeSymbol.instrumentCode?.trim() ?? '';
            if (normalized === activeInstrumentCode) {
                return symbolPrice;
            }

            return null;
        },
        [activeSymbol.instrumentCode, instrumentLivePrices, symbolPrice]
    );

    const favoriteButtonTitle = selectedWatchlist
        ? isSymbolInSelectedWatchlist
            ? 'حذف نماد از دیده‌بان'
            : 'افزودن نماد به دیده‌بان'
        : 'ابتدا دیده‌بان بسازید';

    const dailyMin = activeSymbolData?.allowedMinPrice ?? null;
    const dailyMax = activeSymbolData?.allowedMaxPrice ?? null;

    const markerPercent = useMemo(() => {
        if (
            symbolPrice === null ||
            dailyMin === null ||
            dailyMax === null ||
            Number.isNaN(symbolPrice) ||
            Number.isNaN(dailyMin) ||
            Number.isNaN(dailyMax) ||
            dailyMax <= dailyMin
        ) {
            return 50;
        }
        return clamp(((symbolPrice - dailyMin) / (dailyMax - dailyMin)) * 100, 3, 96);
    }, [dailyMax, dailyMin, symbolPrice]);

    const orderBookRows = useMemo(
        () => normalizeOrderBookRows(activeSymbolData?.orderBook ?? []),
        [activeSymbolData?.orderBook]
    );

    const orderBookBidPriceRange = useMemo(() => getBidPriceRange(orderBookRows), [orderBookRows]);
    const orderBookAskPriceRange = useMemo(() => getAskPriceRange(orderBookRows), [orderBookRows]);

    const depthRows = useMemo(() => activeSymbolData?.depth ?? [], [activeSymbolData?.depth]);
    const symbolDetails = useMemo(() => activeSymbolData?.detailRows ?? [], [activeSymbolData?.detailRows]);
    const marketLabel = activeSymbolData?.marketLabel ?? toMarketLabel(activeSymbol.type);
    const activeSymbolSummary = [activeSymbol.symbol, activeSymbol.name, marketLabel].filter(Boolean).join(' - ');
    const demoOrders = useMemo<DemoOrderRow[]>(
        () =>
            tradingOrders.map((order) => ({
                id: order.id,
                type: order.side === 'BUY' ? 'buy' : 'sell',
                symbol: order.symbol,
                quantity: order.quantity,
                remainingQuantity: order.remainingQuantity,
                executedQuantity: order.executedQuantity,
                orderPrice: Number(order.orderPrice),
                averageExecutedPrice: order.averageExecutedPrice,
                livePrice: resolveDisplayLivePrice(order.instrumentCode),
                time: formatInstantFa(order.orderTime),
                status: order.status,
                statusLabel: order.statusLabel,
                cancellable: order.cancellable,
            })),
        [resolveDisplayLivePrice, tradingOrders]
    );
    const filteredOrders = useMemo(() => {
        if (orderFilter === 'all') return demoOrders;
        const statusMap: Record<Exclude<OrderFilter, 'all'>, OrderStatusType[]> = {
            open: ['REQUESTED', 'TRIGGER_PENDING'],
            partial: ['PARTIALLY_FILLED'],
            done: ['COMPLETED'],
            cancelled: ['CANCELLED'],
            failed: ['FAILED'],
        };
        const statuses = statusMap[orderFilter];
        return demoOrders.filter((order) => statuses.includes(order.status));
    }, [demoOrders, orderFilter]);
    const demoPortfolioRows = useMemo<DemoPortfolioRow[]>(
        () =>
            portfolioHoldings.map((holding) => {
                const apiLivePrice = Number(holding.livePrice);
                const resolvedLivePrice = resolveDisplayLivePrice(holding.instrumentCode);

                return {
                    id: String(holding.id),
                    time: formatInstantFa(holding.acquiredAt),
                    symbol: holding.symbol,
                    quantity: holding.quantity,
                    buyPrice: Number(holding.buyPrice),
                    livePrice:
                        resolvedLivePrice ??
                        (Number.isFinite(apiLivePrice) && apiLivePrice > 0 ? apiLivePrice : null),
                };
            }),
        [portfolioHoldings, resolveDisplayLivePrice]
    );
    const tsetmcInstrumentCode = activeSymbol.instrumentCode?.trim() ?? '';
    const tsetmcSymbolUrl = tsetmcInstrumentCode ? `https://www.tsetmc.com/instInfo/${encodeURIComponent(tsetmcInstrumentCode)}` : null;
    const codalSymbol = activeSymbol.symbol.trim();
    const symbolCodalQuery = useMemo<CodalNoticesQuery>(
        () => ({
            ...DEFAULT_CODAL_NOTICE_QUERY,
            symbol: codalSymbol,
            length: CODAL_MAX_LENGTH,
        }),
        [codalSymbol]
    );
    const symbolNoticesEnabled = codalSymbol !== '' && symbolTab === 'notices';
    const {
        notices: symbolCodalNotices,
        totalCount: symbolCodalNoticesTotalCount,
        loading: symbolCodalNoticesLoading,
        loadingMore: symbolCodalNoticesLoadingMore,
        refreshing: symbolCodalNoticesRefreshing,
        hasMore: symbolCodalNoticesHasMore,
        error: symbolCodalNoticesError,
        loadMore: loadMoreSymbolCodalNotices,
        refresh: refreshSymbolCodalNotices,
    } = useCodalNotices(symbolCodalQuery, {
        enabled: symbolNoticesEnabled,
        autoRefresh: symbolNoticesEnabled,
        pagesPerLoad: SYMBOL_NOTICE_PAGES_PER_LOAD,
        errorMessage: 'دریافت اطلاعیه‌های نماد با خطا مواجه شد.',
    });
    const codalSymbolUrl = codalSymbol
        ? `https://codal.ir/ReportList.aspx?search&Symbol=${encodeURIComponent(
            codalSymbol
        )}&LetterType=-1&AuditorRef=-1&PageNumber=1&Audited&NotAudited&IsNotAudited=false&Childs&Mains&Publisher=false&CompanyState=-1&ReportingType=-1&Category=-1&CompanyType=-1&Consolidatable&NotConsolidatable`
        : null;

    const marketDetails = useMemo(
        () => [
            {
                id: 'bourse',
                label: 'بورس',
                indexValue: marketIndex,
                deltaValue: marketDelta,
                percentValue: marketPercent,
                totalTrades: bourseOverview?.totalTrades ?? null,
                tradeValue: bourseOverview?.totalTradeValue ?? null,
                tradeVolume: bourseOverview?.totalTradeVolume ?? null,
                positive: marketPositive,
                marketStateTitle: bourseOverview?.marketStateTitle ?? null,
            },
            {
                id: 'farabourse',
                label: 'فرابورس',
                indexValue: farabourseIndex,
                deltaValue: farabourseDelta,
                percentValue: faraboursePercent,
                totalTrades: farabourseOverview?.totalTrades ?? null,
                tradeValue: farabourseOverview?.totalTradeValue ?? null,
                tradeVolume: farabourseOverview?.totalTradeVolume ?? null,
                positive: faraboursePositive,
                marketStateTitle: farabourseOverview?.marketStateTitle ?? null,
            },
        ],
        [
            bourseOverview?.totalTrades,
            bourseOverview?.totalTradeValue,
            bourseOverview?.totalTradeVolume,
            bourseOverview?.marketStateTitle,
            farabourseDelta,
            farabourseIndex,
            faraboursePercent,
            faraboursePositive,
            farabourseOverview?.totalTrades,
            farabourseOverview?.totalTradeValue,
            farabourseOverview?.totalTradeVolume,
            farabourseOverview?.marketStateTitle,
            marketDelta,
            marketIndex,
            marketPercent,
            marketPositive,
        ]
    );

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

    const accountSummary = useMemo(() => {
        const holdings = portfolioHoldings.map((holding) => {
            const apiLivePrice = Number(holding.livePrice);
            const resolvedLivePrice = resolveDisplayLivePrice(holding.instrumentCode);

            return {
                quantity: holding.quantity,
                buyPrice: Number(holding.buyPrice),
                livePrice:
                    resolvedLivePrice ??
                    (Number.isFinite(apiLivePrice) && apiLivePrice > 0 ? apiLivePrice : null),
            };
        });

        return computeAccountSummary(userProfile?.balance ?? 0, holdings, tradingOrders);
    }, [portfolioHoldings, resolveDisplayLivePrice, tradingOrders, userProfile?.balance]);

    const refreshAccountStatus = useCallback(async () => {
        const tasks: Promise<void>[] = [loadTradingAccount()];

        if (userProfile?.id && onProfileUpdated) {
            tasks.push(
                (async () => {
                    const response = await fetch(`/api/v1/users/${userProfile.id}`, {
                        headers: {Authorization: `Bearer ${accessToken}`},
                    });
                    if (!response.ok) return;
                    const data = (await response.json()) as { result?: UserProfile };
                    if (data.result) {
                        onProfileUpdated(data.result);
                    }
                })()
            );
        }

        await Promise.all(tasks);
    }, [accessToken, loadTradingAccount, onProfileUpdated, userProfile?.id]);

    const activeInstrumentCode = activeSymbol.instrumentCode?.trim() ?? '';

    const orderLivePrice = symbolPrice ?? activeSymbolData?.closePrice ?? null;

    // Sellable quantity = held shares − quantity already reserved by pending sell orders.
    // Returns null when holdings data is unavailable so the UI never allows unlimited selling.
    const availableToSell = useMemo<number | null>(() => {
        if (activeInstrumentCode === '') return null;
        if (tradingAccountError) return null;
        const held = portfolioHoldings
            .filter((holding) => holding.instrumentCode === activeInstrumentCode)
            .reduce((sum, holding) => sum + holding.quantity, 0);
        const reserved = tradingOrders
            .filter(
                (order) =>
                    order.instrumentCode === activeInstrumentCode &&
                    order.side === 'SELL' &&
                    (order.status === 'REQUESTED' || order.status === 'PARTIALLY_FILLED' || order.status === 'TRIGGER_PENDING')
            )
            .reduce((sum, order) => sum + order.remainingQuantity, 0);
        return Math.max(held - reserved, 0);
    }, [activeInstrumentCode, portfolioHoldings, tradingAccountError, tradingOrders]);

    const orderSymbolContext = useMemo<OrderSymbolContext>(
        () => ({
            symbol: activeSymbol.symbol,
            instrumentCode: activeSymbol.instrumentCode,
            name: activeSymbolData?.subtitle || activeSymbol.name,
            lastPrice: symbolPrice,
            closePrice: activeSymbolData?.closePrice ?? null,
            changePercent: activeSymbolData?.lastPricePercent ?? null,
            tradeVolume: activeSymbolData?.tradeVolume ?? null,
            tradeCount: activeSymbolData?.tradeCount ?? null,
        }),
        [activeSymbol.instrumentCode, activeSymbol.name, activeSymbol.symbol, activeSymbolData, symbolPrice]
    );

    const orderValidationContext = useMemo(
        () => ({
            livePrice: orderLivePrice,
            availableToSell,
            buyingPower: accountSummary.buyingPower,
            bidPriceRange: orderBookBidPriceRange,
            askPriceRange: orderBookAskPriceRange,
        }),
        [accountSummary.buyingPower, availableToSell, orderBookAskPriceRange, orderBookBidPriceRange, orderLivePrice]
    );

    const handleOrderPlaced = useCallback(
        (_result: CreateOrderResult, _closeAfter: boolean) => {
            void _result;
            void _closeAfter;
            setBottomPanelTab('orders');
            void refreshAccountStatus();
        },
        [refreshAccountStatus]
    );

    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

    const handleCancelOrder = useCallback(
        async (orderId: number) => {
            if (cancellingOrderId !== null) return;
            setCancellingOrderId(orderId);
            try {
                const result = await cancelTradingOrder(accessToken, orderId);
                showWatchlistToast(`سفارش ${result.order.sideLabel} نماد ${result.order.symbol} لغو شد.`, 'success');
                void refreshAccountStatus();
            } catch (error) {
                showWatchlistToast(
                    error instanceof Error ? error.message : 'لغو سفارش ناموفق بود.',
                    'error'
                );
            } finally {
                setCancellingOrderId(null);
            }
        },
        [accessToken, cancellingOrderId, refreshAccountStatus, showWatchlistToast]
    );

    const openWalletPanel = useCallback(() => {
        setMainNavTab('بازار');
        setSidebarTab('wallet');
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            setDrawerOpen(true);
        }
    }, []);

    const noticeYearOptions = useMemo(() => {
        const years = new Set<number>();

        for (let year = 1404; year >= 1390; year -= 1) {
            years.add(year);
        }

        codalNotices.forEach((notice) => {
            const parsed = parseJalaliDateTime(notice.publishDateTime || notice.sentDateTime);
            if (parsed) years.add(parsed.year);
        });

        return Array.from(years).sort((a, b) => b - a);
    }, [codalNotices]);

    const dayOptions = useMemo(() => Array.from({length: 31}, (_, index) => index + 1), []);

    const groupedNotices = useMemo(() => {
        const fromDateKey = noticeFilters.fromDate ? dateKeyFromParts(noticeFilters.fromDate) : null;
        const toDateKey = noticeFilters.toDate ? dateKeyFromParts(noticeFilters.toDate) : null;
        const groups = new Map<string, NoticeGroup>();

        codalNotices.forEach((notice) => {
            const parsed = parseJalaliDateTime(notice.publishDateTime || notice.sentDateTime);
            if (fromDateKey !== null && (!parsed || parsed.dateKey < fromDateKey)) return;
            if (toDateKey !== null && (!parsed || parsed.dateKey > toDateKey)) return;
            const noticeSymbols = getNoticeSymbols(notice);

            const underSupervision =
                notice.supervision?.underSupervision === 1 || notice.underSupervision === 1;
            if (noticeFilters.underSupervisionOnly && !underSupervision) return;

            const key = `${notice.title.trim()}|${notice.publishDateTime}|${notice.letterCode}`;
            const existing = groups.get(key);

            if (!existing) {
                groups.set(key, {
                    id: key,
                    title: notice.title.trim() || 'بدون عنوان',
                    publishDateTime: notice.publishDateTime || notice.sentDateTime || 'ناموجود',
                    symbols: noticeSymbols,
                    notices: [notice],
                    hasUnderSupervision: underSupervision,
                });
                return;
            }

            existing.notices.push(notice);
            existing.hasUnderSupervision = existing.hasUnderSupervision || underSupervision;

            noticeSymbols.forEach((symbol) => {
                if (!existing.symbols.includes(symbol)) {
                    existing.symbols.push(symbol);
                }
            });
        });

        return Array.from(groups.values()).sort((a, b) => {
            const aDate = parseJalaliDateTime(a.publishDateTime)?.dateTimeKey ?? 0;
            const bDate = parseJalaliDateTime(b.publishDateTime)?.dateTimeKey ?? 0;
            return bDate - aDate;
        });
    }, [codalNotices, noticeFilters.fromDate, noticeFilters.toDate, noticeFilters.underSupervisionOnly]);

    const hasActiveNoticeFilters = useMemo(
        () =>
            noticeFilters.symbol.trim() !== '' ||
            noticeFilters.fromDate !== null ||
            noticeFilters.toDate !== null ||
            noticeFilters.underSupervisionOnly,
        [
            noticeFilters.fromDate,
            noticeFilters.symbol,
            noticeFilters.toDate,
            noticeFilters.underSupervisionOnly,
        ]
    );

    const earliestLoadedDateKey = useMemo(() => {
        let minDate = Number.POSITIVE_INFINITY;
        codalNotices.forEach((notice) => {
            const parsed = parseJalaliDateTime(notice.publishDateTime || notice.sentDateTime);
            if (!parsed) return;
            if (parsed.dateKey < minDate) {
                minDate = parsed.dateKey;
            }
        });
        return Number.isFinite(minDate) ? minDate : null;
    }, [codalNotices]);

    const fromDateKey = useMemo(
        () => (noticeFilters.fromDate ? dateKeyFromParts(noticeFilters.fromDate) : null),
        [noticeFilters.fromDate]
    );

    const shouldLoadMoreNotices = useMemo(() => {
        if (codalNoticesError) return false;
        if (!codalNoticesHasMore) return false;
        if (codalNoticesLoading || codalNoticesLoadingMore || codalNoticesRefreshing) return false;
        if (fromDateKey !== null && earliestLoadedDateKey !== null && earliestLoadedDateKey < fromDateKey) {
            return false;
        }
        return true;
    }, [
        codalNoticesError,
        codalNoticesHasMore,
        codalNoticesLoading,
        codalNoticesLoadingMore,
        codalNoticesRefreshing,
        earliestLoadedDateKey,
        fromDateKey,
    ]);

    const isWaitingForNoticeResults = codalNoticesLoading || codalNoticesLoadingMore || codalNoticesRefreshing;

    const activeNoticeDetails = useMemo(() => {
        if (!activeNoticeGroup) return null;

        const primary = activeNoticeGroup.notices[0];

        const additionalInfo = activeNoticeGroup.notices
            .map((notice) => stripHtml(notice.supervision?.additionalInfo ?? ''))
            .filter((text) => text !== '')
            .join('\n');

        const reasons = Array.from(
            new Set(
                activeNoticeGroup.notices
                    .flatMap((notice) => notice.supervision?.reasons ?? [])
                    .map((reason) => reason.trim())
                    .filter((reason) => reason !== '')
            )
        );

        return {primary, additionalInfo, reasons};
    }, [activeNoticeGroup]);

    const openNoticeFilter = () => {
        setNoticeFilterDraft(noticeFilters);
        setNoticeSymbolDropdownOpen(false);
        setNoticeFilterOpen(true);
    };

    const updateDraftDatePart = (
        field: 'fromDate' | 'toDate',
        part: keyof JalaliDateParts,
        rawValue: string
    ) => {
        setNoticeFilterDraft((prev) => {
            if (rawValue === '') {
                return {...prev, [field]: null};
            }

            const parsed = parseNumberish(rawValue);
            if (!Number.isFinite(parsed)) return prev;

            const fallbackYear = noticeYearOptions[0] ?? 1404;
            const currentDate = prev[field] ?? {year: fallbackYear, month: 1, day: 1};
            return {
                ...prev,
                [field]: {
                    ...currentDate,
                    [part]: parsed,
                },
            };
        });
    };

    const applyNoticeFilters = (draft: NoticeUiFilters, options?: { closeModal?: boolean }) => {
        const nextFilters = toAppliedNoticeFilters(draft);
        setNoticeFilters(nextFilters);
        setCodalQuery((prev) => toNoticeQuery(prev, nextFilters));
        if (options?.closeModal ?? true) {
            setNoticeFilterOpen(false);
        }
        setNoticeSymbolDropdownOpen(false);
    };

    const clearNoticeFilters = () => {
        const cleared = createDefaultNoticeFilters();
        setNoticeFilterDraft(cleared);
        setNoticeFilters(cleared);
        setCodalQuery((prev) => toNoticeQuery(prev, cleared));
        setNoticeSymbolDropdownOpen(false);
    };

    const applyNoticeSymbolSuggestion = (symbol: string) => {
        const nextDraft = withNoticeSymbol(noticeFilterDraft, symbol);
        setNoticeFilterDraft(nextDraft);
        applyNoticeFilters(nextDraft);
    };

    const shouldLoadMoreSymbolNotices = useMemo(() => {
        if (symbolCodalNoticesError) return false;
        if (!symbolCodalNoticesHasMore) return false;
        if (symbolCodalNoticesLoading || symbolCodalNoticesLoadingMore || symbolCodalNoticesRefreshing) return false;
        return symbolTab === 'notices';
    }, [
        symbolCodalNoticesError,
        symbolCodalNoticesHasMore,
        symbolCodalNoticesLoading,
        symbolCodalNoticesLoadingMore,
        symbolCodalNoticesRefreshing,
        symbolTab,
    ]);

    const isWaitingForSymbolNoticeResults =
        symbolCodalNoticesLoading || symbolCodalNoticesLoadingMore || symbolCodalNoticesRefreshing;

    useEffect(() => {
        const root = symbolNoticeListRef.current;
        const sentinel = symbolNoticeLoadMoreRef.current;
        if (!root || !sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    if (!shouldLoadMoreSymbolNotices) return;
                    loadMoreSymbolCodalNotices();
                });
            },
            {
                root,
                rootMargin: '120px 0px 120px 0px',
                threshold: 0.1,
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [
        loadMoreSymbolCodalNotices,
        shouldLoadMoreSymbolNotices,
        symbolCodalNotices.length,
    ]);

    useEffect(() => {
        const root = noticeListRef.current;
        const sentinel = noticeLoadMoreRef.current;
        if (!root || !sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    if (!shouldLoadMoreNotices) return;
                    loadMoreCodalNotices();
                });
            },
            {
                root,
                rootMargin: '160px 0px 160px 0px',
                threshold: 0.1,
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [
        groupedNotices.length,
        loadMoreCodalNotices,
        shouldLoadMoreNotices,
    ]);

    const orderFilters: Array<{ key: OrderFilter; label: string }> = [
        {
            key: 'open',
            label: `فعال ${formatNumberFa(demoOrders.filter((o) => o.status === 'REQUESTED' || o.status === 'TRIGGER_PENDING').length)}`
        },
        {
            key: 'partial',
            label: `اجرای جزئی ${formatNumberFa(demoOrders.filter((o) => o.status === 'PARTIALLY_FILLED').length)}`
        },
        {
            key: 'done',
            label: `انجام شده ${formatNumberFa(demoOrders.filter((o) => o.status === 'COMPLETED').length)}`
        },
        {
            key: 'cancelled',
            label: `لغو شده ${formatNumberFa(demoOrders.filter((o) => o.status === 'CANCELLED').length)}`
        },
        {
            key: 'failed',
            label: `ناموفق ${formatNumberFa(demoOrders.filter((o) => o.status === 'FAILED').length)}`
        },
        {key: 'all', label: `همه ${formatNumberFa(demoOrders.length)}`},
    ];

    const bottomPanelTabs: Array<{ key: BottomPanelTab; label: string }> = [
        {key: 'orders', label: 'سفارشات'},
        {key: 'portfolio', label: 'سبد سهام'},
    ];

    const orderbookTabs: Array<{ key: OrderbookTab; label: string }> = [
        {key: 'peers', label: 'هم‌گروه'},
        {key: 'info', label: 'اطلاعات نماد'},
        {key: 'technical', label: 'تکنیکال'},
    ];

    const orderbookTabCaption = {
        peers: 'عملکرد نمادهای هم‌گروه در این بخش مقایسه می‌شود.',
        info: 'جزییات سفارشات لحظه‌ای و عمق بازار نماد در این نما قرار دارد.',
        technical: 'نمای تکنیکال در این تب به‌صورت خلاصه قابل نمایش است.',
    };

    useEffect(() => {
        if (!profileMenuOpen) return;

        const onClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            if (profileMenuRef.current?.contains(target)) return;
            setProfileMenuOpen(false);
        };

        window.addEventListener('mousedown', onClickOutside);
        return () => window.removeEventListener('mousedown', onClickOutside);
    }, [profileMenuOpen]);

    useEffect(() => {
        if (!noticeFilterOpen) {
            setNoticeSymbolDropdownOpen(false);
        }
    }, [noticeFilterOpen]);

    return (
        <div className="min-h-screen bg-bg text-text transition-colors duration-300">
            <div
                className="sticky top-0 z-50 border-b border-border/70 bg-surface/85 shadow-card backdrop-blur-xl dark:shadow-none">
                <header className="border-b border-border/60 px-3 py-2 sm:px-4">
                    <div
                        className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 [direction:ltr]">
                        <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
                            <div
                                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs text-muted">
                                <Clock3 className="h-3.5 w-3.5"/>
                                <span className="tabular-nums">{clockValue}</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSidebarTab('wallet')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary/15"
                                title="مشاهده کیف پول"
                                aria-label="مشاهده کیف پول"
                            >
                                <Wallet className="h-3.5 w-3.5"/>
                            </button>

                            <div ref={profileMenuRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary/35"
                                >
                                    <UserRound className="h-4 w-4 text-muted"/>
                                    {profileDisplayName}
                                </button>

                                {profileMenuOpen ? (
                                    <div
                                        className="absolute left-0 top-[calc(100%+8px)] z-40 w-44 rounded-xl border border-border/80 bg-surface p-1.5 shadow-card">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                onOpenProfile();
                                            }}
                                            className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-xs text-text transition hover:bg-surface-2"
                                        >
                                            نمایش/ویرایش پروفایل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                onLogout();
                                            }}
                                            className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-xs text-negative transition hover:bg-negative/10"
                                        >
                                            خروج از حساب
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div dir="rtl" className="lg:col-span-5">
                            <div className="relative mx-auto w-full max-w-[520px]">
                                <button
                                    type="button"
                                    onClick={() => setMarketPanelOpen((prev) => !prev)}
                                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-1.5 transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/35 ${
                                        marketPositive
                                            ? 'border-positive/30 bg-positive/[0.08]'
                                            : 'border-negative/35 bg-negative/[0.08]'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 text-xs text-muted">
                                        <span className="font-medium sm:text-sm">شاخص کل بورس</span>
                                        <span className="text-[11px] text-muted/80">بورس • فرابورس</span>
                                        {marketStateText && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                                    isMarketOpen
                                                        ? 'bg-positive/10 text-positive'
                                                        : 'bg-muted/10 text-muted'
                                                }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    isMarketOpen
                                                        ? 'bg-positive animate-pulse'
                                                        : 'bg-muted'
                                                }`}/>
                                                {marketStateText}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 [direction:ltr]">
                    <span
                        className="text-xl leading-none font-extrabold tracking-tight tabular-nums text-text sm:text-2xl">
                      {formatNumberOrDash(marketIndex)}
                    </span>

                                        <span
                                            className={`text-xs font-semibold tabular-nums sm:text-sm ${
                                                marketPositive ? 'text-positive' : 'text-negative'
                                            }`}
                                        >
                      {formatNumberOrDash(marketDelta)}
                    </span>

                                        <span
                                            className={`text-xs font-semibold tabular-nums sm:text-sm ${
                                                marketPositive ? 'text-positive' : 'text-negative'
                                            }`}
                                        >
                      ({formatPercentOrDash(marketPercent)})
                    </span>

                                        <ChevronDown
                                            className={`h-3.5 w-3.5 text-muted transition ${marketPanelOpen ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </button>

                                {marketPanelOpen ? (
                                    <div
                                        className="mt-2 rounded-xl border border-border/70 bg-surface p-1.5 shadow-card lg:absolute lg:left-0 lg:right-0 lg:top-full lg:z-30">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {marketDetails.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="rounded-lg border border-border/70 bg-surface-2 p-2.5"
                                                >
                                                    <div className="mb-1.5 flex items-center justify-between">
                                                        <span
                                                            className="text-xs font-semibold text-text sm:text-sm">{item.label}</span>
                                                        <span
                                                            className={`text-[11px] font-semibold tabular-nums ${
                                                                item.positive ? 'text-positive' : 'text-negative'
                                                            }`}
                                                        >
                              {formatNumberOrDash(item.deltaValue)} ({formatPercentOrDash(item.percentValue)})
                            </span>
                                                    </div>

                                                    <div
                                                        className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] sm:text-[11px]">
                                                        <span className="text-muted">شاخص کل</span>
                                                        <span
                                                            className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatNumberOrDash(item.indexValue)}
                            </span>

                                                        <span className="text-muted">تغییرات</span>
                                                        <span
                                                            className={`text-left font-semibold tabular-nums [direction:ltr] ${
                                                                item.positive ? 'text-positive' : 'text-negative'
                                                            }`}
                                                        >
                              {formatNumberOrDash(item.deltaValue)} ({formatPercentOrDash(item.percentValue)})
                            </span>

                                                        <span className="text-muted">تعداد معاملات</span>
                                                        <span
                                                            className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatNumberOrDash(item.totalTrades)}
                            </span>

                                                        <span className="text-muted">ارزش معاملات</span>
                                                        <span
                                                            className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatCompactValueOrUnavailable(item.tradeValue, 'T')}
                            </span>

                                                        <span className="text-muted">حجم معاملات</span>
                                                        <span
                                                            className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatCompactValueOrUnavailable(item.tradeVolume, 'B')}
                            </span>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div dir="rtl" className="flex min-w-0 items-center justify-end gap-2 lg:col-span-4">
                            <div
                                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5">
                                <div className="h-6 w-6 rounded-lg border border-border/80 bg-surface"/>
                                <span className="text-sm font-semibold text-text">اوراق بهادار</span>
                            </div>

                            <div className="flex min-w-0 items-center gap-2">
                                <nav
                                    className="hidden items-center rounded-full border border-border/80 bg-surface-2 p-1 text-xs xl:inline-flex">
                                    {(['بازار', 'درخواست‌ها', 'گزارشات'] as const).map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setMainNavTab(item)}
                                            className={`rounded-full px-3 py-1 transition ${
                                                mainNavTab === item
                                                    ? 'bg-surface text-text shadow-sm'
                                                    : 'text-muted hover:text-text'
                                            }`}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </nav>

                                <button
                                    type="button"
                                    onClick={(event) => {
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        onToggleTheme({
                                            x: rect.left + rect.width / 2,
                                            y: rect.top + rect.height / 2,
                                        });
                                    }}
                                    aria-label="toggle theme"
                                    className="relative inline-flex h-8 w-[72px] items-center overflow-hidden rounded-full border border-border/80 bg-surface-2 px-1 transition hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/50"
                                >
                  <span
                      className={`absolute top-1 left-1 h-6 w-8 rounded-full bg-surface shadow-sm transition-transform duration-300 ${
                          theme === 'dark' ? 'translate-x-9' : 'translate-x-0'
                      }`}
                  />
                                    <span
                                        className={`z-10 flex h-6 w-8 items-center justify-center rounded-full text-[11px] transition-colors duration-200 ${
                                            theme === 'dark' ? 'text-muted' : 'text-text'
                                        }`}
                                    >
                    <Sun className="h-3.5 w-3.5"/>
                  </span>
                                    <span
                                        className={`z-10 flex h-6 w-8 items-center justify-center rounded-full text-[11px] transition-colors duration-200 ${
                                            theme === 'dark' ? 'text-text' : 'text-muted'
                                        }`}
                                    >
                    <Moon className="h-3.5 w-3.5"/>
                  </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="px-3 py-2 sm:px-4">
                    <div
                        className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center [direction:ltr]">
                        <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
                            <button type="button" className={`${actionBtnClass} w-10`} aria-label="menu">
                                <Menu className="h-4 w-4"/>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOrderModalSide('BUY')}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-positive px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-positive/50"
                            >
                                خرید
                            </button>

                            <button
                                type="button"
                                onClick={() => setOrderModalSide('SELL')}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-negative px-4 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-negative/50"
                            >
                                فروش
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleToggleFavorite()}
                                disabled={watchlistBusy}
                                title={favoriteButtonTitle}
                                className={`${actionBtnClass} w-10 disabled:cursor-not-allowed disabled:opacity-70`}
                                aria-label="favorite"
                            >
                                {watchlistBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-warning"/>
                                ) : (
                                    <Star
                                        className={`h-4 w-4 transition ${
                                            isSymbolInSelectedWatchlist ? 'fill-positive text-positive' : 'text-warning'
                                        }`}
                                    />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={openWatchlistDrawer}
                                className={`${actionBtnClass} w-10 md:hidden`}
                                aria-label="open watchlist"
                            >
                                <Bell className="h-4 w-4"/>
                            </button>
                        </div>

                        <SymbolSearchCombobox
                            selectedSymbol={selectedSymbol}
                            onSelectSymbol={setSelectedSymbol}
                            onPreviewSymbolChange={setPreviewSymbol}
                            placeholder="جستجوی نماد یا شرکت"
                        />

                        <div className="hidden lg:flex lg:col-span-2 lg:justify-end">
                            <button
                                type="button"
                                onClick={openWatchlistSection}
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-3 text-xs text-muted transition hover:text-text"
                                aria-label="open watchlist"
                            >
                                <Bell className="h-4 w-4"/>
                                دیده‌بان
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <main className="mx-auto w-full max-w-[1800px] space-y-4 px-3 py-4 pb-28 sm:px-4">
                {mainNavTab === 'گزارشات' ? (
                    <WalletReportsPanel accessToken={accessToken}/>
                ) : mainNavTab === 'درخواست‌ها' ? (
                    <section dir="rtl" className={`${cardClass} p-6 text-center`}>
                        <h2 className="text-sm font-semibold text-text">درخواست‌ها</h2>
                        <p className="mt-2 text-xs text-muted">این بخش به‌زودی در دسترس خواهد بود.</p>
                    </section>
                ) : (
                    <>
                        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 [direction:ltr]">
                            <section dir="rtl" className={`${cardClass} self-start p-3 md:col-span-2 xl:col-span-6`}>
                                {symbolLoading && !activeSymbolData ? (
                                    <div className="animate-pulse">
                                        <div className="mb-3">
                                            <div className="h-5 w-24 rounded bg-border/60"/>
                                            <div className="mt-2 h-4 w-32 rounded bg-border/45"/>
                                        </div>
                                        <div className="mb-3 h-24 rounded-2xl bg-surface-2/60"/>
                                        <div className="h-64 rounded-2xl border border-border/70 bg-surface-2/60"/>
                                        <div className="mt-3 h-24 rounded-2xl bg-surface-2/60"/>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3">
                                            <h2 className="text-sm font-semibold text-text">دفتر سفارشات</h2>
                                            <p className="text-xs text-muted">{activeSymbolSummary}</p>
                                        </div>

                                        {symbolError && !activeSymbolData ? (
                                            <div
                                                className="mb-3 rounded-xl border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{symbolError}</span>
                                                    <button
                                                        type="button"
                                                        onClick={refreshSymbolDetails}
                                                        className="rounded-full border border-negative/35 bg-negative/10 px-2.5 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                                                    >
                                                        تلاش مجدد
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="mb-3 rounded-xl border border-border/70 bg-surface-2 p-1">
                                            <div className="flex flex-wrap items-center gap-1 text-xs">
                                                {orderbookTabs.map((tab) => (
                                                    <button
                                                        key={tab.key}
                                                        type="button"
                                                        onClick={() => setOrderbookTab(tab.key)}
                                                        className={`rounded-lg px-3 py-1.5 transition ${
                                                            orderbookTab === tab.key
                                                                ? 'bg-surface text-text shadow-sm'
                                                                : 'text-muted hover:text-text'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {orderbookTab === 'peers' ? (
                                            <PeerGroupPanel
                                                rows={peerGroupRows}
                                                sectorName={peerGroupSectorName}
                                                activeSymbol={activeSymbol.symbol}
                                                loading={peerGroupLoading}
                                                error={peerGroupError}
                                                onRetry={refreshPeerGroup}
                                                onSelectSymbol={setSelectedSymbol}
                                                formatNumber={formatOrderBookValue}
                                                formatCompactAmount={formatCompactAmountFa}
                                                formatPercent={formatPercentOrDash}
                                            />
                                        ) : orderbookTab === 'technical' ? (
                                            <div
                                                className={`flex ${ORDERBOOK_SLOT_HEIGHT_CLASS} items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface-2 px-4 text-center text-xs text-muted`}
                                            >
                                                {orderbookTabCaption.technical}
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className="mb-3 rounded-2xl border border-border/70 bg-surface-2 p-4">
                                                    <div
                                                        className="mb-3 text-center text-xs font-medium text-muted">بازه
                                                        مجاز
                                                        روزانه
                                                    </div>
                                                    <div
                                                        className="grid grid-cols-[74px_1fr] items-center gap-3 text-xs [direction:ltr]">
                <span
                    className={`text-left text-sm font-bold tabular-nums ${
                        symbolPercent === null ? 'text-muted' : symbolPositive ? 'text-positive' : 'text-negative'
                    }`}
                >
                  {formatNumberOrDash(symbolPrice)}
                </span>

                                                        <div>
                                                            <div
                                                                className="mb-1 flex items-center justify-between text-[11px] text-muted">
                                                                <span
                                                                    className="tabular-nums">{formatNumberOrDash(dailyMin)}</span>
                                                                <span
                                                                    className="tabular-nums">{formatNumberOrDash(dailyMax)}</span>
                                                            </div>

                                                            <div className="relative h-2 rounded-full bg-border/45">
                                                                <div
                                                                    className={`absolute inset-y-0 left-0 rounded-full ${symbolPositive ? 'bg-positive/20' : 'bg-negative/20'}`}
                                                                    style={{width: `${markerPercent}%`}}
                                                                />
                                                                <div
                                                                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-surface shadow-card ${
                                                                        symbolPositive ? 'bg-positive' : 'bg-negative'
                                                                    }`}
                                                                    style={{left: `calc(${markerPercent}% - 8px)`}}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="overflow-hidden rounded-2xl border border-border/70">
                                                    <OrderBookPanel
                                                        rows={orderBookRows}
                                                        formatNumber={formatOrderBookValue}
                                                        embedded
                                                    />

                                                    <div className="border-t border-border/60 bg-surface-2 p-3">
                                                        <OrderBookDepthPanel
                                                            rows={depthRows}
                                                            formatCount={formatOrderBookValue}
                                                            formatVolume={formatCompactAmountFa}
                                                            formatPercent={formatDepthPercent}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </section>

                            <section dir="rtl" className={`${cardClass} p-3 md:col-span-1 xl:col-span-3`}>
                                {symbolLoading && !activeSymbolData ? (
                                    <div className="rounded-2xl border border-border/70 bg-surface-2 p-3 animate-pulse">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full bg-border/60"/>
                                                <div className="h-5 w-24 rounded bg-border/60"/>
                                            </div>
                                            <div className="h-4 w-32 rounded bg-border/45"/>
                                        </div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="h-6 w-12 rounded-full bg-border/60"/>
                                            <div className="h-6 w-12 rounded-full bg-border/60"/>
                                        </div>
                                        <div className="mb-2 h-10 w-32 rounded bg-border/60"/>
                                        <div className="mb-4 h-5 w-16 rounded bg-border/45"/>
                                        <div className="mt-2 space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="h-4 w-12 rounded bg-border/45"/>
                                                <div className="h-4 w-24 rounded bg-border/60"/>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="h-4 w-12 rounded bg-border/45"/>
                                                <div className="h-4 w-16 rounded bg-border/60"/>
                                            </div>
                                        </div>
                                    </div>
                                ) : symbolError && !activeSymbolData ? (
                                    <div
                                        className="rounded-2xl border border-negative/30 bg-negative/10 p-4 text-center text-negative">
                                        <AlertCircle className="mx-auto mb-2 h-6 w-6 opacity-80"/>
                                        <p className="text-sm font-semibold mb-2">اطلاعات یافت نشد یا درخواست با خطا
                                            مواجه
                                            شد.</p>
                                        <button
                                            type="button"
                                            onClick={refreshSymbolDetails}
                                            className="rounded-full border border-negative/35 bg-negative/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-negative/15"
                                        >
                                            تلاش مجدد
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-border/70 bg-surface-2 p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${symbolPositive ? 'bg-positive' : 'bg-negative'}`}/>
                                                <h2 className="text-base font-semibold text-text">{activeSymbolData?.title ?? activeSymbol.symbol}</h2>
                                            </div>
                                            <span
                                                className="text-xs text-muted">{activeSymbolData?.subtitle ?? activeSymbol.name}</span>
                                        </div>

                                        <div className="mb-3 flex items-center gap-2">
                                            {codalSymbolUrl ? (
                                                <a
                                                    href={codalSymbolUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="rounded-full bg-positive/15 px-2.5 py-1 text-[11px] font-medium text-positive transition hover:bg-positive/20"
                                                >
                                                    کدال
                                                </a>
                                            ) : (
                                                <span
                                                    className="rounded-full bg-positive/15 px-2.5 py-1 text-[11px] font-medium text-positive">
                      کدال
                    </span>
                                            )}

                                            {(activeSymbolData?.exchangeBadge || activeSymbol.type !== 'UNKNOWN') && (
                                                tsetmcSymbolUrl ? (
                                                    <a
                                                        href={tsetmcSymbolUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="rounded-full border border-border/60 bg-surface px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-primary/40 hover:text-text"
                                                    >
                                                        {activeSymbolData?.exchangeBadge || toExchangeBadge(activeSymbol.type)}
                                                    </a>
                                                ) : (
                                                    <span
                                                        className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted border border-border/60">
                          {activeSymbolData?.exchangeBadge || toExchangeBadge(activeSymbol.type)}
                        </span>
                                                )
                                            )}
                                        </div>

                                        <div
                                            className="text-4xl font-bold tabular-nums tracking-tight text-text">{formatNumberOrDash(symbolPrice)}</div>
                                        <div
                                            className={`mt-1 text-sm font-semibold tabular-nums ${
                                                symbolPercent === null ? 'text-muted' : symbolPositive ? 'text-positive' : 'text-negative'
                                            }`}
                                        >
                                            {formatPercentOrDash(symbolPercent)}
                                        </div>

                                        <div className="mt-2 space-y-1 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted">پایانی</span>
                                                <span className="font-medium tabular-nums text-text">
                      {formatNumberOrDash(activeSymbolData?.closePrice)} ({formatPercentOrDash(activeSymbolData?.closePricePercent)})
                    </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                        <span className="text-muted">
                                            {activeSymbolData?.source === 'fund' ? 'حباب' : 'وضعیت'}
                                        </span>
                                                <span className="font-medium tabular-nums text-text">
                                            {activeSymbolData?.source === 'fund'
                                                ? formatPercentOrDash(activeSymbolData?.bubblePercent)
                                                : activeSymbolData?.stateTitle ?? 'ناموجود'}
                                        </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-1">
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setSymbolTab('notices')}
                                            className={`rounded-lg px-2 py-2 transition ${
                                                symbolTab === 'notices'
                                                    ? 'bg-surface text-text shadow-sm'
                                                    : 'text-muted hover:text-text'
                                            }`}
                                        >
                                            اطلاعیه‌ها
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSymbolTab('details')}
                                            className={`rounded-lg px-2 py-2 transition ${
                                                symbolTab === 'details'
                                                    ? 'bg-surface text-text shadow-sm'
                                                    : 'text-muted hover:text-text'
                                            }`}
                                        >
                                            جزئیات نماد
                                        </button>
                                    </div>
                                </div>

                                {symbolTab === 'notices' ? (
                                    <div className="mt-3">
                                        <div
                                            ref={symbolNoticeListRef}
                                            className="thin-scrollbar max-h-[280px] space-y-2 overflow-y-auto pl-1"
                                        >
                                            {(isWaitingForSymbolNoticeResults ||
                                                (symbolCodalNotices.length === 0 && shouldLoadMoreSymbolNotices)) &&
                                            symbolCodalNotices.length === 0 ? (
                                                Array.from({length: 4}, (_, index) => (
                                                    <div
                                                        key={`symbol-codal-skeleton-${index + 1}`}
                                                        className="animate-pulse rounded-xl border border-border/70 bg-surface px-3 py-3"
                                                    >
                                                        <div className="mb-2 h-4 w-4/5 rounded bg-border/60"/>
                                                        <div className="mb-3 h-4 w-3/5 rounded bg-border/60"/>
                                                        <div className="h-3 w-2/5 rounded bg-border/45"/>
                                                    </div>
                                                ))
                                            ) : null}

                                            {symbolCodalNoticesError ? (
                                                <div
                                                    className="rounded-xl border border-negative/30 bg-negative/10 p-3 text-xs text-negative">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4"/>
                                                        {symbolCodalNoticesError}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={refreshSymbolCodalNotices}
                                                        className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                                                    >
                                                        تلاش مجدد
                                                    </button>
                                                </div>
                                            ) : null}

                                            {!isWaitingForSymbolNoticeResults &&
                                            !shouldLoadMoreSymbolNotices &&
                                            symbolCodalNotices.length === 0 &&
                                            !symbolCodalNoticesError ? (
                                                <div
                                                    className="rounded-xl border border-dashed border-border/70 bg-surface-2 px-3 py-6 text-center text-xs text-muted">
                                                    اطلاعیه‌ای برای این نماد پیدا نشد.
                                                </div>
                                            ) : null}

                                            {symbolCodalNotices.map((notice) => {
                                                const noticeGroup = toSingleNoticeGroup(notice);
                                                const visibleSymbols = noticeGroup.symbols.slice(0, 3);
                                                const extraSymbolsCount = noticeGroup.symbols.length - visibleSymbols.length;

                                                return (
                                                    <article
                                                        key={noticeGroup.id}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => setActiveNoticeGroup(noticeGroup)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault();
                                                                setActiveNoticeGroup(noticeGroup);
                                                            }
                                                        }}
                                                        className="cursor-pointer rounded-xl border border-border/70 bg-surface px-3 py-2.5 transition hover:border-primary/30 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary/45"
                                                    >
                                                        <h4 className="text-sm leading-7 font-semibold text-text">
                                                            {noticeGroup.title}
                                                        </h4>

                                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                            {visibleSymbols.map((symbol) => (
                                                                <span
                                                                    key={`${noticeGroup.id}-${symbol}`}
                                                                    className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted"
                                                                >
                                                            {symbol}
                                                        </span>
                                                            ))}

                                                            {extraSymbolsCount > 0 ? (
                                                                <span
                                                                    className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted">
                                                            + {formatFaInteger(extraSymbolsCount)}
                                                        </span>
                                                            ) : null}

                                                            {noticeGroup.hasUnderSupervision ? (
                                                                <span
                                                                    className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] text-warning">
                                                            تحت نظارت
                                                        </span>
                                                            ) : null}
                                                        </div>

                                                        <p className="mt-2 text-[11px] text-muted">
                                                            {noticeGroup.publishDateTime}
                                                        </p>
                                                    </article>
                                                );
                                            })}

                                            <div ref={symbolNoticeLoadMoreRef} className="h-6 w-full"/>

                                            {symbolCodalNoticesLoadingMore && shouldLoadMoreSymbolNotices ? (
                                                <div
                                                    className="flex items-center justify-center gap-2 py-2 text-xs text-muted">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                                    در حال بارگذاری اطلاعیه‌های بیشتر...
                                                </div>
                                            ) : null}

                                            {!symbolCodalNoticesLoading &&
                                            !shouldLoadMoreSymbolNotices &&
                                            symbolCodalNotices.length > 0 ? (
                                                <div className="py-1 text-center text-[11px] text-muted">
                                                    همه اطلاعیه‌ها نمایش داده شد.
                                                </div>
                                            ) : null}
                                        </div>

                                        <div
                                            className="mt-2 flex h-5 items-center justify-between px-1 text-[11px] text-muted">
                                    <span className="flex items-center gap-1.5">
                                        {symbolCodalNoticesRefreshing ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                        ) : null}
                                        <span>تعداد کل: {formatNumberFa(symbolCodalNoticesTotalCount)}</span>
                                    </span>
                                            <span>نمایش داده شده: {formatNumberFa(symbolCodalNotices.length)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="thin-scrollbar mt-3 max-h-[336px] space-y-1 overflow-y-auto rounded-2xl border border-border/70 p-2">
                                        {symbolError && !activeSymbolData ? (
                                            <div
                                                className="rounded-xl border border-negative/30 bg-negative/10 p-3 text-xs text-negative">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4"/>
                                                    {symbolError}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={refreshSymbolDetails}
                                                    className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                                                >
                                                    تلاش مجدد
                                                </button>
                                            </div>
                                        ) : null}

                                        {symbolLoading && !activeSymbolData
                                            ? Array.from({length: 6}, (_, index) => (
                                                <div key={`symbol-detail-skeleton-${index + 1}`}
                                                     className="rounded-lg px-2 py-2">
                                                    <div className="mb-2 h-3 w-1/3 animate-pulse rounded bg-border/60"/>
                                                    <div className="h-3 w-1/2 animate-pulse rounded bg-border/45"/>
                                                </div>
                                            ))
                                            : null}

                                        {!symbolLoading && symbolDetails.length === 0 && !symbolError ? (
                                            <div
                                                className="rounded-xl border border-dashed border-border/70 bg-surface-2 px-3 py-4 text-center text-xs text-muted">
                                                اطلاعات نماد موجود نیست.
                                            </div>
                                        ) : null}

                                        {symbolDetails.map((item) => (
                                            <div
                                                key={item.label}
                                                className="flex items-center justify-between rounded-lg px-2 py-2 text-xs transition hover:bg-surface-2"
                                            >
                                                <span className="text-muted">{item.label}</span>
                                                <span
                                                    className="font-medium tabular-nums text-text"
                                                    dir={item.valueType === 'datetime' ? 'ltr' : undefined}
                                                >
                      {item.valueType === 'number'
                          ? formatNumberOrDash(typeof item.value === 'number' ? item.value : null, item.digits ?? 0)
                          : item.valueType === 'percent'
                              ? formatPercentOrDash(typeof item.value === 'number' ? item.value : null, item.digits ?? 2)
                              : item.valueType === 'currency'
                                  ? formatNumberWithUnit(typeof item.value === 'number' ? item.value : null, 'ریال')
                                  : item.valueType === 'datetime'
                                      ? typeof item.value === 'string' && item.value
                                          ? item.value
                                          : 'ناموجود'
                                      : typeof item.value === 'string'
                                          ? item.value || 'ناموجود'
                                          : 'ناموجود'}
                    </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <div className="hidden md:block md:col-span-1 xl:col-span-3">
                                <WatchlistPanel
                                    activeTab={sidebarTab}
                                    onTabChange={setSidebarTab}
                                    watchlists={watchlists}
                                    selectedWatchlistId={selectedWatchlistId}
                                    onSelectWatchlist={setSelectedWatchlistId}
                                    loading={watchlistsLoading}
                                    error={watchlistsError}
                                    onRetry={() => void loadWatchlists()}
                                    onRequestCreateWatchlist={openCreateWatchlistModal}
                                    onRequestEditWatchlist={openEditWatchlistModal}
                                    onRequestDeleteWatchlist={(watchlistId) => void handleDeleteWatchlist(watchlistId)}
                                    onSelectSymbol={setSelectedSymbol}
                                    onRemoveSymbol={(symbolId) => void handleRemoveSymbolFromWatchlist(symbolId)}
                                    watchlistBusy={watchlistBusy}
                                    currentSymbolKey={selectedSymbol.key}
                                    currentSymbolPrice={selectedSymbolLivePrice}
                                    userProfile={userProfile}
                                    accountSummary={accountSummary}
                                    accessToken={accessToken}
                                    onProfileUpdated={onProfileUpdated}
                                />
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 [direction:ltr]">
                            <section dir="rtl" className={`${cardClass} p-3 xl:col-span-8`}>
                                <div
                                    className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                                    <div
                                        className="inline-flex rounded-xl border border-border/80 bg-surface-2 p-1 text-xs">
                                        {bottomPanelTabs.map((tab) => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => setBottomPanelTab(tab.key)}
                                                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 font-semibold transition ${
                                                    bottomPanelTab === tab.key
                                                        ? 'bg-surface text-text shadow-sm'
                                                        : 'text-muted hover:text-text'
                                                }`}
                                            >
                                                {tab.key === 'orders' ? <FileText className="h-3.5 w-3.5"/> :
                                                    <Wallet className="h-3.5 w-3.5"/>}
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {bottomPanelTab === 'orders' ? (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {orderFilters.map((chip) => (
                                                <button
                                                    key={chip.key}
                                                    type="button"
                                                    onClick={() => setOrderFilter(chip.key)}
                                                    className={`rounded-full border px-3 py-1 text-[11px] transition ${
                                                        orderFilter === chip.key
                                                            ? 'border-primary/40 bg-primary/15 text-primary'
                                                            : 'border-border/80 bg-surface-2 text-muted hover:text-text'
                                                    }`}
                                                >
                                                    {chip.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-[11px] text-muted">
                                    <span className="rounded-full border border-border/70 bg-surface-2 px-2.5 py-1">
                                        تعداد دارایی‌ها {formatNumberFa(demoPortfolioRows.length)}
                                    </span>
                                            <span
                                                className="rounded-full border border-positive/25 bg-positive/10 px-2.5 py-1 text-positive">
                                        ارزش خالص {formatCompactAmountFa(
                                                demoPortfolioRows.reduce(
                                                    (sum, row) => sum + row.quantity * (row.livePrice ?? row.buyPrice),
                                                    0
                                                )
                                            )} ریال
                                    </span>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="thin-scrollbar max-h-[360px] min-h-[255px] overflow-auto rounded-2xl border border-border/70 bg-surface-2/70">
                                    {tradingAccountLoading ? (
                                        <div
                                            className="flex min-h-[255px] items-center justify-center gap-2 text-xs text-muted">
                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                            در حال دریافت اطلاعات معاملاتی...
                                        </div>
                                    ) : tradingAccountError ? (
                                        <div
                                            className="flex min-h-[255px] flex-col items-center justify-center gap-3 px-4 text-center text-xs text-negative">
                                            <AlertCircle className="h-5 w-5"/>
                                            {tradingAccountError}
                                        </div>
                                    ) : bottomPanelTab === 'orders' && filteredOrders.length === 0 ? (
                                        <div
                                            className="flex min-h-[255px] items-center justify-center px-4 text-center text-xs text-muted">
                                            سفارشی با فیلتر فعلی پیدا نشد.
                                        </div>
                                    ) : bottomPanelTab === 'portfolio' && demoPortfolioRows.length === 0 ? (
                                        <div
                                            className="flex min-h-[255px] items-center justify-center px-4 text-center text-xs text-muted">
                                            سبد سهام شما خالی است.
                                        </div>
                                    ) : bottomPanelTab === 'orders' ? (
                                        <table className="w-full min-w-[1020px] border-collapse text-right text-xs">
                                            <thead>
                                            <tr className="border-b border-border/70 bg-surface text-[11px] font-semibold text-muted">
                                                <th className="px-3 py-3">نوع</th>
                                                <th className="px-3 py-3">نماد</th>
                                                <th className="px-3 py-3">تعداد کل</th>
                                                <th className="px-3 py-3">اجرا شده</th>
                                                <th className="px-3 py-3">باقیمانده</th>
                                                <th className="px-3 py-3">قیمت سفارش</th>
                                                <th className="px-3 py-3">میانگین اجرا</th>
                                                <th className="px-3 py-3">زمان</th>
                                                <th className="px-3 py-3">وضعیت</th>
                                                <th className="px-3 py-3">عملیات</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filteredOrders.map((order) => {
                                                const isBuy = order.type === 'buy';
                                                const statusClass =
                                                    order.status === 'COMPLETED'
                                                        ? 'border-positive/35 bg-positive/10 text-positive'
                                                        : order.status === 'FAILED'
                                                            ? 'border-negative/35 bg-negative/10 text-negative'
                                                            : order.status === 'CANCELLED'
                                                                ? 'border-warning/35 bg-warning/10 text-warning'
                                                                : order.status === 'PARTIALLY_FILLED'
                                                                    ? 'border-amber-400/35 bg-amber-400/10 text-amber-600 dark:text-amber-400'
                                                                    : 'border-primary/35 bg-primary/10 text-primary';
                                                const isCancelling = cancellingOrderId === order.id;

                                                return (
                                                    <tr
                                                        key={order.id}
                                                        className="border-b border-border/50 bg-surface/35 transition last:border-b-0 hover:bg-surface"
                                                    >
                                                        <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex min-w-14 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                                                            isBuy
                                                                ? 'border-positive/35 bg-positive/10 text-positive'
                                                                : 'border-negative/35 bg-negative/10 text-negative'
                                                        }`}
                                                    >
                                                        {isBuy ? 'خرید' : 'فروش'}
                                                    </span>
                                                        </td>
                                                        <td className="px-3 py-3 font-bold text-text">{order.symbol}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.quantity)}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.executedQuantity)}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.remainingQuantity)}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(order.orderPrice)}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{order.averageExecutedPrice ? formatNumberFa(order.averageExecutedPrice) : '—'}</td>
                                                        <td className="px-3 py-3 text-muted">{order.time}</td>
                                                        <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>
                                                        {order.statusLabel}
                                                    </span>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {order.cancellable ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={isCancelling}
                                                                    onClick={() => {
                                                                        if (confirm('آیا از لغو این سفارش اطمینان دارید؟')) {
                                                                            void handleCancelOrder(order.id);
                                                                        }
                                                                    }}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-negative/40 bg-negative/10 px-2.5 py-1 text-[11px] font-semibold text-negative transition hover:bg-negative/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {isCancelling ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin"/>
                                                                    ) : (
                                                                        <X className="h-3 w-3"/>
                                                                    )}
                                                                    لغو
                                                                </button>
                                                            ) : (
                                                                <span className="text-[11px] text-muted">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full min-w-[760px] border-collapse text-right text-xs">
                                            <thead>
                                            <tr className="border-b border-border/70 bg-surface text-[11px] font-semibold text-muted">
                                                <th className="px-3 py-3">نماد</th>
                                                <th className="px-3 py-3">زمان</th>
                                                <th className="px-3 py-3">تعداد</th>
                                                <th className="px-3 py-3">قیمت خرید</th>
                                                <th className="px-3 py-3">قیمت لحظه‌ای</th>
                                                <th className="px-3 py-3">ارزش خالص</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {demoPortfolioRows.map((row) => {
                                                const livePrice = row.livePrice ?? row.buyPrice;
                                                const netValue = row.quantity * livePrice;
                                                const gainPercent = row.buyPrice > 0 ? ((livePrice - row.buyPrice) / row.buyPrice) * 100 : null;

                                                return (
                                                    <tr
                                                        key={row.id}
                                                        className="border-b border-border/50 bg-surface/35 transition last:border-b-0 hover:bg-surface"
                                                    >
                                                        <td className="px-3 py-3 font-bold text-text">{row.symbol}</td>
                                                        <td className="px-3 py-3 text-muted">{row.time}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(row.quantity)}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{formatNumberFa(row.buyPrice)}</td>
                                                        <td className="px-3 py-3 tabular-nums text-text">{formatNumberOrDash(row.livePrice)}</td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex flex-col gap-1">
                                                                <span
                                                                    className="font-bold tabular-nums text-text">{formatNumberWithUnit(netValue, 'ریال')}</span>
                                                                <span
                                                                    className={`text-[11px] font-semibold tabular-nums ${
                                                                        gainPercent === null
                                                                            ? 'text-muted'
                                                                            : gainPercent >= 0
                                                                                ? 'text-positive'
                                                                                : 'text-negative'
                                                                    }`}
                                                                >
                                                            {formatPercentOrDash(gainPercent)}
                                                        </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </section>

                            <section dir="rtl" className={`${cardClass} p-3 xl:col-span-4`}>
                                <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-text">پیام‌های ناظر</h3>
                                        <span
                                            className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-muted">
                  {formatNumberFa(groupedNotices.length)}
                </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {codalNoticesRefreshing ?
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted"/> : null}
                                        <button
                                            type="button"
                                            onClick={openNoticeFilter}
                                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-surface-2 text-muted transition hover:text-text focus-visible:ring-2 focus-visible:ring-primary/45 ${
                                                hasActiveNoticeFilters ? 'border-primary/45 text-primary' : 'border-border/80'
                                            }`}
                                            aria-label="open notice filters"
                                        >
                                            <Filter className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>

                                <div ref={noticeListRef}
                                     className="thin-scrollbar h-[324px] space-y-2 overflow-y-auto pl-1">
                                    {(isWaitingForNoticeResults || (groupedNotices.length === 0 && shouldLoadMoreNotices)) &&
                                    groupedNotices.length === 0 ? (
                                        Array.from({length: 4}, (_, index) => (
                                            <div
                                                key={`notice-skeleton-${index + 1}`}
                                                className="animate-pulse rounded-xl border border-border/70 bg-surface px-3 py-3"
                                            >
                                                <div className="mb-2 h-4 w-4/5 rounded bg-border/60"/>
                                                <div className="mb-3 h-4 w-3/5 rounded bg-border/60"/>
                                                <div className="h-3 w-2/5 rounded bg-border/45"/>
                                            </div>
                                        ))
                                    ) : null}

                                    {codalNoticesError ? (
                                        <div
                                            className="rounded-xl border border-negative/30 bg-negative/10 p-3 text-xs text-negative">
                                            <div className="mb-2 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4"/>
                                                {codalNoticesError}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={refreshCodalNotices}
                                                className="rounded-full border border-negative/35 bg-negative/10 px-3 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                                            >
                                                تلاش مجدد
                                            </button>
                                        </div>
                                    ) : null}

                                    {!isWaitingForNoticeResults &&
                                    !shouldLoadMoreNotices &&
                                    groupedNotices.length === 0 &&
                                    !codalNoticesError ? (
                                        <div
                                            className="rounded-xl border border-dashed border-border/70 bg-surface-2 px-3 py-6 text-center text-xs text-muted">
                                            موردی با فیلتر فعلی پیدا نشد.
                                        </div>
                                    ) : null}

                                    {groupedNotices.map((group) => {
                                        const visibleSymbols = group.symbols.slice(0, 4);
                                        const extraSymbolsCount = group.symbols.length - visibleSymbols.length;

                                        return (
                                            <article
                                                key={group.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setActiveNoticeGroup(group)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        setActiveNoticeGroup(group);
                                                    }
                                                }}
                                                className="cursor-pointer rounded-xl border border-border/70 bg-surface px-3 py-2.5 transition hover:border-primary/30 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary/45"
                                            >
                                                <h4 className="text-sm leading-7 font-semibold text-text">{group.title}</h4>

                                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                    {visibleSymbols.map((symbol) => (
                                                        <span
                                                            key={`${group.id}-${symbol}`}
                                                            className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted"
                                                        >
                          {symbol}
                        </span>
                                                    ))}

                                                    {extraSymbolsCount > 0 ? (
                                                        <span
                                                            className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted">
                          + {formatFaInteger(extraSymbolsCount)}
                        </span>
                                                    ) : null}

                                                    {group.hasUnderSupervision ? (
                                                        <span
                                                            className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] text-warning">
                          تحت نظارت
                        </span>
                                                    ) : null}
                                                </div>

                                                <p className="mt-2 text-[11px] text-muted">{group.publishDateTime}</p>
                                            </article>
                                        );
                                    })}

                                    <div ref={noticeLoadMoreRef} className="h-6 w-full"/>

                                    {codalNoticesLoadingMore && shouldLoadMoreNotices ? (
                                        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                            در حال بارگذاری پیام‌های بیشتر...
                                        </div>
                                    ) : null}

                                    {!codalNoticesLoading && !shouldLoadMoreNotices && groupedNotices.length > 0 ? (
                                        <div className="py-1 text-center text-[11px] text-muted">همه پیام‌ها نمایش داده
                                            شد.</div>
                                    ) : null}
                                </div>

                                <div className="mt-2 flex h-5 items-center justify-between px-1 text-[11px] text-muted">
                                    <span>تعداد کل: {formatNumberFa(codalNoticesTotalCount)}</span>
                                    <span>نمایش داده شده: {formatNumberFa(groupedNotices.length)}</span>
                                </div>
                            </section>
                        </section>
                    </>
                )}
            </main>

            <AccountStatusBar
                summary={accountSummary}
                loading={tradingAccountLoading}
                onRefresh={refreshAccountStatus}
                onDepositClick={openWalletPanel}
            />

            {orderModalSide ? (
                <OrderPlacementModal
                    open
                    initialSide={orderModalSide}
                    symbol={orderSymbolContext}
                    orderBookRows={orderBookRows}
                    context={orderValidationContext}
                    accessToken={accessToken}
                    formatNumber={(value, digits) =>
                        value === null || value === undefined || Number.isNaN(value)
                            ? '—'
                            : formatNumberFa(value, digits)
                    }
                    onClose={() => setOrderModalSide(null)}
                    onOrderPlaced={handleOrderPlaced}
                />
            ) : null}

            {watchlistToast ? (
                <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-3">
                    <div
                        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-card animate-toast-in ${
                            watchlistToast.tone === 'error'
                                ? 'border-negative/35 bg-negative/10 text-negative'
                                : 'border-positive/35 bg-surface text-text shadow-[0_10px_30px_-12px_hsl(var(--positive)/0.45)]'
                        }`}
                        role="status"
                        aria-live="polite"
                    >
                        <span
                            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                watchlistToast.tone === 'error'
                                    ? 'bg-negative/15 text-negative'
                                    : 'bg-positive/15 text-positive'
                            }`}
                        >
                            {watchlistToast.tone === 'error' ? (
                                <AlertCircle className="h-4 w-4" aria-hidden="true"/>
                            ) : (
                                <Check className="h-4 w-4" aria-hidden="true"/>
                            )}
                        </span>
                        <div className="min-w-0 flex-1">
                            {watchlistToast.title ? (
                                <p className="font-semibold text-text">{watchlistToast.title}</p>
                            ) : null}
                            <p className={watchlistToast.title ? 'mt-0.5 text-xs text-muted' : 'text-text'}>
                                {watchlistToast.message}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setWatchlistToast(null)}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface-2 text-muted transition hover:text-text"
                            aria-label="بستن اعلان"
                        >
                            <X className="h-3.5 w-3.5"/>
                        </button>
                    </div>
                </div>
            ) : null}

            {watchlistModal ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={closeWatchlistModal}
                        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                        aria-label="close watchlist modal"
                    />
                    <form
                        dir="rtl"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submitWatchlistModal();
                        }}
                        className="relative w-full max-w-[360px] rounded-2xl border border-border/70 bg-surface shadow-card"
                    >
                        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                            <h3 className="text-base font-bold text-text">
                                {watchlistModal.mode === 'create'
                                    ? 'ساخت دیدبان جدید'
                                    : `ویرایش دیدبان ${watchlistModal.originalName}`}
                            </h3>
                            <button
                                type="button"
                                onClick={closeWatchlistModal}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close watchlist form"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                            <label htmlFor="watchlist-name" className="block text-sm font-medium text-text">
                                نام دیدبان
                            </label>
                            <input
                                id="watchlist-name"
                                value={watchlistNameDraft}
                                autoFocus
                                onChange={(event) => {
                                    setWatchlistNameDraft(event.target.value);
                                    setWatchlistNameError(null);
                                }}
                                type="text"
                                placeholder="مثال: خریدهای آینده"
                                className={`h-10 w-full rounded-xl border bg-surface-2 px-3 text-sm text-text outline-none transition placeholder:text-muted focus:ring-2 ${
                                    watchlistNameError
                                        ? 'border-negative/45 focus:border-negative/50 focus:ring-negative/25'
                                        : 'border-border/80 focus:border-primary/45 focus:ring-primary/30'
                                }`}
                            />

                            {watchlistNameError ? (
                                <div className="flex items-center gap-1.5 text-xs text-negative">
                                    <AlertCircle className="h-3.5 w-3.5"/>
                                    {watchlistNameError}
                                </div>
                            ) : null}
                        </div>

                        <div className="px-4 pb-4">
                            <button
                                type="submit"
                                disabled={watchlistSubmitting}
                                className="flex h-10 w-full items-center justify-center rounded-lg bg-positive text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {watchlistSubmitting ? (
                                    <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    در حال ذخیره...
                  </span>
                                ) : watchlistModal.mode === 'create' ? (
                                    'ساخت دیدبان'
                                ) : (
                                    'ذخیره تغییرات'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {drawerOpen ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        className="absolute inset-0 bg-black/40"
                        aria-label="close drawer"
                    />

                    <div
                        className="thin-scrollbar absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto border-l border-border/70 bg-surface p-3 shadow-card">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-text">دیدبان</h3>

                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <WatchlistPanel
                            activeTab={sidebarTab}
                            onTabChange={setSidebarTab}
                            watchlists={watchlists}
                            selectedWatchlistId={selectedWatchlistId}
                            onSelectWatchlist={setSelectedWatchlistId}
                            loading={watchlistsLoading}
                            error={watchlistsError}
                            onRetry={() => void loadWatchlists()}
                            onRequestCreateWatchlist={openCreateWatchlistModal}
                            onRequestEditWatchlist={openEditWatchlistModal}
                            onRequestDeleteWatchlist={(watchlistId) => void handleDeleteWatchlist(watchlistId)}
                            onSelectSymbol={setSelectedSymbol}
                            onRemoveSymbol={(symbolId) => void handleRemoveSymbolFromWatchlist(symbolId)}
                            watchlistBusy={watchlistBusy}
                            currentSymbolKey={selectedSymbol.key}
                            currentSymbolPrice={selectedSymbolLivePrice}
                            userProfile={userProfile}
                            accountSummary={accountSummary}
                            accessToken={accessToken}
                            onProfileUpdated={onProfileUpdated}
                        />
                    </div>
                </div>
            ) : null}

            {noticeFilterOpen ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        onClick={() => setNoticeFilterOpen(false)}
                        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                        aria-label="close notice filter"
                    />

                    <div
                        dir="rtl"
                        className="relative w-full max-w-[560px] rounded-2xl border border-border/70 bg-surface shadow-card"
                    >
                        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                            <h3 className="text-base font-bold text-text">فیلتر پیام ناظر</h3>
                            <button
                                type="button"
                                onClick={() => setNoticeFilterOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close filter modal"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                            <div>
                                <label htmlFor="notice-symbol-filter"
                                       className="mb-1.5 block text-sm font-medium text-text">
                                    نماد یا نام شرکت
                                </label>
                                <div className="relative">
                                    <input
                                        id="notice-symbol-filter"
                                        value={noticeFilterDraft.symbol}
                                        onFocus={() => setNoticeSymbolDropdownOpen(true)}
                                        onChange={(event) => {
                                            setNoticeFilterDraft((prev) => ({
                                                ...prev,
                                                symbol: event.target.value,
                                            }));
                                            setNoticeSymbolDropdownOpen(true);
                                        }}
                                        type="text"
                                        placeholder="مثال: غدانه"
                                        className="h-10 w-full rounded-xl border border-border/80 bg-surface-2 px-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    />

                                    {noticeFilterDraft.symbol.trim() !== '' && noticeSymbolDropdownOpen ? (
                                        <div
                                            className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-y-auto rounded-xl border border-border/80 bg-surface shadow-card">
                                            {noticeSymbolLoading ? (
                                                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                                    در حال جستجو...
                                                </div>
                                            ) : null}

                                            {!noticeSymbolLoading && noticeSymbolError ? (
                                                <div className="px-3 py-2 text-xs text-negative">
                                                    <p>جستجوی نماد با خطا مواجه شد.</p>
                                                    <button
                                                        type="button"
                                                        onClick={retryNoticeSymbolSearch}
                                                        className="mt-1 rounded-full border border-negative/40 bg-negative/10 px-2.5 py-1 text-[11px] text-negative transition hover:bg-negative/15"
                                                    >
                                                        تلاش مجدد
                                                    </button>
                                                </div>
                                            ) : null}

                                            {!noticeSymbolLoading && !noticeSymbolError && noticeSymbolResults.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-muted">نتیجه‌ای پیدا نشد.</div>
                                            ) : null}

                                            {!noticeSymbolLoading && !noticeSymbolError && noticeSymbolResults.length > 0
                                                ? noticeSymbolResults.slice(0, 10).map((item) => (
                                                    <button
                                                        key={`notice-symbol-${item.key}`}
                                                        type="button"
                                                        onMouseDown={(event) => {
                                                            event.preventDefault();
                                                            applyNoticeSymbolSuggestion(item.symbol);
                                                        }}
                                                        className="flex w-full items-start justify-between border-b border-border/50 px-3 py-2 text-right text-xs transition last:border-b-0 hover:bg-surface-2"
                                                    >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-text">{item.symbol}</span>
                                <span className="mt-0.5 block truncate text-muted">{item.name}</span>
                              </span>
                                                        <span
                                                            className="mr-2 shrink-0 text-[11px] text-muted">{toMarketLabel(item.type)}</span>
                                                    </button>
                                                ))
                                                : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <label
                                className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 px-3 py-2 text-sm text-text">
                                فقط پیام‌های تحت نظارت
                                <input
                                    type="checkbox"
                                    checked={noticeFilterDraft.underSupervisionOnly}
                                    onChange={(event) =>
                                        setNoticeFilterDraft((prev) => ({
                                            ...prev,
                                            underSupervisionOnly: event.target.checked,
                                        }))
                                    }
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/45"
                                />
                            </label>

                            <div className="rounded-xl border border-border/70 bg-surface-2 p-3">
                                <div className="mb-2 flex items-center justify-between text-sm font-medium text-text">
                                    <span>از تاریخ</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNoticeFilterDraft((prev) => ({
                                                ...prev,
                                                fromDate: null,
                                            }))
                                        }
                                        className="rounded-full border border-border/80 bg-surface px-2 py-0.5 text-[11px] text-muted transition hover:text-text"
                                    >
                                        بدون محدودیت
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={noticeFilterDraft.fromDate?.day ?? ''}
                                        onChange={(event) => updateDraftDatePart('fromDate', 'day', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">روز</option>
                                        {dayOptions.map((day) => (
                                            <option key={`from-day-${day}`} value={day}>
                                                {formatFaInteger(day)}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={noticeFilterDraft.fromDate?.month ?? ''}
                                        onChange={(event) => updateDraftDatePart('fromDate', 'month', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">ماه</option>
                                        {JALALI_MONTHS.map((month) => (
                                            <option key={`from-month-${month.value}`} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={noticeFilterDraft.fromDate?.year ?? ''}
                                        onChange={(event) => updateDraftDatePart('fromDate', 'year', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">سال</option>
                                        {noticeYearOptions.map((year) => (
                                            <option key={`from-year-${year}`} value={year}>
                                                {formatFaPlainInteger(year)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/70 bg-surface-2 p-3">
                                <div className="mb-2 flex items-center justify-between text-sm font-medium text-text">
                                    <span>تا تاریخ</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNoticeFilterDraft((prev) => ({
                                                ...prev,
                                                toDate: null,
                                            }))
                                        }
                                        className="rounded-full border border-border/80 bg-surface px-2 py-0.5 text-[11px] text-muted transition hover:text-text"
                                    >
                                        بدون محدودیت
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={noticeFilterDraft.toDate?.day ?? ''}
                                        onChange={(event) => updateDraftDatePart('toDate', 'day', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">روز</option>
                                        {dayOptions.map((day) => (
                                            <option key={`to-day-${day}`} value={day}>
                                                {formatFaInteger(day)}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={noticeFilterDraft.toDate?.month ?? ''}
                                        onChange={(event) => updateDraftDatePart('toDate', 'month', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">ماه</option>
                                        {JALALI_MONTHS.map((month) => (
                                            <option key={`to-month-${month.value}`} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={noticeFilterDraft.toDate?.year ?? ''}
                                        onChange={(event) => updateDraftDatePart('toDate', 'year', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">سال</option>
                                        {noticeYearOptions.map((year) => (
                                            <option key={`to-year-${year}`} value={year}>
                                                {formatFaPlainInteger(year)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-3">
                            <button
                                type="button"
                                onClick={clearNoticeFilters}
                                className="rounded-xl border border-border/80 bg-surface-2 px-3 py-2 text-xs font-medium text-muted transition hover:text-text"
                            >
                                حذف فیلترها
                            </button>

                            <button
                                type="button"
                                onClick={() => applyNoticeFilters(noticeFilterDraft)}
                                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                اعمال فیلترها
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeNoticeGroup ? (
                <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        onClick={() => setActiveNoticeGroup(null)}
                        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                        aria-label="close notice dialog"
                    />

                    <div
                        dir="rtl"
                        className="relative w-full max-w-[620px] rounded-2xl border border-border/70 bg-surface shadow-card"
                    >
                        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                            <h3 className="text-xl font-semibold text-text">
                                {activeNoticeGroup.hasUnderSupervision ? 'پیام ناظر' : 'اطلاعیه'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveNoticeGroup(null)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close notice details"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="thin-scrollbar max-h-[70vh] overflow-y-auto px-4 py-4">
                            <h4 className="text-2xl leading-10 font-extrabold text-text">{activeNoticeGroup.title}</h4>
                            <p className="mt-1 text-[13px] text-muted">{activeNoticeGroup.publishDateTime}</p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {activeNoticeGroup.symbols.map((symbol) => (
                                    <span
                                        key={`modal-symbol-${symbol}`}
                                        className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-1 text-[12px] text-muted"
                                    >
                    {symbol}
                  </span>
                                ))}

                                {activeNoticeGroup.hasUnderSupervision ? (
                                    <span
                                        className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[12px] text-warning">
                    تحت نظارت
                  </span>
                                ) : null}
                            </div>

                            {activeNoticeDetails ? (
                                <div
                                    className="mt-4 rounded-xl border border-border/70 bg-surface-2 p-3 text-sm text-text">
                                    <p className="mb-1">
                                        <span
                                            className="font-semibold">نماد:</span> {activeNoticeDetails.primary.symbol}
                                    </p>
                                    <p>
                                        <span
                                            className="font-semibold">شرکت:</span> {activeNoticeDetails.primary.companyName}
                                    </p>
                                </div>
                            ) : null}

                            {activeNoticeDetails?.additionalInfo ? (
                                <div
                                    className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-3 text-sm leading-8 whitespace-pre-line text-text">
                                    {activeNoticeDetails.additionalInfo}
                                </div>
                            ) : null}

                            {activeNoticeDetails && activeNoticeDetails.reasons.length > 0 ? (
                                <div className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-3">
                                    <h5 className="mb-2 text-sm font-semibold text-text">دلایل اعلام نظارت</h5>
                                    <ul className="space-y-1 text-sm leading-7 text-text">
                                        {activeNoticeDetails.reasons.map((reason) => (
                                            <li key={reason} className="rounded-lg bg-surface px-2 py-1">
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {activeNoticeDetails ? (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {activeNoticeDetails.primary.reportUrl ? (
                                        <a
                                            href={activeNoticeDetails.primary.reportUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                                        >
                                            مشاهده اطلاعیه
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}

                                    {activeNoticeDetails.primary.pdfUrl ? (
                                        <a
                                            href={activeNoticeDetails.primary.pdfUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
                                        >
                                            PDF
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}

                                    {activeNoticeDetails.primary.excelUrl ? (
                                        <a
                                            href={activeNoticeDetails.primary.excelUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
                                        >
                                            Excel
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}

                                    {activeNoticeDetails.primary.attachmentUrl ? (
                                        <a
                                            href={activeNoticeDetails.primary.attachmentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
                                        >
                                            پیوست
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
