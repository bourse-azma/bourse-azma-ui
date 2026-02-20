import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Building2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Filter,
  LineChart,
  Loader2,
  Menu,
  Search,
  Star,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import type { Theme } from './hooks/useTheme';
import { appConfig } from './config/appConfig';

type LiveValueOptions = {
  min: number;
  max: number;
  step: number;
  intervalMs: number;
};

type OrderBookSide = 'buy' | 'sell';

type OrderBookRow = {
  id: string;
  count: number;
  volume: number;
  price: number;
};

type DepthRow = {
  id: 'real' | 'legal';
  label: string;
  sellPercent: number;
  buyPercent: number;
  sellValue: number;
  buyValue: number;
};

type SidebarTab = 'watchlist' | 'industries';
type SymbolTab = 'chart' | 'details';
type OrderbookTab = 'peers' | 'info' | 'technical';
type OrderFilter = 'open' | 'done' | 'failed' | 'all';

type TradingDashboardProps = {
  theme: Theme;
  onToggleTheme: () => void;
  profileDisplayName: string;
  onOpenProfile: () => void;
  onLogout: () => void;
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

type CodalNoticesApiResponse = {
  code: number;
  message?: string;
  result?: CodalNoticesResult;
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

type JalaliDateParts = {
  year: number;
  month: number;
  day: number;
};

type NoticeUiFilters = {
  symbol: string;
  fromDate: JalaliDateParts | null;
  toDate: JalaliDateParts | null;
  underSupervisionOnly: boolean;
};

type NoticeGroup = {
  id: string;
  title: string;
  publishDateTime: string;
  symbols: string[];
  notices: CodalNotice[];
  hasUnderSupervision: boolean;
};

const JALALI_MONTHS = [
  { value: 1, label: 'فروردین' },
  { value: 2, label: 'اردیبهشت' },
  { value: 3, label: 'خرداد' },
  { value: 4, label: 'تیر' },
  { value: 5, label: 'مرداد' },
  { value: 6, label: 'شهریور' },
  { value: 7, label: 'مهر' },
  { value: 8, label: 'آبان' },
  { value: 9, label: 'آذر' },
  { value: 10, label: 'دی' },
  { value: 11, label: 'بهمن' },
  { value: 12, label: 'اسفند' },
] as const;

const CODAL_MAX_LENGTH = 12;

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toRoundedPrice = (value: number) => Math.round(value / 10) * 10;

export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

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

const formatCompactValue = (value: number, unit: 'T' | 'B') => {
  const divisor = unit === 'T' ? 1_000_000_000_000 : 1_000_000_000;
  return `${formatNumberFa(value / divisor, 2)}${unit}`;
};

const formatFaInteger = (value: number) => new Intl.NumberFormat('fa-IR').format(value);
const formatFaPlainInteger = (value: number) =>
  new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);

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

  return { year, month, day, dateKey, dateTimeKey };
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

const buildCodalNoticeParams = (query: CodalNoticesQuery) => {
  const params = new URLSearchParams();
  const safeLength = clamp(Math.floor(query.length), 1, CODAL_MAX_LENGTH);
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

export function useLiveValue(initial: number, options: LiveValueOptions) {
  const { min, max, step, intervalMs } = options;
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const id = window.setInterval(() => {
      setValue((prev) => clamp(prev + randomFloat(-step, step), min, max));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, max, min, step]);

  return value;
}

const makeDepthRows = (): DepthRow[] => {
  const realBuy = randomInt(35, 78);
  const realSell = randomInt(20, 66);
  const legalBuy = randomInt(28, 72);
  const legalSell = randomInt(22, 62);

  return [
    {
      id: 'real',
      label: 'حقیقی',
      buyPercent: realBuy,
      sellPercent: realSell,
      buyValue: randomInt(120_000, 630_000),
      sellValue: randomInt(120_000, 630_000),
    },
    {
      id: 'legal',
      label: 'حقوقی',
      buyPercent: legalBuy,
      sellPercent: legalSell,
      buyValue: randomInt(120_000, 630_000),
      sellValue: randomInt(120_000, 630_000),
    },
  ];
};

const buildSideRows = (side: OrderBookSide, base: number): OrderBookRow[] =>
  Array.from({ length: 5 }, (_, idx) => {
    const ladder = randomInt(30, 120) * (idx + 1);
    const signed = side === 'sell' ? ladder : -ladder;

    return {
      id: `${side}-${idx + 1}`,
      count: randomInt(3, 94),
      volume: randomInt(8_000, 640_000),
      price: toRoundedPrice(base + signed),
    };
  });

type LiveOrderBookState = {
  asks: OrderBookRow[];
  bids: OrderBookRow[];
  depth: DepthRow[];
};

const createInitialOrderBook = (basePrice: number): LiveOrderBookState => {
  const asks = buildSideRows('sell', basePrice).sort((a, b) => a.price - b.price);
  const bids = buildSideRows('buy', basePrice).sort((a, b) => b.price - a.price);
  return { asks, bids, depth: makeDepthRows() };
};

const mutateRows = (rows: OrderBookRow[], side: OrderBookSide, base: number) => {
  const updated = rows.map((row, idx) => {
    const shouldChange = Math.random() > 0.35 || idx === randomInt(0, 4);
    if (!shouldChange) return row;

    const gap = randomInt(18, 110) * (idx + 1);
    const offset = side === 'sell' ? gap : -gap;

    return {
      ...row,
      count: clamp(row.count + randomInt(-6, 9), 1, 99),
      volume: clamp(row.volume + randomInt(-34_000, 52_000), 2_000, 920_000),
      price: toRoundedPrice(base + offset + randomInt(-18, 18)),
    };
  });

  return side === 'sell'
    ? [...updated].sort((a, b) => a.price - b.price)
    : [...updated].sort((a, b) => b.price - a.price);
};

export function useLiveOrderBook(basePrice: number) {
  const baseRef = useRef(basePrice);
  const [state, setState] = useState<LiveOrderBookState>(() => createInitialOrderBook(basePrice));

  useEffect(() => {
    baseRef.current = basePrice;
  }, [basePrice]);

  useEffect(() => {
    let timer = 0;
    let active = true;

    const tick = () => {
      setState((prev) => ({
        asks: mutateRows(prev.asks, 'sell', baseRef.current),
        bids: mutateRows(prev.bids, 'buy', baseRef.current),
        depth: makeDepthRows(),
      }));

      if (!active) return;
      timer = window.setTimeout(tick, randomInt(800, 1800));
    };

    timer = window.setTimeout(tick, randomInt(800, 1800));

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}

function useMarketOverview(marketId: '1' | '2') {
  const [data, setData] = useState<MarketOverviewResult | null>(null);

  useEffect(() => {
    let timer = 0;
    let active = true;

    const fetchOverview = async () => {
      try {
        const response = await fetch(`${appConfig.marketOverviewApiBaseUrl}/${marketId}`);
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

function useCodalNotices(query: CodalNoticesQuery) {
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

  const querySignature = useMemo(() => {
    const params = buildCodalNoticeParams({ ...query, page: 1 });
    params.delete('page');
    return params.toString();
  }, [query]);

  useEffect(() => {
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
    setPageToLoad(1);
    setReloadKey((prev) => prev + 1);
  }, [querySignature]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const isFirstPage = pageToLoad === 1;
    const requestLength = clamp(Math.floor(query.length), 1, CODAL_MAX_LENGTH);
    requestInFlightRef.current = true;

    setState((prev) => ({
      ...prev,
      loading: isFirstPage && prev.notices.length === 0,
      refreshing: isFirstPage && prev.notices.length > 0,
      loadingMore: !isFirstPage,
      error: null,
    }));

    const requestQuery: CodalNoticesQuery = {
      ...query,
      page: pageToLoad,
      length: requestLength,
    };

    const fetchNotices = async () => {
      try {
        const queryString = buildCodalNoticeParams(requestQuery).toString();
        const response = await fetch(`${appConfig.codalNoticesApiBaseUrl}?${queryString}`, {
          headers: { accept: '*/*' },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as CodalNoticesApiResponse;
        if (!active) return;

        if (payload.code !== 200 || !payload.result) {
          throw new Error(payload.message ?? 'Invalid response payload');
        }

        const incoming = payload.result.notices ?? [];

        setState((prev) => {
          const notices = isFirstPage ? incoming : mergeUniqueNotices(prev.notices, incoming);
          const totalCount = payload.result?.totalCount ?? prev.totalCount;
          const hasMore = totalCount > 0 ? notices.length < totalCount : incoming.length >= requestLength;

          return {
            notices,
            totalCount,
            page: pageToLoad,
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
          error: 'دریافت پیام‌های ناظر با خطا مواجه شد.',
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
  }, [pageToLoad, query, reloadKey]);

  const loadMore = () => {
    if (requestInFlightRef.current) return;
    if (state.loading || state.loadingMore || state.refreshing || !state.hasMore) return;
    setState((prev) => ({ ...prev, loadingMore: true }));
    requestInFlightRef.current = true;
    setPageToLoad((currentPage) => currentPage + 1);
  };

  const refresh = () => {
    setPageToLoad(1);
    setReloadKey((prev) => prev + 1);
  };

  return { ...state, loadMore, refresh };
}

const cardClass = 'rounded-2xl border border-border/70 bg-surface shadow-card dark:shadow-none';
const actionBtnClass =
  'inline-flex h-10 items-center justify-center rounded-xl border border-border/80 bg-surface-2 px-3 text-muted transition hover:border-primary/35 hover:text-text focus-visible:ring-2 focus-visible:ring-primary/45';

function WatchlistPanel({
  activeTab,
  onTabChange,
}: {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}) {
  const emptyTitle = activeTab === 'watchlist' ? 'دیده‌بان ندارید!' : 'صنعتی انتخاب نشده است!';
  const emptyHelp =
    activeTab === 'watchlist'
      ? 'جهت ساخت دیده‌بان، دکمه زیر را انتخاب کنید.'
      : 'برای شروع، یک صنعت از لیست بالا انتخاب کنید.';

  return (
    <aside className={`${cardClass} p-3`}>
      <div className="mb-3 border-b border-border/70 pb-2">
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => onTabChange('watchlist')}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-1 py-1 transition ${
              activeTab === 'watchlist' ? 'text-text' : 'text-muted hover:text-text'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            دیدبان
            {activeTab === 'watchlist' ? (
              <span className="absolute inset-x-0 -bottom-[8px] h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('industries')}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-1 py-1 transition ${
              activeTab === 'industries' ? 'text-text' : 'text-muted hover:text-text'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            صنایع
            {activeTab === 'industries' ? (
              <span className="absolute inset-x-0 -bottom-[8px] h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="mb-4 flex h-10 w-full items-center justify-between rounded-xl border border-border/80 bg-surface-2 px-3 text-xs text-muted transition hover:text-text"
      >
        انتخاب کنید
        <ChevronDown className="h-4 w-4" />
      </button>

      <div className="flex min-h-[292px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-2 px-5 text-center">
        <div className="mb-4 grid grid-cols-2 gap-2 opacity-70">
          <div className="h-11 w-11 rounded-lg bg-border/60" />
          <div className="h-11 w-11 rounded-lg bg-border/75" />
          <div className="h-11 w-11 rounded-lg bg-border/75" />
          <div className="h-11 w-11 rounded-lg bg-border/60" />
        </div>

        <h3 className="text-sm font-semibold text-text">{emptyTitle}</h3>
        <p className="mt-1 text-xs text-muted">{emptyHelp}</p>

        <button
          type="button"
          className="mt-4 rounded-full border border-positive/30 bg-positive/10 px-4 py-1.5 text-xs font-semibold text-positive transition hover:bg-positive/15 focus-visible:ring-2 focus-visible:ring-positive/45"
        >
          ساخت دیدبان
        </button>
      </div>
    </aside>
  );
}

export default function TradingDashboard({
  theme,
  onToggleTheme,
  profileDisplayName,
  onOpenProfile,
  onLogout,
}: TradingDashboardProps) {
  const clock = useClock();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const bourseOverview = useMarketOverview('1');
  const farabourseOverview = useMarketOverview('2');

  const marketIndex = bourseOverview?.indexValue ?? 0;
  const marketDelta = bourseOverview?.indexChange ?? 0;
  const farabourseIndex = farabourseOverview?.indexValue ?? 0;
  const farabourseDelta = farabourseOverview?.indexChange ?? 0;

  const symbolPrice = useLiveValue(28_160, {
    min: 27_300,
    max: 29_600,
    step: 48,
    intervalMs: 1000,
  });

  const symbolPercent = useLiveValue(-1.84, {
    min: -4.2,
    max: 4.2,
    step: 0.18,
    intervalMs: 1000,
  });

  const tradeVolume = useLiveValue(188_200_000, {
    min: 120_000_000,
    max: 360_000_000,
    step: 2_100_000,
    intervalMs: 1350,
  });

  const baseVolume = useLiveValue(98_500_000, {
    min: 70_000_000,
    max: 180_000_000,
    step: 800_000,
    intervalMs: 1600,
  });

  const tradeValue = useLiveValue(5_320_000_000_000, {
    min: 3_500_000_000_000,
    max: 8_200_000_000_000,
    step: 110_000_000_000,
    intervalMs: 1800,
  });

  const navAbtal = useLiveValue(107_320, {
    min: 104_000,
    max: 113_000,
    step: 120,
    intervalMs: 1700,
  });

  const netAsset = useLiveValue(142_800_000, {
    min: 120_000_000,
    max: 190_000_000,
    step: 850_000,
    intervalMs: 1200,
  });

  const buyingPower = useLiveValue(56_200_000, {
    min: 30_000_000,
    max: 80_000_000,
    step: 480_000,
    intervalMs: 1350,
  });

  const customerBalance = useLiveValue(28_900_000, {
    min: 10_000_000,
    max: 50_000_000,
    step: 260_000,
    intervalMs: 1450,
  });

  const blockedAmount = useLiveValue(8_300_000, {
    min: 1_000_000,
    max: 16_000_000,
    step: 140_000,
    intervalMs: 1300,
  });

  const { asks, bids, depth } = useLiveOrderBook(symbolPrice);

  const [orderbookTab, setOrderbookTab] = useState<OrderbookTab>('info');
  const [symbolTab, setSymbolTab] = useState<SymbolTab>('details');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('watchlist');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [marketPanelOpen, setMarketPanelOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('فولاد - فولاد مبارکه اصفهان - بورس');
  const [codalQuery, setCodalQuery] = useState<CodalNoticesQuery>(() => DEFAULT_CODAL_NOTICE_QUERY);
  const [noticeFilters, setNoticeFilters] = useState<NoticeUiFilters>({
    symbol: '',
    fromDate: null,
    toDate: null,
    underSupervisionOnly: false,
  });
  const [noticeFilterDraft, setNoticeFilterDraft] = useState<NoticeUiFilters>({
    symbol: '',
    fromDate: null,
    toDate: null,
    underSupervisionOnly: false,
  });
  const [noticeFilterOpen, setNoticeFilterOpen] = useState(false);
  const [activeNoticeGroup, setActiveNoticeGroup] = useState<NoticeGroup | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  const noticeListRef = useRef<HTMLDivElement | null>(null);
  const noticeLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const marketPercent = useMemo(
    () => (marketIndex !== 0 ? (marketDelta / marketIndex) * 100 : 0),
    [marketDelta, marketIndex]
  );

  const faraboursePercent = useMemo(
    () => (farabourseIndex !== 0 ? (farabourseDelta / farabourseIndex) * 100 : 0),
    [farabourseDelta, farabourseIndex]
  );

  const marketPositive = marketDelta >= 0;
  const faraboursePositive = farabourseDelta >= 0;
  const symbolPositive = symbolPercent >= 0;

  const dailyMin = 27_650;
  const dailyMax = 33_400;

  const markerPercent = clamp(((symbolPrice - dailyMin) / (dailyMax - dailyMin)) * 100, 3, 96);

  const symbolDetails = useMemo(
    () => [
      { label: 'حجم معاملات', value: formatNumberFa(tradeVolume) },
      { label: 'حجم مبنا', value: formatNumberFa(baseVolume) },
      { label: 'ارزش معاملات', value: `${formatNumberFa(tradeValue / 1_000_000_000_000, 2)} همت` },
      {
        label: 'زمان آخرین معامله',
        value: clock.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      },
      { label: 'NAV ابطال', value: formatNumberFa(navAbtal) },
      { label: 'زمان اعلام NAV', value: '10:45' },
      { label: 'EPS', value: formatNumberFa(1150) },
      { label: 'P/E', value: formatNumberFa(7.12, 2) },
    ],
    [baseVolume, clock, navAbtal, tradeValue, tradeVolume]
  );

  const marketDetails = useMemo(
    () => [
      {
        id: 'bourse',
        label: 'بورس',
        indexValue: marketIndex,
        deltaValue: marketDelta,
        percentValue: marketPercent,
        totalTrades: bourseOverview?.totalTrades ?? 0,
        tradeValue: bourseOverview?.totalTradeValue ?? 0,
        tradeVolume: bourseOverview?.totalTradeVolume ?? 0,
        positive: marketPositive,
      },
      {
        id: 'farabourse',
        label: 'فرابورس',
        indexValue: farabourseIndex,
        deltaValue: farabourseDelta,
        percentValue: faraboursePercent,
        totalTrades: farabourseOverview?.totalTrades ?? 0,
        tradeValue: farabourseOverview?.totalTradeValue ?? 0,
        tradeVolume: farabourseOverview?.totalTradeVolume ?? 0,
        positive: faraboursePositive,
      },
    ],
    [
      bourseOverview?.totalTrades,
      bourseOverview?.totalTradeValue,
      bourseOverview?.totalTradeVolume,
      farabourseDelta,
      farabourseIndex,
      faraboursePercent,
      faraboursePositive,
      farabourseOverview?.totalTrades,
      farabourseOverview?.totalTradeValue,
      farabourseOverview?.totalTradeVolume,
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
      }),
    [clock]
  );

  const footerStats = useMemo(
    () => [
      { label: 'خالص دارایی', value: `${formatNumberFa(netAsset)} ریال` },
      { label: 'قدرت خرید', value: `${formatNumberFa(buyingPower)} ریال` },
      { label: 'مانده مشتری', value: `${formatNumberFa(customerBalance)} ریال` },
      { label: 'بلوک شده', value: `${formatNumberFa(blockedAmount)} ریال` },
      { label: 'اعتبار روزانه', value: `${formatNumberFa(netAsset * 0.18)} ریال` },
    ],
    [blockedAmount, buyingPower, customerBalance, netAsset]
  );

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

  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, index) => index + 1), []);

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
          publishDateTime: notice.publishDateTime || notice.sentDateTime || '-',
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
    [noticeFilters.fromDate, noticeFilters.symbol, noticeFilters.toDate, noticeFilters.underSupervisionOnly]
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
    if (!codalNoticesHasMore) return false;
    if (codalNoticesLoading || codalNoticesLoadingMore || codalNoticesRefreshing) return false;
    if (fromDateKey !== null && earliestLoadedDateKey !== null && earliestLoadedDateKey < fromDateKey) {
      return false;
    }
    return true;
  }, [
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

    return { primary, additionalInfo, reasons };
  }, [activeNoticeGroup]);

  const openNoticeFilter = () => {
    setNoticeFilterDraft(noticeFilters);
    setNoticeFilterOpen(true);
  };

  const updateDraftDatePart = (
    field: 'fromDate' | 'toDate',
    part: keyof JalaliDateParts,
    rawValue: string
  ) => {
    setNoticeFilterDraft((prev) => {
      if (rawValue === '') {
        return { ...prev, [field]: null };
      }

      const parsed = parseNumberish(rawValue);
      if (!Number.isFinite(parsed)) return prev;

      const fallbackYear = noticeYearOptions[0] ?? 1404;
      const currentDate = prev[field] ?? { year: fallbackYear, month: 1, day: 1 };
      return {
        ...prev,
        [field]: {
          ...currentDate,
          [part]: parsed,
        },
      };
    });
  };

  const applyNoticeFilters = () => {
    const normalizedSymbol = noticeFilterDraft.symbol.trim();
    let fromDate = noticeFilterDraft.fromDate;
    let toDate = noticeFilterDraft.toDate;

    if (fromDate && toDate && dateKeyFromParts(fromDate) > dateKeyFromParts(toDate)) {
      [fromDate, toDate] = [toDate, fromDate];
    }

    const nextFilters: NoticeUiFilters = {
      symbol: normalizedSymbol,
      fromDate,
      toDate,
      underSupervisionOnly: noticeFilterDraft.underSupervisionOnly,
    };

    setNoticeFilters(nextFilters);
    setCodalQuery((prev) => ({
      ...prev,
      symbol: normalizedSymbol,
      page: 1,
    }));
    setNoticeFilterOpen(false);
  };

  const clearNoticeFilters = () => {
    const cleared: NoticeUiFilters = {
      symbol: '',
      fromDate: null,
      toDate: null,
      underSupervisionOnly: false,
    };
    setNoticeFilterDraft(cleared);
    setNoticeFilters(cleared);
    setCodalQuery((prev) => ({
      ...prev,
      symbol: '',
      page: 1,
    }));
  };

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
    { key: 'open', label: 'باز 0' },
    { key: 'done', label: 'انجام شده 0' },
    { key: 'failed', label: 'ناموفق 0' },
    { key: 'all', label: 'همه 0' },
  ];

  const orderbookTabs: Array<{ key: OrderbookTab; label: string }> = [
    { key: 'peers', label: 'هم‌گروه' },
    { key: 'info', label: 'اطلاعات نماد' },
    { key: 'technical', label: 'تکنیکال' },
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

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-300">
      <div className="sticky top-0 z-50 border-b border-border/70 bg-surface/85 shadow-card backdrop-blur-xl dark:shadow-none">
        <header className="border-b border-border/60 px-3 py-2 sm:px-4">
          <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 [direction:ltr]">
            <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs text-muted">
                <Clock3 className="h-3.5 w-3.5" />
                <span className="tabular-nums">{clockValue}</span>
              </div>

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary/35"
                >
                  <UserRound className="h-4 w-4 text-muted" />
                  {profileDisplayName}
                </button>

                {profileMenuOpen ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-44 rounded-xl border border-border/80 bg-surface p-1.5 shadow-card">
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

            <div dir="rtl" className="lg:col-span-6">
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
                  </div>

                  <div className="flex items-center gap-2 [direction:ltr]">
                    <span className="text-xl leading-none font-extrabold tracking-tight tabular-nums text-text sm:text-2xl">
                      {formatNumberFa(marketIndex)}
                    </span>

                    <span
                      className={`text-xs font-semibold tabular-nums sm:text-sm ${
                        marketPositive ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      {formatNumberFa(marketDelta)}
                    </span>

                    <span
                      className={`text-xs font-semibold tabular-nums sm:text-sm ${
                        marketPositive ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      ({formatPercentFa(marketPercent)})
                    </span>

                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted transition ${marketPanelOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {marketPanelOpen ? (
                  <div className="mt-2 rounded-xl border border-border/70 bg-surface p-1.5 shadow-card lg:absolute lg:left-0 lg:right-0 lg:top-full lg:z-30">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {marketDetails.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border/70 bg-surface-2 p-2.5"
                        >
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-text sm:text-sm">{item.label}</span>
                            <span
                              className={`text-[11px] font-semibold tabular-nums ${
                                item.positive ? 'text-positive' : 'text-negative'
                              }`}
                            >
                              {formatNumberFa(item.deltaValue)} ({formatPercentFa(item.percentValue)})
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] sm:text-[11px]">
                            <span className="text-muted">شاخص کل</span>
                            <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatNumberFa(item.indexValue)}
                            </span>

                            <span className="text-muted">تغییرات</span>
                            <span
                              className={`text-left font-semibold tabular-nums [direction:ltr] ${
                                item.positive ? 'text-positive' : 'text-negative'
                              }`}
                            >
                              {formatNumberFa(item.deltaValue)} ({formatPercentFa(item.percentValue)})
                            </span>

                            <span className="text-muted">تعداد معاملات</span>
                            <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatNumberFa(item.totalTrades)}
                            </span>

                            <span className="text-muted">ارزش معاملات</span>
                            <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatCompactValue(item.tradeValue, 'T')}
                            </span>

                            <span className="text-muted">حجم معاملات</span>
                            <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                              {formatCompactValue(item.tradeVolume, 'B')}
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div dir="rtl" className="flex items-center justify-between gap-2 lg:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-lg border border-border/80 bg-surface" />
                <span className="text-sm font-semibold text-text">اوراق بهادار</span>
              </div>

              <div className="flex items-center gap-2">
                <nav className="inline-flex items-center rounded-full border border-border/80 bg-surface-2 p-1 text-xs">
                  {['بازار', 'درخواست‌ها', 'گزارشات'].map((item, idx) => (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full px-3 py-1 transition ${
                        idx === 0
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
                  onClick={onToggleTheme}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-border/80 bg-surface-2 px-2 text-xs text-muted transition hover:border-primary/35 hover:text-text focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span
                    className={`rounded-md px-2 py-1 transition ${
                      theme === 'light' ? 'bg-surface text-text shadow-sm' : ''
                    }`}
                  >
                    روشن
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 transition ${
                      theme === 'dark' ? 'bg-surface text-text shadow-sm' : ''
                    }`}
                  >
                    تاریک
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="px-3 py-2 sm:px-4">
          <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center [direction:ltr]">
            <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
              <button type="button" className={`${actionBtnClass} w-10`} aria-label="menu">
                <Menu className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-positive px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-positive/50"
              >
                خرید
              </button>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-negative px-4 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-negative/50"
              >
                فروش
              </button>

              <button type="button" className={`${actionBtnClass} w-10`} aria-label="favorite">
                <Star className="h-4 w-4 text-warning" />
              </button>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={`${actionBtnClass} w-10 md:hidden`}
                aria-label="open watchlist"
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>

            <label dir="rtl" className="relative block lg:col-span-7">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                type="text"
                className="h-10 w-full rounded-xl border border-border/80 bg-surface pr-10 pl-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                placeholder="فولاد - فولاد مبارکه اصفهان - بورس"
              />
            </label>

            <div className="hidden lg:flex lg:col-span-2 lg:justify-end">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-3 text-xs text-muted transition hover:text-text"
              >
                <Bell className="h-4 w-4" />
                دیده‌بان
              </button>
            </div>
          </div>
        </section>
      </div>

      <main className="mx-auto w-full max-w-[1800px] space-y-4 px-3 py-4 pb-28 sm:px-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 [direction:ltr]">
          <section dir="rtl" className={`${cardClass} p-3 md:col-span-2 xl:col-span-7`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-text">دفتر سفارشات</h2>
                <p className="text-xs text-muted">فولاد - بازار بورس تهران</p>
              </div>
              <span className="rounded-full border border-border/80 bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
                به‌روزرسانی زنده
              </span>
            </div>

            <div className="mb-3 rounded-2xl border border-border/70 bg-surface-2 p-4">
              <div className="mb-3 text-center text-xs font-medium text-muted">بازه مجاز روزانه</div>
              <div className="grid grid-cols-[74px_1fr] items-center gap-3 text-xs [direction:ltr]">
                <span className="text-left text-sm font-bold tabular-nums text-negative">
                  {formatNumberFa(symbolPrice)}
                </span>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span className="tabular-nums">{formatNumberFa(dailyMin)}</span>
                    <span className="tabular-nums">{formatNumberFa(dailyMax)}</span>
                  </div>

                  <div className="relative h-2 rounded-full bg-border/45">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-negative/20"
                      style={{ width: `${markerPercent}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-surface bg-negative shadow-card"
                      style={{ left: `calc(${markerPercent}% - 8px)` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="thin-scrollbar max-h-[312px] overflow-auto rounded-2xl border border-border/70">
              <table className="w-full min-w-[720px] text-xs">
                <thead className="sticky top-0 z-10 bg-surface-2/95 text-muted backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-right font-medium">تعداد فروش</th>
                    <th className="px-3 py-2 text-right font-medium">حجم فروش</th>
                    <th className="px-3 py-2 text-right font-medium">قیمت فروش</th>
                    <th className="px-3 py-2 text-right font-medium">قیمت خرید</th>
                    <th className="px-3 py-2 text-right font-medium">حجم خرید</th>
                    <th className="px-3 py-2 text-right font-medium">تعداد خرید</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid, idx) => {
                    const ask = asks[idx];
                    const bestBuy = idx === 0;

                    return (
                      <tr
                        key={bid.id}
                        className={`border-t border-border/50 transition hover:bg-surface-2/70 ${
                          bestBuy ? 'bg-positive/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2 tabular-nums text-muted">{formatNumberFa(ask.count)}</td>
                        <td className="px-3 py-2 tabular-nums text-muted">{formatNumberFa(ask.volume)}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-negative">
                          {formatNumberFa(ask.price)}
                        </td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-positive">
                          {formatNumberFa(bid.price)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-muted">{formatNumberFa(bid.volume)}</td>
                        <td className="px-3 py-2 tabular-nums text-muted">{formatNumberFa(bid.count)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 rounded-2xl border border-border/70 bg-surface-2 p-3">
              {depth.map((row) => (
                <div key={row.id} className="mb-2 last:mb-0">
                  <div className="mb-1 grid grid-cols-[80px_1fr_80px] items-center gap-2 text-[11px] [direction:ltr]">
                    <span />
                    <span className="text-center [direction:rtl] text-muted">
                      فروش{' '}
                      <bdi dir="ltr" className="inline-block tabular-nums">
                        {formatPercentFa(row.sellPercent, 0)}
                      </bdi>{' '}
                      | خرید{' '}
                      <bdi dir="ltr" className="inline-block tabular-nums">
                        {formatPercentFa(row.buyPercent, 0)}
                      </bdi>
                    </span>
                    <span className="text-right [direction:rtl] text-muted">{row.label}</span>
                  </div>

                  <div className="grid grid-cols-[80px_1fr_80px] items-center gap-2 text-[11px] [direction:ltr]">
                    <span className="tabular-nums text-negative">{formatNumberFa(row.sellValue)}</span>
                    <div className="relative h-2 rounded-full bg-border/45">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-negative/35"
                        style={{ width: `${row.sellPercent}%` }}
                      />
                      <div
                        className="absolute inset-y-0 right-0 rounded-full bg-positive/35"
                        style={{ width: `${row.buyPercent}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums text-positive">{formatNumberFa(row.buyValue)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border/70 bg-surface-2 p-1">
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

            <p className="mt-2 text-xs text-muted">{orderbookTabCaption[orderbookTab]}</p>
          </section>

          <section dir="rtl" className={`${cardClass} p-3 md:col-span-1 xl:col-span-3`}>
            <div className="rounded-2xl border border-border/70 bg-surface-2 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-positive" />
                  <h2 className="text-base font-semibold text-text">فولاد</h2>
                </div>
                <span className="text-xs text-muted">فولاد مبارکه</span>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-positive/15 px-2.5 py-1 text-[11px] font-medium text-positive">
                  کدال
                </span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted border border-border/60">
                  TSE
                </span>
              </div>

              <div className="text-4xl font-bold tabular-nums tracking-tight text-text">{formatNumberFa(symbolPrice)}</div>
              <div
                className={`mt-1 text-sm font-semibold tabular-nums ${
                  symbolPositive ? 'text-positive' : 'text-negative'
                }`}
              >
                {formatPercentFa(symbolPercent)}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-1">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSymbolTab('chart')}
                  className={`rounded-lg px-2 py-2 transition ${
                    symbolTab === 'chart'
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  نمودار
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

            {symbolTab === 'chart' ? (
              <div className="mt-3 rounded-2xl border border-border/70 bg-surface-2 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                  <LineChart className="h-4 w-4" />
                  نمای نمودار (نمایشی)
                </div>

                <svg viewBox="0 0 420 190" className="h-44 w-full rounded-xl border border-border/60 bg-surface" aria-hidden>
                  <defs>
                    <linearGradient id="chartAreaModern" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <g stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4">
                    <line x1="0" y1="30" x2="420" y2="30" />
                    <line x1="0" y1="75" x2="420" y2="75" />
                    <line x1="0" y1="120" x2="420" y2="120" />
                    <line x1="0" y1="165" x2="420" y2="165" />
                  </g>

                  <path
                    d="M0 150 C32 148, 54 92, 90 102 C127 112, 153 60, 190 68 C230 77, 261 36, 301 58 C331 73, 372 37, 420 46 L420 190 L0 190 Z"
                    fill="url(#chartAreaModern)"
                  />

                  <path
                    d="M0 150 C32 148, 54 92, 90 102 C127 112, 153 60, 190 68 C230 77, 261 36, 301 58 C331 73, 372 37, 420 46"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />

                  <circle cx="420" cy="46" r="4.5" fill="hsl(var(--primary))" />
                </svg>
              </div>
            ) : (
              <div className="thin-scrollbar mt-3 max-h-[336px] space-y-1 overflow-y-auto rounded-2xl border border-border/70 p-2">
                {symbolDetails.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-xs transition hover:bg-surface-2"
                  >
                    <span className="text-muted">{item.label}</span>
                    <span className="font-medium tabular-nums text-text">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="hidden md:block md:col-span-1 xl:col-span-2">
            <WatchlistPanel activeTab={sidebarTab} onTabChange={setSidebarTab} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 [direction:ltr]">
          <section dir="rtl" className={`${cardClass} p-3 xl:col-span-8`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted">سفارشات:</span>

                {orderFilters.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setOrderFilter(chip.key)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      orderFilter === chip.key
                        ? 'border-primary/40 bg-primary/15 text-primary'
                        : 'border-border/80 bg-surface-2 text-muted hover:text-text'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border/80 bg-surface-2 px-4 text-xs font-medium text-text transition hover:border-primary/35"
              >
                <Wallet className="h-3.5 w-3.5" />
                سبد سهام
              </button>
            </div>

            <div className="flex min-h-[255px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface-2 px-4 text-center">
              <div className="mb-3 h-16 w-20 rounded-2xl bg-border/70" />
              <h3 className="text-sm font-semibold text-text">سبد سهام شما خالی است.</h3>
              <p className="mt-1 text-xs text-muted">پس از انجام سفارش، جزئیات در این قسمت قابل مشاهده است.</p>
              <button
                type="button"
                className="mt-4 rounded-full border border-positive/30 bg-positive/10 px-4 py-1.5 text-xs font-semibold text-positive transition hover:bg-positive/15 focus-visible:ring-2 focus-visible:ring-positive/40"
              >
                انتقال دارایی به کارگزاری ...
              </button>
            </div>
          </section>

          <section dir="rtl" className={`${cardClass} p-3 xl:col-span-4`}>
            <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text">پیام‌های ناظر</h3>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-muted">
                  {formatNumberFa(groupedNotices.length)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {codalNoticesRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" /> : null}
                <button
                  type="button"
                  onClick={openNoticeFilter}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-surface-2 text-muted transition hover:text-text focus-visible:ring-2 focus-visible:ring-primary/45 ${
                    hasActiveNoticeFilters ? 'border-primary/45 text-primary' : 'border-border/80'
                  }`}
                  aria-label="open notice filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={noticeListRef} className="thin-scrollbar h-[324px] space-y-2 overflow-y-auto pl-1">
              {(isWaitingForNoticeResults || (groupedNotices.length === 0 && shouldLoadMoreNotices)) &&
              groupedNotices.length === 0 ? (
                Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={`notice-skeleton-${index + 1}`}
                    className="animate-pulse rounded-xl border border-border/70 bg-surface px-3 py-3"
                  >
                    <div className="mb-2 h-4 w-4/5 rounded bg-border/60" />
                    <div className="mb-3 h-4 w-3/5 rounded bg-border/60" />
                    <div className="h-3 w-2/5 rounded bg-border/45" />
                  </div>
                ))
              ) : null}

              {codalNoticesError ? (
                <div className="rounded-xl border border-negative/30 bg-negative/10 p-3 text-xs text-negative">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
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
                <div className="rounded-xl border border-dashed border-border/70 bg-surface-2 px-3 py-6 text-center text-xs text-muted">
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
                        <span className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted">
                          + {formatFaInteger(extraSymbolsCount)}
                        </span>
                      ) : null}

                      {group.hasUnderSupervision ? (
                        <span className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] text-warning">
                          تحت نظارت
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-[11px] text-muted">{group.publishDateTime}</p>
                  </article>
                );
              })}

              <div ref={noticeLoadMoreRef} className="h-6 w-full" />

              {codalNoticesLoadingMore && shouldLoadMoreNotices ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  در حال بارگذاری پیام‌های بیشتر...
                </div>
              ) : null}

              {!codalNoticesLoading && !shouldLoadMoreNotices && groupedNotices.length > 0 ? (
                <div className="py-1 text-center text-[11px] text-muted">همه پیام‌ها نمایش داده شد.</div>
              ) : null}
            </div>

            <div className="mt-2 flex h-5 items-center justify-between px-1 text-[11px] text-muted">
              <span>تعداد کل: {formatNumberFa(codalNoticesTotalCount)}</span>
              <span>نمایش داده شده: {formatNumberFa(groupedNotices.length)}</span>
            </div>
          </section>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/90 backdrop-blur-xl">
        <div className="thin-scrollbar overflow-x-auto">
          <div className="mx-auto flex min-w-max max-w-[1800px] items-center px-3 py-2 sm:px-4">
            {footerStats.map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-2 px-3 text-xs">
                <span className="text-muted">{stat.label}</span>
                <span className="font-semibold tabular-nums text-text">{stat.value}</span>
                {index !== footerStats.length - 1 ? <span className="text-border">|</span> : null}
              </div>
            ))}
          </div>
        </div>
      </footer>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="close drawer"
          />

          <div className="thin-scrollbar absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto border-l border-border/70 bg-surface p-3 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">دیدبان</h3>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                aria-label="close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <WatchlistPanel activeTab={sidebarTab} onTabChange={setSidebarTab} />
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
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div>
                <label htmlFor="notice-symbol-filter" className="mb-1.5 block text-sm font-medium text-text">
                  نماد یا نام شرکت
                </label>
                <input
                  id="notice-symbol-filter"
                  value={noticeFilterDraft.symbol}
                  onChange={(event) =>
                    setNoticeFilterDraft((prev) => ({
                      ...prev,
                      symbol: event.target.value,
                    }))
                  }
                  type="text"
                  placeholder="مثال: غدانه"
                  className="h-10 w-full rounded-xl border border-border/80 bg-surface-2 px-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <label className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 px-3 py-2 text-sm text-text">
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
                onClick={applyNoticeFilters}
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
              <h3 className="text-xl font-semibold text-text">پیام ناظر</h3>
              <button
                type="button"
                onClick={() => setActiveNoticeGroup(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                aria-label="close notice details"
              >
                <X className="h-4 w-4" />
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
                  <span className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[12px] text-warning">
                    تحت نظارت
                  </span>
                ) : null}
              </div>

              {activeNoticeDetails ? (
                <div className="mt-4 rounded-xl border border-border/70 bg-surface-2 p-3 text-sm text-text">
                  <p className="mb-1">
                    <span className="font-semibold">نماد:</span> {activeNoticeDetails.primary.symbol}
                  </p>
                  <p>
                    <span className="font-semibold">شرکت:</span> {activeNoticeDetails.primary.companyName}
                  </p>
                </div>
              ) : null}

              {activeNoticeDetails?.additionalInfo ? (
                <div className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-3 text-sm leading-8 whitespace-pre-line text-text">
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
                      <ExternalLink className="h-3.5 w-3.5" />
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
                      <ExternalLink className="h-3.5 w-3.5" />
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
                      <ExternalLink className="h-3.5 w-3.5" />
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
                      <ExternalLink className="h-3.5 w-3.5" />
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
