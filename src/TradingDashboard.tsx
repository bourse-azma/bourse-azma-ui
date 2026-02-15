import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  ChevronDown,
  Clock3,
  Filter,
  LineChart,
  Menu,
  Search,
  Star,
  UserRound,
  X,
} from 'lucide-react';

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

const cardClass =
  'rounded-2xl border border-zinc-200 bg-white shadow-soft';

const activeTabClass =
  'border-emerald-300 bg-emerald-50 text-emerald-700';

function WatchlistPanel({
  activeTab,
  onTabChange,
}: {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}) {
  const emptyTitle =
    activeTab === 'watchlist' ? 'دیده‌بان ندارید!' : 'صنعتی انتخاب نشده است!';
  const emptyHelp =
    activeTab === 'watchlist'
      ? 'جهت ساخت دیده‌بان، دکمه زیر را انتخاب کنید.'
      : 'برای شروع، یک صنعت از لیست بالا انتخاب کنید.';

  return (
    <div className={`${cardClass} p-3`}>
      <div className="mb-3 border-b border-zinc-100 pb-2">
        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => onTabChange('watchlist')}
            className={`relative inline-flex items-center gap-1.5 pb-1 transition ${
              activeTab === 'watchlist' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            دیدبان
            {activeTab === 'watchlist' ? (
              <span className="absolute inset-x-0 -bottom-[9px] h-0.5 rounded-full bg-emerald-500" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('industries')}
            className={`relative inline-flex items-center gap-1.5 pb-1 transition ${
              activeTab === 'industries' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            صنایع
            {activeTab === 'industries' ? (
              <span className="absolute inset-x-0 -bottom-[9px] h-0.5 rounded-full bg-emerald-500" />
            ) : null}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="mb-4 flex h-9 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-600"
      >
        انتخاب کنید
        <ChevronDown className="h-4 w-4" />
      </button>

      <div className="flex min-h-[292px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 text-center">
        <div className="mb-4 grid grid-cols-2 gap-2 opacity-65">
          <div className="h-10 w-10 rounded-md bg-zinc-200" />
          <div className="h-10 w-10 rounded-md bg-zinc-300" />
          <div className="h-10 w-10 rounded-md bg-zinc-300" />
          <div className="h-10 w-10 rounded-md bg-zinc-200" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-700">{emptyTitle}</h3>
        <p className="mt-1 text-xs text-zinc-500">{emptyHelp}</p>
        <button
          type="button"
          className="mt-4 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          ساخت دیدبان
        </button>
      </div>
    </div>
  );
}

export default function TradingDashboard() {
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
  const markerPercent = clamp(
    ((symbolPrice - dailyMin) / (dailyMax - dailyMin)) * 100,
    3,
    96
  );

  const symbolDetails = [
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
  ];

  const footerStats = [
    { label: 'خالص دارایی', value: `${formatNumberFa(netAsset)} ریال` },
    { label: 'قدرت خرید', value: `${formatNumberFa(buyingPower)} ریال` },
    { label: 'مانده مشتری', value: `${formatNumberFa(customerBalance)} ریال` },
    { label: 'بلوک شده', value: `${formatNumberFa(blockedAmount)} ریال` },
    {
      label: 'اعتبار روزانه',
      value: `${formatNumberFa(netAsset * 0.18)} ریال`,
    },
  ];

  const messages = [
    { title: 'اطلاعیه ناظر درباره توقف نماد خپارس', time: '۱۰:۴۹', tag: 'ناظر' },
    { title: 'تغییر دامنه نوسان در گروه خودرو', time: '۱۰:۳۲', tag: 'بازار' },
    { title: 'پیام نظارتی جدید برای نماد فولاد', time: '۱۰:۱۸', tag: 'کدال' },
    { title: 'زمان پیش‌گشایش برای بازار پایه اعلام شد', time: '۰۹:۵۹', tag: '' },
    { title: 'بازگشایی نماد شستا پس از توقف کوتاه', time: '۰۹:۴۱', tag: 'خبر' },
    { title: 'هشدار: سفارش شما به‌روزرسانی شد', time: '۰۹:۲۸', tag: 'سفارش' },
  ];

  const orderFilters: Array<{ key: OrderFilter; label: string }> = [
    { key: 'open', label: 'باز ۰' },
    { key: 'done', label: 'انجام شده ۰' },
    { key: 'failed', label: 'ناموفق ۰' },
    { key: 'all', label: 'همه ۰' },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <header className="border-b border-zinc-100 px-3 py-2 sm:px-4">
          <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 [direction:ltr]">
            <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600">
                <Clock3 className="h-3.5 w-3.5" />
                <span className="tabular-nums">
                  {clock.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                <UserRound className="h-4 w-4 text-zinc-500" />
                عرفان داوودی
              </div>
            </div>

            <div dir="rtl" className="lg:col-span-6">
              <div
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
                  marketPositive
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-rose-200 bg-rose-50/70'
                }`}
              >
                <span className="text-xs text-zinc-600">شاخص کل بورس</span>
                <div className="flex items-end gap-3">
                  <span className="text-xl font-bold tabular-nums text-zinc-800">
                    {formatNumberFa(marketIndex)}
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      marketPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatNumberFa(marketDelta)} ({formatPercentFa(marketPercent)})
                  </span>
                </div>
              </div>
            </div>

            <div dir="rtl" className="flex items-center justify-between gap-2 lg:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                <div className="h-6 w-6 rounded-lg border border-zinc-200 bg-white" />
                <span className="text-sm font-semibold text-zinc-700">اوراق بهادار</span>
              </div>
              <nav className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-1 text-xs">
                {['بازار', 'درخواست‌ها', 'گزارشات'].map((item, idx) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-full px-3 py-1 transition ${
                      idx === 0
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <section className="px-3 py-2 sm:px-4">
          <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center [direction:ltr]">
            <div dir="rtl" className="flex items-center gap-2 lg:col-span-3 lg:justify-start">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
                aria-label="menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                خرید
              </button>
              <button
                type="button"
                className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
              >
                فروش
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-amber-500 transition hover:bg-amber-50"
                aria-label="favorite"
              >
                <Star className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 md:hidden"
                aria-label="open watchlist"
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>

            <label dir="rtl" className="relative block lg:col-span-7">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                type="text"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white pr-10 pl-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                placeholder="فولاد - فولاد مبارکه اصفهان - بورس"
              />
            </label>

            <div className="hidden lg:block lg:col-span-2" />
          </div>
        </section>
      </div>

      <main className="mx-auto w-full max-w-[1800px] space-y-4 px-3 py-4 pb-28 sm:px-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 [direction:ltr]">
          <div dir="rtl" className={`${cardClass} p-3 md:col-span-2 xl:col-span-7`}>
            <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="mb-2 text-center text-xs font-medium text-zinc-600">بازه مجاز روزانه</div>
              <div className="flex items-center gap-2 text-xs [direction:ltr]">
                <span className="w-16 text-left font-bold tabular-nums text-rose-600">
                  {formatNumberFa(symbolPrice)}
                </span>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-zinc-500">
                    <span className="tabular-nums">{formatNumberFa(dailyMin)}</span>
                    <span className="tabular-nums">{formatNumberFa(dailyMax)}</span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-zinc-200">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-rose-200"
                      style={{ width: `${markerPercent}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow"
                      style={{ left: `calc(${markerPercent}% - 7px)` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="thin-scrollbar overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full min-w-[680px] text-xs">
                <thead className="bg-zinc-50 text-zinc-500">
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
                        className={`border-t border-zinc-100 transition hover:bg-zinc-50 ${
                          bestBuy ? 'bg-emerald-50/70' : ''
                        }`}
                      >
                        <td className="px-3 py-2 tabular-nums text-zinc-600">{formatNumberFa(ask.count)}</td>
                        <td className="px-3 py-2 tabular-nums text-zinc-600">{formatNumberFa(ask.volume)}</td>
                        <td className="px-3 py-2 tabular-nums text-rose-600">{formatNumberFa(ask.price)}</td>
                        <td className="px-3 py-2 tabular-nums text-emerald-600">{formatNumberFa(bid.price)}</td>
                        <td className="px-3 py-2 tabular-nums text-zinc-600">{formatNumberFa(bid.volume)}</td>
                        <td className="px-3 py-2 tabular-nums text-zinc-600">{formatNumberFa(bid.count)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              {depth.map((row) => (
                <div key={row.id} className="mb-2 last:mb-0">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{row.label}</span>
                    <span>
                      فروش {formatPercentFa(row.sellPercent, 0)} | خرید {formatPercentFa(row.buyPercent, 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[84px_1fr_84px] items-center gap-2 text-[11px] [direction:ltr]">
                    <span className="tabular-nums text-rose-600">{formatNumberFa(row.sellValue)}</span>
                    <div className="relative h-2 rounded-full bg-zinc-200">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-rose-300"
                        style={{ width: `${row.sellPercent}%` }}
                      />
                      <div
                        className="absolute inset-y-0 right-0 rounded-full bg-emerald-300"
                        style={{ width: `${row.buyPercent}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums text-emerald-600">{formatNumberFa(row.buyValue)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-zinc-100 pt-2">
              <div className="flex items-center gap-4 text-xs">
                {[
                  { key: 'peers', label: 'هم‌گروه' },
                  { key: 'info', label: 'اطلاعات نماد' },
                  { key: 'technical', label: 'تکنیکال' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setOrderbookTab(tab.key as OrderbookTab)}
                    className={`rounded-lg px-2.5 py-1.5 transition ${
                      orderbookTab === tab.key
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div dir="rtl" className={`${cardClass} p-3 md:col-span-1 xl:col-span-3`}>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-sm font-semibold text-zinc-800">فولاد</h2>
                </div>
                <span className="text-xs text-zinc-500">فولاد مبارکه</span>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  کدال
                </span>
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                  TSE
                </span>
              </div>

              <div className="text-3xl font-bold tabular-nums text-zinc-900">{formatNumberFa(symbolPrice)}</div>
              <div
                className={`mt-1 text-sm font-semibold tabular-nums ${
                  symbolPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatPercentFa(symbolPercent)}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 p-1">
              <div className="grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSymbolTab('chart')}
                  className={`rounded-lg px-2 py-2 transition ${
                    symbolTab === 'chart'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  نمودار
                </button>
                <button
                  type="button"
                  onClick={() => setSymbolTab('details')}
                  className={`rounded-lg px-2 py-2 transition ${
                    symbolTab === 'details'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  جزئیات نماد
                </button>
              </div>
            </div>

            {symbolTab === 'chart' ? (
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                  <LineChart className="h-4 w-4" />
                  نمای نمودار (نمایشی)
                </div>
                <svg viewBox="0 0 420 170" className="h-44 w-full rounded-lg bg-white" aria-hidden>
                  <defs>
                    <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 135 C35 122, 65 80, 95 96 C130 115, 170 60, 212 74 C245 86, 286 35, 328 62 C352 78, 382 48, 420 32 L420 170 L0 170 Z"
                    fill="url(#chartArea)"
                  />
                  <path
                    d="M0 135 C35 122, 65 80, 95 96 C130 115, 170 60, 212 74 C245 86, 286 35, 328 62 C352 78, 382 48, 420 32"
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ) : (
              <div className="thin-scrollbar mt-3 max-h-[334px] space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-2">
                {symbolDetails.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-xs transition hover:bg-zinc-50"
                  >
                    <span className="text-zinc-500">{item.label}</span>
                    <span className="font-medium tabular-nums text-zinc-700">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:block md:col-span-1 xl:col-span-2">
            <WatchlistPanel activeTab={sidebarTab} onTabChange={setSidebarTab} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 [direction:ltr]">
          <div dir="rtl" className={`${cardClass} p-3 xl:col-span-8`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-zinc-600">سفارشات:</span>
                {orderFilters.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setOrderFilter(chip.key)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      orderFilter === chip.key
                        ? activeTabClass
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                سبد سهام
              </button>
            </div>

            <div className="flex min-h-[255px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center">
              <div className="mb-3 h-16 w-20 rounded-xl bg-zinc-200" />
              <h3 className="text-sm font-semibold text-zinc-700">سبد سهام شما خالی است.</h3>
              <p className="mt-1 text-xs text-zinc-500">پس از انجام سفارش، جزئیات در این قسمت قابل مشاهده است.</p>
              <button
                type="button"
                className="mt-4 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                انتقال دارایی به کارگزاری ...
              </button>
            </div>
          </div>

          <div dir="rtl" className={`${cardClass} p-3 xl:col-span-4`}>
            <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-700">پیام‌های ناظر</h3>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            <div className="thin-scrollbar max-h-[324px] space-y-2 overflow-y-auto pl-1">
              {messages.map((msg) => (
                <article
                  key={`${msg.title}-${msg.time}`}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-medium text-zinc-700">{msg.title}</h4>
                    <span className="text-[11px] tabular-nums text-zinc-400">{msg.time}</span>
                  </div>
                  {msg.tag ? (
                    <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
                      {msg.tag}
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur">
        <div className="thin-scrollbar overflow-x-auto">
          <div className="mx-auto flex min-w-max max-w-[1800px] items-center px-3 py-2 sm:px-4">
            {footerStats.map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-2 px-3 text-xs">
                <span className="text-zinc-500">{stat.label}</span>
                <span className="font-semibold tabular-nums text-zinc-700">{stat.value}</span>
                {index !== footerStats.length - 1 ? (
                  <span className="text-zinc-300">|</span>
                ) : null}
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
            className="absolute inset-0 bg-zinc-900/35"
            aria-label="close drawer"
          />
          <div className="thin-scrollbar absolute inset-y-0 right-0 w-[88%] max-w-xs overflow-y-auto border-l border-zinc-200 bg-white p-3 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">دیدبان</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500"
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
