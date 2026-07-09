import {ChevronDown, Clock3, Moon, Sun, UserRound, Wallet} from 'lucide-react';
import bourseAzmaLogo from '../../../assets/bourse-azma-logo.png';
import type {Theme} from '../../../hooks/useTheme';
import {ltrNumericClassName} from '../../../utils/numberFormat';
import {formatCompactValueOrUnavailable, formatNumberOrDash, formatPercentOrDash} from '../formatters';
import type {TradingDashboardVm} from './types';

function ThemeToggleButton({theme, onToggleTheme}: {
    theme: Theme;
    onToggleTheme: (origin?: { x: number; y: number }) => void
}) {
    return (
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
            className="relative inline-flex h-8 w-[68px] shrink-0 items-center overflow-hidden rounded-full border border-border/80 bg-surface-2 px-1 transition hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/50 sm:w-[72px]"
        >
            <span
                className={`absolute top-1 left-1 h-6 w-8 rounded-full bg-surface shadow-sm transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-8 sm:translate-x-9' : 'translate-x-0'
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
    );
}

function MarketStatusPill({vm, compact = false}: { vm: TradingDashboardVm; compact?: boolean }) {
    return (
        <div
            className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border/80 bg-surface-2 text-[11px] sm:gap-2 sm:text-xs ${
                compact ? 'px-2 py-0.5' : 'px-2.5 py-1 sm:px-3 sm:py-1.5'
            }`}
        >
            <div className="flex shrink-0 items-center gap-1 text-muted">
                <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5"/>
                <span className="tabular-nums">{vm.clockValue}</span>
            </div>
            {vm.marketStateLoading ? (
                <>
                    <span className="h-3 w-px shrink-0 bg-border/70"/>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted/60"/>
                        <span className="h-3 w-10 animate-pulse rounded-full bg-surface-2"/>
                    </span>
                </>
            ) : vm.marketStateKnown ? (
                <>
                    <span className="h-3 w-px shrink-0 bg-border/70"/>
                    <span
                        className={`inline-flex shrink-0 items-center gap-1 font-medium ${
                            vm.isMarketOpen ? 'text-positive' : 'text-negative'
                        }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                vm.isMarketOpen ? 'bg-positive animate-pulse' : 'bg-negative'
                            }`}
                        />
                        {vm.isMarketOpen ? 'باز' : 'بسته'}
                    </span>
                </>
            ) : null}
        </div>
    );
}

function ProfileMenuButton({
                               vm,
                               profileDisplayName,
                               onOpenProfile,
                               onLogout,
                               compact = false,
                           }: {
    vm: TradingDashboardVm;
    profileDisplayName: string;
    onOpenProfile: () => void;
    onLogout: () => void;
    compact?: boolean;
}) {
    return (
        <div ref={vm.profileMenuRef} className="relative min-w-0">
            <button
                type="button"
                onClick={() => vm.setProfileMenuOpen((prev) => !prev)}
                className={
                    compact
                        ? 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-surface text-text transition hover:border-primary/35'
                        : 'inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-surface px-2.5 py-1.5 text-[11px] font-medium text-text transition hover:border-primary/35 sm:px-3 sm:text-xs'
                }
                aria-label={profileDisplayName}
            >
                <UserRound className={`shrink-0 text-muted ${compact ? 'h-4 w-4' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'}`}/>
                {!compact ? <span className="truncate">{profileDisplayName}</span> : null}
            </button>

            {vm.profileMenuOpen ? (
                <div
                    className="absolute left-0 top-[calc(100%+8px)] z-50 w-44 rounded-xl border border-border/80 bg-surface p-1.5 shadow-card"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => {
                            vm.setProfileMenuOpen(false);
                            onOpenProfile();
                        }}
                        className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-xs text-text transition hover:bg-surface-2"
                    >
                        نمایش/ویرایش پروفایل
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            vm.setProfileMenuOpen(false);
                            onLogout();
                        }}
                        className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-xs text-negative transition hover:bg-negative/10"
                    >
                        خروج از حساب
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function WalletButton({vm, compact = false}: { vm: TradingDashboardVm; compact?: boolean }) {
    return (
        <button
            type="button"
            onClick={vm.openWalletPanel}
            className={
                compact
                    ? 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary/15'
                    : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary/15'
            }
            title="مشاهده کیف پول"
            aria-label="مشاهده کیف پول"
        >
            <Wallet className="h-3.5 w-3.5"/>
        </button>
    );
}

function MarketIndexPanel({vm, compact = false}: { vm: TradingDashboardVm; compact?: boolean }) {
    return (
        <div className={`relative min-w-0 ${compact ? 'flex-1' : 'mx-auto w-full max-w-[520px] lg:max-w-none'}`}>
            <button
                type="button"
                onClick={() => vm.setMarketPanelOpen((prev) => !prev)}
                className={`flex w-full min-w-0 items-center justify-between gap-1.5 rounded-xl border transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/35 ${
                    compact ? 'px-2 py-1' : 'px-2.5 py-1.5 sm:px-3'
                } ${
                    vm.marketPositive
                        ? 'border-positive/30 bg-positive/[0.08]'
                        : 'border-negative/35 bg-negative/[0.08]'
                }`}
            >
                <div
                    className={`flex min-w-0 items-center gap-1 text-muted ${compact ? 'text-[10px]' : 'text-[11px] sm:gap-1.5 sm:text-xs'}`}>
                    <span className={`truncate font-medium ${compact ? '' : 'sm:text-sm'}`}>شاخص کل</span>
                    {!compact ? (
                        <span className="hidden shrink-0 text-[10px] text-muted/80 sm:inline sm:text-[11px]">بورس • فرابورس</span>
                    ) : null}
                </div>

                <div className="flex min-w-0 shrink-0 items-center gap-1 [direction:ltr] sm:gap-2">
                    <span
                        className={`font-extrabold leading-none tracking-tight tabular-nums text-text ${
                            compact ? 'text-sm' : 'text-base sm:text-2xl'
                        }`}
                    >
                        {formatNumberOrDash(vm.marketIndex)}
                    </span>
                    {!compact ? (
                        <span
                            className={`hidden text-xs font-semibold sm:inline ${ltrNumericClassName} sm:text-sm ${
                                vm.marketPositive ? 'text-positive' : 'text-negative'
                            }`}
                        >
                            {formatNumberOrDash(vm.marketDelta)}
                        </span>
                    ) : null}
                    <span
                        className={`font-semibold ${ltrNumericClassName} ${
                            compact ? 'text-[10px]' : 'text-[11px] sm:text-sm'
                        } ${vm.marketPositive ? 'text-positive' : 'text-negative'}`}
                    >
                        ({formatPercentOrDash(vm.marketPercent)})
                    </span>
                    <ChevronDown
                        className={`shrink-0 text-muted transition ${compact ? 'h-3 w-3' : 'h-3 w-3 sm:h-3.5 sm:w-3.5'} ${vm.marketPanelOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {vm.marketPanelOpen ? (
                <div
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-border/70 bg-surface p-1.5 shadow-card"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {vm.marketDetails.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-lg border border-border/70 bg-surface-2 p-2.5"
                            >
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-text sm:text-sm">{item.label}</span>
                                    <span
                                        className={`text-[11px] font-semibold ${ltrNumericClassName} ${
                                            item.positive ? 'text-positive' : 'text-negative'
                                        }`}
                                    >
                                        {formatNumberOrDash(item.deltaValue)} ({formatPercentOrDash(item.percentValue)})
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] sm:text-[11px]">
                                    <span className="text-muted">شاخص کل</span>
                                    <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                                        {formatNumberOrDash(item.indexValue)}
                                    </span>

                                    <span className="text-muted">تغییرات</span>
                                    <span
                                        className={`text-left font-semibold ${ltrNumericClassName} ${
                                            item.positive ? 'text-positive' : 'text-negative'
                                        }`}
                                    >
                                        {formatNumberOrDash(item.deltaValue)} ({formatPercentOrDash(item.percentValue)})
                                    </span>

                                    <span className="text-muted">تعداد معاملات</span>
                                    <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                                        {formatNumberOrDash(item.totalTrades)}
                                    </span>

                                    <span className="text-muted">ارزش معاملات</span>
                                    <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                                        {formatCompactValueOrUnavailable(item.tradeValue, 'T')}
                                    </span>

                                    <span className="text-muted">حجم معاملات</span>
                                    <span className="text-left font-semibold tabular-nums text-text [direction:ltr]">
                                        {formatCompactValueOrUnavailable(item.tradeVolume, 'B')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function DashboardHeader({vm, theme, onToggleTheme, profileDisplayName, onOpenProfile, onLogout}: {
    vm: TradingDashboardVm;
    theme: Theme;
    onToggleTheme: (origin?: { x: number; y: number }) => void;
    profileDisplayName: string;
    onOpenProfile: () => void;
    onLogout: () => void
}) {
    return (
        <header className="relative z-30 border-b border-border/60 px-3 py-1.5 sm:px-4 sm:py-2">
            <div className="mx-auto w-full max-w-[1800px] [direction:ltr]">
                {/* Mobile layout — compact 2-row header */}
                <div dir="rtl" className="flex flex-col gap-1.5 lg:hidden">
                    <div className="flex items-center gap-2">
                        <div className="flex shrink-0 items-center gap-1.5">
                            <img
                                src={bourseAzmaLogo}
                                alt="بورس آزما"
                                className="h-7 w-auto max-w-[80px] object-contain sm:h-8 sm:max-w-[96px]"
                            />
                            <span className="hidden text-sm font-extrabold text-text sm:inline">بورس آزما</span>
                        </div>

                        <MarketIndexPanel vm={vm} compact/>

                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <MarketStatusPill vm={vm} compact/>
                            <WalletButton vm={vm} compact/>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <ProfileMenuButton
                                vm={vm}
                                profileDisplayName={profileDisplayName}
                                onOpenProfile={onOpenProfile}
                                onLogout={onLogout}
                                compact
                            />
                            <ThemeToggleButton theme={theme} onToggleTheme={onToggleTheme}/>
                        </div>
                    </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden w-full grid-cols-12 gap-3 lg:grid">
                    <div dir="rtl" className="col-span-3 flex flex-wrap items-center gap-2">
                        <MarketStatusPill vm={vm}/>
                        <WalletButton vm={vm}/>
                        <ProfileMenuButton
                            vm={vm}
                            profileDisplayName={profileDisplayName}
                            onOpenProfile={onOpenProfile}
                            onLogout={onLogout}
                        />
                    </div>

                    <div dir="rtl" className="col-span-5 min-w-0">
                        <MarketIndexPanel vm={vm}/>
                    </div>

                    <div dir="rtl" className="col-span-4 flex min-w-0 items-center justify-end gap-2">
                        <div
                            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-3 py-1">
                            <span className="whitespace-nowrap text-sm font-extrabold text-text">بورس آزما</span>
                            <img
                                src={bourseAzmaLogo}
                                alt="بورس آزما"
                                className="h-10 w-auto max-w-[142px] object-contain"
                            />
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                            <nav
                                className="hidden items-center rounded-full border border-border/80 bg-surface-2 p-1 text-xs xl:inline-flex">
                                {vm.mainNavTabs.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => vm.setMainNavTab(item)}
                                        className={`rounded-full px-3 py-1 transition ${
                                            vm.mainNavTab === item
                                                ? 'bg-surface text-text shadow-sm'
                                                : 'text-muted hover:text-text'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </nav>
                            <ThemeToggleButton theme={theme} onToggleTheme={onToggleTheme}/>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
