import {formatNumberFa, formatPercentFa, ltrNumericClassName} from '../../utils/numberFormat';
import type {LandingMarketData} from './useLandingMarketData';
import type {MarketOverview} from './types';

type HeroMarketPanelProps = {
    data: LandingMarketData;
};

const computeIndexPercent = (overview: MarketOverview | null) => {
    if (!overview || overview.totalIndexValue <= 0) return 0;
    return (overview.totalIndexChange / overview.totalIndexValue) * 100;
};

const isMarketOpen = (stateTitle: string | undefined | null) => stateTitle === 'باز';

type MarketCardProps = {
    label: string;
    overview: MarketOverview | null;
};

function MarketCard({label, overview}: MarketCardProps) {
    const indexPercent = computeIndexPercent(overview);
    const positive = indexPercent >= 0;
    const open = isMarketOpen(overview?.marketStateTitle);

    return (
        <div className="landing-market-card">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-white/72">{label}</p>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                        open
                            ? 'border border-[#00E5C9]/30 bg-[#00E5C9]/12 text-[#00E5C9]'
                            : 'border border-[#FF6B7A]/30 bg-[#FF6B7A]/12 text-[#FF6B7A]'
                    }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-[#00E5C9]' : 'bg-[#FF6B7A]'}`}/>
                    {overview ? (open ? 'باز' : 'بسته') : '—'}
                </span>
            </div>

            <p className={`mt-3 text-2xl font-black ${ltrNumericClassName}`}>
                {overview ? formatNumberFa(overview.totalIndexValue, 0) : '—'}
            </p>
            <p className={`mt-1 text-sm font-bold ${positive ? 'text-[#00E5C9]' : 'text-[#FF6B7A]'} ${ltrNumericClassName}`}>
                {overview ? formatPercentFa(indexPercent, 2) : '—'}
            </p>
        </div>
    );
}

export default function HeroMarketPanel({data}: HeroMarketPanelProps) {
    return (
        <div className="landing-market-panel w-full max-w-[480px]">
            <div className="mb-5">
                <p className="text-xs font-bold text-white/54">نمای بازار</p>
                <p className="mt-1 text-xl font-black text-white">وضعیت لحظه‌ای بورس و فرابورس</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <MarketCard label="شاخص کل بورس" overview={data.bourseOverview}/>
                <MarketCard label="شاخص کل فرابورس" overview={data.farabourseOverview}/>
            </div>

            {data.loading && !data.bourseOverview ? (
                <p className="mt-4 text-center text-xs font-semibold text-white/42">
                    در حال دریافت اطلاعات بازار...
                </p>
            ) : null}
        </div>
    );
}
