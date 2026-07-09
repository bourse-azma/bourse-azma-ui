import {Activity, BarChart3, BellRing, CircleDollarSign, Flame, Sparkles, TrendingDown, TrendingUp} from 'lucide-react';
import {useMemo, useState} from 'react';
import {formatCompactAmountFa, formatNumberFa, formatPercentFa, ltrNumericClassName,} from '../../utils/numberFormat';
import type {MarketId, MarketSymbolQuote, SelectedIndex} from './types';
import type {LandingMarketData} from './useLandingMarketData';

type Props = { data: LandingMarketData; isAuthenticated: boolean; onLogin: () => void; onRegister: () => void };
type MoversTab = 'gainers' | 'losers';
type MarketTab = MarketId;
const MARKET_LABELS: Record<MarketTab, string> = {1: 'بورس', 2: 'فرابورس'};

const changeTone = (value: number) => value > 0
    ? 'text-[#21E6B7]'
    : value < 0 ? 'text-[#FF667A]' : 'text-[#94A3B8]';

const heroChangeClass = (value: number) => value > 0
    ? 'market-board-hero-change market-board-hero-change-positive'
    : value < 0
        ? 'market-board-hero-change market-board-hero-change-negative'
        : 'market-board-hero-change market-board-hero-change-neutral';

const marketStatusClass = (state?: string | null) => state === 'باز'
    ? 'market-status-open'
    : 'market-status-closed';

function IndexCard({index}: { index: SelectedIndex }) {
    return (
        <article className="market-index-row">
            <p className="market-index-name">{index.indexName}</p>
            <div className="market-index-cell">
                <span className="market-index-cell-label">مقدار</span>
                <span className={`market-index-cell-value text-white ${ltrNumericClassName}`}>
                    {formatNumberFa(index.currentValue, 0)}
                </span>
            </div>
            <div className="market-index-cell">
                <span className="market-index-cell-label">درصد</span>
                <span className={`market-index-cell-value ${changeTone(index.changePercent)} ${ltrNumericClassName}`}>
                    {formatPercentFa(index.changePercent, 2)}
                </span>
            </div>
            <div className="market-index-cell">
                <span className="market-index-cell-label">تغییر</span>
                <span className={`market-index-cell-value ${changeTone(index.changeValue)} ${ltrNumericClassName}`}>
                    {formatNumberFa(index.changeValue, 0)}
                </span>
            </div>
            <div className="market-index-cell">
                <span className="market-index-cell-label">بیشترین</span>
                <span className={`market-index-cell-value text-white/75 ${ltrNumericClassName}`}>
                    {formatNumberFa(index.dayHighValue, 0)}
                </span>
            </div>
        </article>
    );
}

function SymbolRow({symbol}: { symbol: MarketSymbolQuote }) {
    const tone = changeTone(symbol.changePercent);
    return (
        <article className="market-symbol-row">
            <div className="market-symbol-row-main">
                <span className={`market-symbol-row-icon ${tone}`}>
                    {symbol.changePercent > 0 ? <TrendingUp className="h-4 w-4"/> : symbol.changePercent < 0 ?
                        <TrendingDown className="h-4 w-4"/> : <span className="h-0.5 w-4 bg-current"/>}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{symbol.symbol}</p>
                    <p className="truncate text-[11px] font-semibold text-white/45">{symbol.fullName}</p>
                </div>
            </div>
            <div className="market-symbol-row-values" dir="ltr">
                <span className={`market-symbol-row-change ${tone} ${ltrNumericClassName}`}>
                    {formatPercentFa(symbol.changePercent, 2)}
                </span>
                <span className={`market-symbol-row-price ${ltrNumericClassName}`}>
                    {formatNumberFa(symbol.price, 0)}
                </span>
            </div>
        </article>
    );
}

function PopularColumn({title, items}: { title: string; items: MarketSymbolQuote[] }) {
    return <div className="market-side-card min-w-0">
        <h4 className="mb-4 text-sm font-black text-white">{title}</h4>
        <div className="space-y-2">{items.map((symbol) => <SymbolRow key={symbol.instrumentCode}
                                                                     symbol={symbol}/>)}</div>
    </div>;
}

export default function MarketOverviewSection({data, isAuthenticated, onLogin, onRegister}: Props) {
    const [marketTab, setMarketTab] = useState<MarketTab>(1);
    const [moversTab, setMoversTab] = useState<MoversTab>('gainers');
    const indexes = marketTab === 1 ? data.bourseIndexes : data.farabourseIndexes;
    const overview = marketTab === 1 ? data.bourseOverview : data.farabourseOverview;
    const movers = moversTab === 'gainers' ? data.gainers : data.losers;
    const marketMovers = useMemo(() => movers.filter((s) => s.marketId === marketTab).slice(0, 9), [movers, marketTab]);
    const indexPercent = overview?.totalIndexValue ? (overview.totalIndexChange / overview.totalIndexValue) * 100 : 0;
    const boursePopular = data.popularSymbols.filter((s) => s.marketId === 1).slice(0, 9);
    const faraboursePopular = data.popularSymbols.filter((s) => s.marketId === 2).slice(0, 9);
    const summaryStats = [
        {
            label: 'معاملات',
            value: overview?.totalTradeCount,
            icon: BarChart3,
            compact: false,
        },
        {
            label: 'ارزش معاملات',
            value: overview?.totalTradeValue,
            icon: CircleDollarSign,
            compact: true,
        },
        {
            label: 'حجم معاملات',
            value: overview?.totalTradeVolume,
            icon: Activity,
            compact: true,
        },
    ] as const;

    return <section id="market"
                    className="market-overview-section landing-section border-y border-white/8 py-16 sm:py-20">
        <div className="landing-container">
            <div className="market-overview-heading max-w-3xl"><span
                className="inline-flex items-center gap-2 rounded-full border border-[#00E5C9]/20 bg-[#00E5C9]/10 px-3 py-1.5 text-sm font-black text-[#00E5C9]"><Sparkles
                className="h-4 w-4 text-[#FFB300]"/>نبض بازار</span><h2
                className="mt-4 text-3xl font-black leading-[1.45] text-white sm:text-4xl">بازار امروز، در یک نگاه</h2>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#AFC1D8]">از شاخص‌های اصلی تا نمادهای
                    پرتحرک و تازه‌ترین پیام‌های ناظر؛ همه‌چیز برای یک تصمیم آگاهانه، یک‌جا و به‌روز.</p></div>

            <div className="market-overview-board mt-7 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B172B]">
                <div className="market-board-header">
                    <p className="text-sm font-black text-white/55">نمای کلی بازار</p>
                    <div className="market-board-tabs">
                        {([1, 2] as MarketTab[]).map((id) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setMarketTab(id)}
                                className={`market-board-tab ${marketTab === id ? 'market-board-tab-active' : 'market-board-tab-inactive'}`}
                            >
                                {MARKET_LABELS[id]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="market-board-summary">
                    <div className="market-board-hero">
                        <div className="market-board-hero-label">
                            <span>شاخص کل {MARKET_LABELS[marketTab]}</span>
                            <span className={marketStatusClass(overview?.marketStateTitle)}>
                                {overview?.marketStateTitle || 'نامشخص'}
                            </span>
                        </div>
                        <div className="market-board-hero-value" dir="ltr">
                            <span className={`market-board-hero-number ${ltrNumericClassName}`}>
                                {overview ? formatNumberFa(overview.totalIndexValue, 0) : '—'}
                            </span>
                            <span className={`${heroChangeClass(indexPercent)} ${ltrNumericClassName}`}>
                                {overview ? formatPercentFa(indexPercent, 2) : '—'}
                            </span>
                        </div>
                    </div>

                    <div className="market-board-stats">
                        {summaryStats.map(({label, value, icon: Icon, compact}) => (
                            <div key={label} className="market-board-stat">
                                <span className="market-board-stat-label">
                                    <span className="market-board-stat-icon">
                                        <Icon className="h-3.5 w-3.5" aria-hidden="true"/>
                                    </span>
                                    {label}
                                </span>
                                <strong
                                    className={`market-board-stat-value ${ltrNumericClassName}`}
                                    title={typeof value === 'number' ? formatNumberFa(value, 0) : undefined}
                                >
                                    {typeof value === 'number'
                                        ? compact
                                            ? formatCompactAmountFa(value)
                                            : formatNumberFa(value, 0)
                                        : '—'}
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="market-board-table-head">
                    <span>شاخص</span>
                    <span>مقدار</span>
                    <span>درصد</span>
                    <span>تغییر</span>
                    <span>بیشترین</span>
                </div>
                <div>
                    {indexes.slice(0, 6).map((index) => <IndexCard key={index.indexCode} index={index}/>)}
                </div>
            </div>

            <div className="market-side-grid mt-6 grid items-start gap-5 lg:grid-cols-2">
                <div className="market-side-card min-w-0">
                    <div className="market-side-card-header">
                        <div className="market-side-card-title">
                            <Flame className="h-4 w-4 shrink-0 text-[#FFB300]"/>
                            <h3 className="text-sm font-black text-white">
                                پرتحرک‌ترین نمادهای {MARKET_LABELS[marketTab]}
                            </h3>
                        </div>
                        <div className="market-side-card-tabs">
                            <button onClick={() => setMoversTab('gainers')}
                                    className={`rounded-md px-3 py-1.5 font-black ${moversTab === 'gainers' ? 'bg-[#21E6B7] text-[#061221]' : 'text-white/60'}`}>صعودی
                            </button>
                            <button onClick={() => setMoversTab('losers')}
                                    className={`rounded-md px-3 py-1.5 font-black ${moversTab === 'losers' ? 'bg-[#FF667A] text-white' : 'text-white/60'}`}>نزولی
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">{marketMovers.map((symbol) => <SymbolRow key={symbol.instrumentCode}
                                                                                        symbol={symbol}/>)}</div>
                </div>
                <div className="market-side-card min-w-0">
                    <div className="market-side-card-header market-side-card-header-simple">
                        <div className="market-side-card-title">
                            <BellRing className="h-4 w-4 shrink-0 text-[#FFB300]"/>
                            <h3 className="text-sm font-black text-white">پیام‌های ناظر</h3>
                        </div>
                    </div>
                    <div className="market-notice-grid">{data.codalNotices.slice(0, 10).map((notice) => <article
                        key={`${notice.noticeId}-${notice.trackingNumber}`} className="market-notice-row"><span
                        className="text-[11px] font-black text-[#21E6B7]">{notice.symbol ?? 'بازار'}</span><p
                        className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-white/70">{notice.title ?? 'بدون عنوان'}</p>
                    </article>)}</div>
                </div>
            </div>

            <div className="mt-6 min-w-0">
                <h3 className="mb-4 text-lg font-black text-white">نمادهای پرطرفدار</h3>
                <div className="market-side-grid grid items-start gap-5 lg:grid-cols-2">
                    <PopularColumn title="بورس" items={boursePopular}/>
                    <PopularColumn title="فرابورس" items={faraboursePopular}/>
                </div>
            </div>

            {!isAuthenticated ? <div
                className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-[#00E5C9]/20 bg-[#00E5C9]/[0.06] p-6 sm:flex-row">
                <div><h3 className="text-lg font-black text-white">ابزارهای حرفه‌ای بازار در انتظار شماست</h3><p
                    className="mt-2 text-sm font-semibold text-[#AFC1D8]">برای تحلیل کامل، دیده‌بان و تمرین معامله‌گری
                    وارد حساب شوید.</p></div>
                <div className="flex shrink-0 gap-2">
                    <button onClick={onLogin}
                            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-black text-white">ورود
                    </button>
                    <button onClick={onRegister}
                            className="rounded-lg bg-[#00E5C9] px-5 py-2.5 text-sm font-black text-[#061221]">ثبت‌نام
                        رایگان
                    </button>
                </div>
            </div> : null}
        </div>
    </section>;
}
