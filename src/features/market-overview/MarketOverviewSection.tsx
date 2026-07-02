import {BellRing, Flame, Sparkles, TrendingDown, TrendingUp} from 'lucide-react';
import {useMemo, useState} from 'react';
import {formatNumberFa, formatPercentFa, ltrNumericClassName} from '../../utils/numberFormat';
import type {MarketId, MarketSymbolQuote, SelectedIndex} from './types';
import type {LandingMarketData} from './useLandingMarketData';

type Props = { data: LandingMarketData; onLogin: () => void; onRegister: () => void };
type MoversTab = 'gainers' | 'losers';
type MarketTab = MarketId;
const MARKET_LABELS: Record<MarketTab, string> = {1: 'بورس', 2: 'فرابورس'};

const changeTone = (value: number) => value > 0
    ? 'text-[#21E6B7]'
    : value < 0 ? 'text-[#FF667A]' : 'text-[#94A3B8]';

function IndexCard({index}: { index: SelectedIndex }) {
    return (
        <article
            className="grid items-center gap-3 border-b border-white/8 px-3 py-4 last:border-b-0 sm:grid-cols-[1.3fr_0.8fr_0.55fr_0.7fr_0.7fr]">
            <p className="min-w-0 text-sm font-black text-white">{index.indexName}</p>
            <p className={`text-sm font-black text-white ${ltrNumericClassName}`}>{formatNumberFa(index.currentValue, 0)}</p>
            <span
                className={`text-xs font-black ${changeTone(index.changePercent)} ${ltrNumericClassName}`}>{formatPercentFa(index.changePercent, 2)}</span>
            <div className="text-xs"><span className="ml-2 text-white/40 sm:hidden">تغییر</span><strong
                className={`${changeTone(index.changeValue)} ${ltrNumericClassName}`}>{formatNumberFa(index.changeValue, 0)}</strong>
            </div>
            <div className="text-xs"><span className="ml-2 text-white/40 sm:hidden">بیشترین</span><strong
                className={`text-white/75 ${ltrNumericClassName}`}>{formatNumberFa(index.dayHighValue, 0)}</strong>
            </div>
        </article>
    );
}

function SymbolRow({symbol}: { symbol: MarketSymbolQuote }) {
    const tone = changeTone(symbol.changePercent);
    return (
        <article className="market-symbol-row">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ${tone}`}>
                    {symbol.changePercent > 0 ? <TrendingUp className="h-4 w-4"/> : symbol.changePercent < 0 ?
                        <TrendingDown className="h-4 w-4"/> : <span className="h-0.5 w-4 bg-current"/>}
                </span>
                <div className="min-w-0"><p className="truncate text-sm font-black text-white">{symbol.symbol}</p><p
                    className="truncate text-[11px] font-semibold text-white/45">{symbol.fullName}</p></div>
            </div>
            <div className="mr-3 flex shrink-0 items-center gap-3" dir="ltr">
                <span
                    className={`min-w-[64px] text-left text-xs font-black ${tone} ${ltrNumericClassName}`}>{formatPercentFa(symbol.changePercent, 2)}</span>
                <span
                    className={`min-w-[82px] text-left text-sm font-black text-white ${ltrNumericClassName}`}>{formatNumberFa(symbol.price, 0)}</span>
            </div>
        </article>
    );
}

function PopularColumn({title, items}: { title: string; items: MarketSymbolQuote[] }) {
    return <div className="market-side-card">
        <h4 className="mb-4 text-sm font-black text-white">{title}</h4>
        <div className="space-y-2">{items.map((symbol) => <SymbolRow key={symbol.instrumentCode}
                                                                     symbol={symbol}/>)}</div>
    </div>;
}

export default function MarketOverviewSection({data, onLogin, onRegister}: Props) {
    const [marketTab, setMarketTab] = useState<MarketTab>(1);
    const [moversTab, setMoversTab] = useState<MoversTab>('gainers');
    const indexes = marketTab === 1 ? data.bourseIndexes : data.farabourseIndexes;
    const overview = marketTab === 1 ? data.bourseOverview : data.farabourseOverview;
    const movers = moversTab === 'gainers' ? data.gainers : data.losers;
    const marketMovers = useMemo(() => movers.filter((s) => s.marketId === marketTab).slice(0, 9), [movers, marketTab]);
    const indexPercent = overview?.totalIndexValue ? (overview.totalIndexChange / overview.totalIndexValue) * 100 : 0;
    const boursePopular = data.popularSymbols.filter((s) => s.marketId === 1).slice(0, 9);
    const faraboursePopular = data.popularSymbols.filter((s) => s.marketId === 2).slice(0, 9);

    return <section id="market"
                    className="market-overview-section landing-section border-y border-white/8 py-16 sm:py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
            <div className="market-overview-heading max-w-3xl"><span
                className="inline-flex items-center gap-2 rounded-full border border-[#00E5C9]/20 bg-[#00E5C9]/10 px-3 py-1.5 text-sm font-black text-[#00E5C9]"><Sparkles
                className="h-4 w-4 text-[#FFB300]"/>نبض بازار</span><h2
                className="mt-4 text-3xl font-black leading-[1.45] text-white sm:text-4xl">بازار امروز، در یک نگاه</h2>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#AFC1D8]">از شاخص‌های اصلی تا نمادهای
                    پرتحرک و تازه‌ترین پیام‌های ناظر؛ همه‌چیز برای یک تصمیم آگاهانه، یک‌جا و به‌روز.</p></div>

            <div className="mt-7 flex gap-2">{([1, 2] as MarketTab[]).map((id) => <button key={id}
                                                                                          onClick={() => setMarketTab(id)}
                                                                                          className={`rounded-lg px-5 py-2.5 text-sm font-black transition ${marketTab === id ? 'bg-[#00E5C9] text-[#061221]' : 'border border-white/12 bg-white/5 text-white/70'}`}>{MARKET_LABELS[id]}</button>)}</div>

            <div className="market-overview-board mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0B172B]">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="min-w-[250px] p-5">
                        <div className="flex items-center gap-2"><p className="text-sm font-black text-white/65">شاخص
                            کل {MARKET_LABELS[marketTab]}</p><span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${overview?.marketStateTitle === 'باز' ? 'bg-[#21E6B7]/12 text-[#21E6B7]' : 'bg-[#FF667A]/12 text-[#FF667A]'}`}>{overview?.marketStateTitle || 'نامشخص'}</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-3" dir="ltr"><p
                            className={`text-3xl font-black text-white ${ltrNumericClassName}`}>{overview ? formatNumberFa(overview.totalIndexValue, 0) : '—'}</p>
                            <p className={`text-sm font-black ${changeTone(indexPercent)} ${ltrNumericClassName}`}>{overview ? formatPercentFa(indexPercent, 2) : '—'}</p>
                        </div>
                    </div>
                    <div
                        className="grid flex-1 border-t border-white/8 sm:grid-cols-3 lg:border-r lg:border-t-0">{[['معاملات', overview?.totalTradeCount], ['ارزش معاملات', overview?.totalTradeValue], ['حجم معاملات', overview?.totalTradeVolume]].map(([label, value]) =>
                        <div key={String(label)}
                             className="border-b border-white/8 p-4 last:border-b-0 sm:border-b-0 sm:border-l sm:last:border-l-0">
                            <span className="text-xs font-semibold text-white/40">{label}</span><strong
                            className={`mt-2 block text-sm text-white ${ltrNumericClassName}`}>{typeof value === 'number' ? formatNumberFa(value, 0) : '—'}</strong>
                        </div>)}</div>
                </div>
                <div
                    className="hidden grid-cols-[1.3fr_0.8fr_0.55fr_0.7fr_0.7fr] border-y border-white/8 bg-white/[0.025] px-3 py-2 text-[11px] font-semibold text-white/35 sm:grid">
                    <span>شاخص</span><span>مقدار</span><span>درصد</span><span>تغییر</span><span>بیشترین</span></div>
                <div>{indexes.slice(0, 6).map((index) => <IndexCard key={index.indexCode} index={index}/>)}</div>
            </div>

            <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
                <div className="market-side-card">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-[#FFB300]"/><h3
                            className="text-sm font-black text-white">پرتحرک‌ترین
                            نمادهای {MARKET_LABELS[marketTab]}</h3></div>
                        <div className="grid grid-cols-2 rounded-lg bg-white/6 p-1 text-xs">
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
                <div className="market-side-card">
                    <div className="mb-4 flex items-center gap-2"><BellRing className="h-4 w-4 text-[#FFB300]"/><h3
                        className="text-sm font-black text-white">پیام‌های ناظر</h3></div>
                    <div className="grid gap-2 sm:grid-cols-2">{data.codalNotices.slice(0, 10).map((notice) => <article
                        key={`${notice.noticeId}-${notice.trackingNumber}`} className="market-notice-row"><span
                        className="text-[11px] font-black text-[#21E6B7]">{notice.symbol ?? 'بازار'}</span><p
                        className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-white/70">{notice.title ?? 'بدون عنوان'}</p>
                    </article>)}</div>
                </div>
            </div>

            <div className="mt-6"><h3 className="mb-4 text-lg font-black text-white">نمادهای پرطرفدار</h3>
                <div className="grid items-start gap-5 lg:grid-cols-2"><PopularColumn title="بورس"
                                                                                      items={boursePopular}/><PopularColumn
                    title="فرابورس" items={faraboursePopular}/></div>
            </div>

            <div
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
            </div>
        </div>
    </section>;
}
