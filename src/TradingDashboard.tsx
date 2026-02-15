import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  ChevronDown,
  Clock3,
  Filter,
  LineChart,
  Menu,
  Moon,
  Search,
  Star,
  Sun,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import type { Theme } from './hooks/useTheme';

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
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toRoundedPrice = (value: number) => Math.round(value / 10) * 10;

export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

export const formatNumberFa = (value: number, digits = 0) =>
  new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatPercentFa = (value: number, digits = 2) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumberFa(value, digits)}٪`;
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

export default function TradingDashboard({ theme, onToggleTheme }: TradingDashboardProps) {
  const clock = useClock();

  const marketIndex = useLiveValue(3_891_243, {
    min: 3_780_000,
    max: 3_980_000,
    step: 2_900,
    intervalMs: 1100,
  });

  const marketDelta = useLiveValue(-94_861, {
    min: -130_000,
    max: 130_000,
    step: 2_500,
    intervalMs: 1100,
  });

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
  const [searchValue, setSearchValue] = useState('فولاد - فولاد مبارکه اصفهان - بورس');

  const marketPercent = useMemo(
    () => (marketIndex !== 0 ? (marketDelta / marketIndex) * 100 : 0),
    [marketDelta, marketIndex]
  );

  const marketPositive = marketDelta >= 0;
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
        value: clock.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      },
      { label: 'NAV ابطال', value: formatNumberFa(navAbtal) },
      { label: 'زمان اعلام NAV', value: '۱۰:۴۵' },
      { label: 'EPS', value: formatNumberFa(1150) },
      { label: 'P/E', value: formatNumberFa(7.12, 2) },
    ],
    [baseVolume, clock, navAbtal, tradeValue, tradeVolume]
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

  const messages = useMemo(
    () => [
      { title: 'اطلاعیه ناظر درباره توقف نماد خپارس', time: '۱۰:۴۹', tag: 'ناظر' },
      { title: 'تغییر دامنه نوسان در گروه خودرو', time: '۱۰:۳۲', tag: 'بازار' },
      { title: 'پیام نظارتی جدید برای نماد فولاد', time: '۱۰:۱۸', tag: 'کدال' },
      { title: 'زمان پیش‌گشایش برای بازار پایه اعلام شد', time: '۰۹:۵۹', tag: '' },
      { title: 'بازگشایی نماد شستا پس از توقف کوتاه', time: '۰۹:۴۱', tag: 'خبر' },
      { title: 'هشدار: سفارش شما به‌روزرسانی شد', time: '۰۹:۲۸', tag: 'سفارش' },
    ],
    []
  );

  const orderFilters: Array<{ key: OrderFilter; label: string }> = [
    { key: 'open', label: 'باز ۰' },
    { key: 'done', label: 'انجام شده ۰' },
    { key: 'failed', label: 'ناموفق ۰' },
    { key: 'all', label: 'همه ۰' },
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

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-300">
      <div className="sticky top-0 z-50 border-b border-border/70 bg-surface/85 shadow-card backdrop-blur-xl dark:shadow-none">
        <header className="border-b border-border/60 px-3 py-2 sm:px-4">
          <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 [direction:ltr]">
            <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs text-muted">
                <Clock3 className="h-3.5 w-3.5" />
                <span className="tabular-nums">
                  {clock.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-text">
                <UserRound className="h-4 w-4 text-muted" />
                عرفان داوودی
              </div>
            </div>

            <div dir="rtl" className="lg:col-span-6">
              <div
                className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 ${
                  marketPositive
                    ? 'border-positive/35 bg-positive/10'
                    : 'border-negative/35 bg-negative/10'
                }`}
              >
                <span className="text-xs text-muted">شاخص کل بورس</span>
                <div className="flex items-end gap-3">
                  <span className="text-xl font-bold tabular-nums text-text">{formatNumberFa(marketIndex)}</span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      marketPositive ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {formatNumberFa(marketDelta)} ({formatPercentFa(marketPercent)})
                  </span>
                </div>
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
                  aria-label="Toggle theme"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-surface-2 text-muted transition hover:text-text focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span>{row.label}</span>
                    <span>
                      فروش {formatPercentFa(row.sellPercent, 0)} | خرید {formatPercentFa(row.buyPercent, 0)}
                    </span>
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
              <h3 className="text-sm font-semibold text-text">پیام‌های ناظر</h3>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text focus-visible:ring-2 focus-visible:ring-primary/45"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            <div className="thin-scrollbar max-h-[324px] space-y-2 overflow-y-auto pl-1">
              {messages.map((msg) => (
                <article
                  key={`${msg.title}-${msg.time}`}
                  className="rounded-xl border border-border/70 bg-surface px-3 py-2.5 transition hover:border-primary/30 hover:bg-surface-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-medium text-text">{msg.title}</h4>
                    <span className="text-[11px] tabular-nums text-muted">{msg.time}</span>
                  </div>

                  {msg.tag ? (
                    <span className="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted border border-border/70">
                      {msg.tag}
                    </span>
                  ) : null}
                </article>
              ))}
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
    </div>
  );
}
