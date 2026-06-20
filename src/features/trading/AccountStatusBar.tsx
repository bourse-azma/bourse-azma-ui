import {useCallback, useEffect, useState} from 'react';
import {Eye, EyeOff, Loader2, RefreshCw} from 'lucide-react';
import type {AccountSummary} from './accountSummary';

const HIDE_VALUES_STORAGE_KEY = 'bourse-azma-hide-account-values';

const toLtrIsolated = (value: string) => `\u2066${value}\u2069`;

const formatNumberFa = (value: number, digits = 0) =>
    toLtrIsolated(
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(value)
    );

const formatGrowthLabel = (growth: number, growthPercent: number) => {
    const growthSign = growth > 0 ? '+' : '';
    const percentSign = growthPercent > 0 ? '+' : '';
    return toLtrIsolated(
        `(${growthSign}${new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0,
        }).format(growth)} (${percentSign}${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(growthPercent)}%))`
    );
};

const HIDDEN_VALUE = '••••••';

type AccountStatusBarProps = {
    summary: AccountSummary;
    loading?: boolean;
    onRefresh?: () => void | Promise<void>;
    onDepositClick?: () => void;
};

type StatItemProps = {
    label: string;
    value: string;
    hidden: boolean;
    valueClassName?: string;
    suffix?: string;
};

function StatItem({label, value, hidden, valueClassName = 'text-text', suffix}: StatItemProps) {
    return (
        <div className="flex shrink-0 items-center gap-2 px-2.5 sm:px-3">
            <span className="whitespace-nowrap text-[11px] text-muted sm:text-xs">{label}</span>
            <span className={`whitespace-nowrap text-xs font-semibold tabular-nums sm:text-sm ${valueClassName}`}>
                {hidden ? HIDDEN_VALUE : value}
            </span>
            {!hidden && suffix ? (
                <span className={`whitespace-nowrap text-[11px] font-medium tabular-nums sm:text-xs ${valueClassName}`}>
                    {suffix}
                </span>
            ) : null}
        </div>
    );
}

const readHidePreference = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(HIDE_VALUES_STORAGE_KEY) === '1';
};

export default function AccountStatusBar({summary, loading = false, onRefresh, onDepositClick}: AccountStatusBarProps) {
    const [valuesHidden, setValuesHidden] = useState(readHidePreference);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        window.localStorage.setItem(HIDE_VALUES_STORAGE_KEY, valuesHidden ? '1' : '0');
    }, [valuesHidden]);

    const handleRefresh = useCallback(async () => {
        if (!onRefresh || refreshing) return;
        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh, refreshing]);

    const growthPositive = summary.portfolioGrowth >= 0;
    const growthClassName = growthPositive ? 'text-positive' : 'text-negative';
    const portfolioSuffix =
        summary.portfolioCost > 0 || summary.portfolioGrowth !== 0
            ? formatGrowthLabel(summary.portfolioGrowth, summary.portfolioGrowthPercent)
            : formatGrowthLabel(0, 0);
    const netAssets = summary.portfolioValue + summary.customerBalance;

    return (
        <footer
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/95 shadow-[0_-8px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="thin-scrollbar overflow-x-auto">
                <div
                    className="mx-auto flex min-w-max max-w-[1800px] items-center justify-between gap-2 px-2 py-2 sm:px-4">
                    <div className="flex items-center">
                        <StatItem
                            label="خالص دارایی"
                            value={formatNumberFa(netAssets)}
                            hidden={valuesHidden}
                        />
                        <span className="text-border/80">|</span>
                        <StatItem
                            label="سبد سهام"
                            value={formatNumberFa(summary.portfolioValue)}
                            hidden={valuesHidden}
                            valueClassName={growthClassName}
                            suffix={portfolioSuffix}
                        />
                        <span className="text-border/80">|</span>
                        <StatItem
                            label="مانده مشتری"
                            value={formatNumberFa(summary.customerBalance)}
                            hidden={valuesHidden}
                        />
                        <span className="text-border/80">|</span>
                        <StatItem
                            label="قدرت خرید"
                            value={formatNumberFa(summary.buyingPower)}
                            hidden={valuesHidden}
                        />
                        <span className="text-border/80">|</span>
                        <StatItem
                            label="بلوکه شده"
                            value={formatNumberFa(summary.blockedAmount)}
                            hidden={valuesHidden}
                        />
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 pe-1 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => onDepositClick?.()}
                            className="inline-flex h-8 items-center justify-center rounded-full border border-border/80 bg-surface px-3 text-[11px] font-semibold text-text transition hover:border-primary/35 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-9 sm:px-4 sm:text-xs"
                        >
                            واریز آنی وجه
                        </button>

                        <button
                            type="button"
                            onClick={() => void handleRefresh()}
                            disabled={refreshing || loading}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface-2 text-muted transition hover:text-text focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:w-9"
                            aria-label="به‌روزرسانی اطلاعات حساب"
                            title="به‌روزرسانی"
                        >
                            {refreshing || loading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5"/>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setValuesHidden((prev) => !prev)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface-2 text-muted transition hover:text-text focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-9 sm:w-9"
                            aria-label={valuesHidden ? 'نمایش مقادیر حساب' : 'مخفی کردن مقادیر حساب'}
                            title={valuesHidden ? 'نمایش مقادیر' : 'مخفی کردن مقادیر'}
                        >
                            {valuesHidden ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
