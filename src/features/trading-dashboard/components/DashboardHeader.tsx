import {ChevronDown, Clock3, Moon, Sun, UserRound, Wallet} from 'lucide-react';
import bourseAzmaLogo from '../../../assets/bourse-azma-logo.png';
import type {Theme} from '../../../hooks/useTheme';
import {ltrNumericClassName} from '../../../utils/numberFormat';
import {formatCompactValueOrUnavailable, formatNumberOrDash, formatPercentOrDash} from '../formatters';
import type {TradingDashboardVm} from './types';

export function DashboardHeader({vm, theme, onToggleTheme, profileDisplayName, onOpenProfile, onLogout}: {
    vm: TradingDashboardVm;
    theme: Theme;
    onToggleTheme: (origin?: { x: number; y: number }) => void;
    profileDisplayName: string;
    onOpenProfile: () => void;
    onLogout: () => void
}) {
    return (
        <>
            <header className="border-b border-border/60 px-3 py-2 sm:px-4">
                <div
                    className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 lg:grid-cols-12 [direction:ltr]">
                    <div dir="rtl" className="flex flex-wrap items-center gap-2 lg:col-span-3 lg:justify-start">
                        <div
                            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs">
                            <div className="flex items-center gap-1.5 text-muted">
                                <Clock3 className="h-3.5 w-3.5"/>
                                <span className="tabular-nums">{vm.clockValue}</span>
                            </div>
                            {vm.marketStateLoading ? (
                                <>
                                    <span className="h-3 w-px bg-border/70"/>
                                    <span className="inline-flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted/60"/>
                                            <span className="h-3 w-16 animate-pulse rounded-full bg-surface-2"/>
                                        </span>
                                </>
                            ) : vm.marketStateKnown ? (
                                <>
                                    <span className="h-3 w-px bg-border/70"/>
                                    <span
                                        className={`inline-flex items-center gap-1.5 font-medium ${
                                            vm.isMarketOpen ? 'text-positive' : 'text-negative'
                                        }`}
                                    >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    vm.isMarketOpen
                                                        ? 'bg-positive animate-pulse'
                                                        : 'bg-negative'
                                                }`}
                                            />
                                        {vm.isMarketOpen ? 'بازار باز' : 'بازار بسته'}
                                        </span>
                                </>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={vm.openWalletPanel}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary/15"
                            title="مشاهده کیف پول"
                            aria-label="مشاهده کیف پول"
                        >
                            <Wallet className="h-3.5 w-3.5"/>
                        </button>

                        <div ref={vm.profileMenuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => vm.setProfileMenuOpen((prev) => !prev)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary/35"
                            >
                                <UserRound className="h-4 w-4 text-muted"/>
                                {profileDisplayName}
                            </button>

                            {vm.profileMenuOpen ? (
                                <div
                                    className="absolute left-0 top-[calc(100%+8px)] z-40 w-44 rounded-xl border border-border/80 bg-surface p-1.5 shadow-card">
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
                    </div>

                    <div dir="rtl" className="lg:col-span-5">
                        <div className="relative mx-auto w-full max-w-[520px]">
                            <button
                                type="button"
                                onClick={() => vm.setMarketPanelOpen((prev) => !prev)}
                                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-1.5 transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/35 ${
                                    vm.marketPositive
                                        ? 'border-positive/30 bg-positive/[0.08]'
                                        : 'border-negative/35 bg-negative/[0.08]'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 text-xs text-muted">
                                    <span className="font-medium sm:text-sm">شاخص کل بورس</span>
                                    <span className="text-[11px] text-muted/80">بورس • فرابورس</span>
                                </div>

                                <div className="flex items-center gap-2 [direction:ltr]">
                    <span
                        className="text-xl leading-none font-extrabold tracking-tight tabular-nums text-text sm:text-2xl">
                      {formatNumberOrDash(vm.marketIndex)}
                    </span>

                                    <span
                                        className={`text-xs font-semibold ${ltrNumericClassName} sm:text-sm ${
                                            vm.marketPositive ? 'text-positive' : 'text-negative'
                                        }`}
                                    >
                      {formatNumberOrDash(vm.marketDelta)}
                    </span>

                                    <span
                                        className={`text-xs font-semibold ${ltrNumericClassName} sm:text-sm ${
                                            vm.marketPositive ? 'text-positive' : 'text-negative'
                                        }`}
                                    >
                      ({formatPercentOrDash(vm.marketPercent)})
                    </span>

                                    <ChevronDown
                                        className={`h-3.5 w-3.5 text-muted transition ${vm.marketPanelOpen ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </button>

                            {vm.marketPanelOpen ? (
                                <div
                                    className="mt-2 rounded-xl border border-border/70 bg-surface p-1.5 shadow-card lg:absolute lg:left-0 lg:right-0 lg:top-full lg:z-30">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {vm.marketDetails.map((item) => (
                                            <div
                                                key={item.id}
                                                className="rounded-lg border border-border/70 bg-surface-2 p-2.5"
                                            >
                                                <div className="mb-1.5 flex items-center justify-between">
                                                        <span
                                                            className="text-xs font-semibold text-text sm:text-sm">{item.label}</span>
                                                    <span
                                                        className={`text-[11px] font-semibold ${ltrNumericClassName} ${
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
                                                        className={`text-left font-semibold ${ltrNumericClassName} ${
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
        </>
    );
}
