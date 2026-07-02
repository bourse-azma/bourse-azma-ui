import {Loader2, X} from 'lucide-react';
import {JALALI_MONTHS} from '../../notices/constants';
import {toMarketLabel} from '../../symbol-search/mappers';
import {formatFaInteger, formatFaPlainInteger} from '../formatters';
import type {TradingDashboardVm} from './types';

export function NoticeFilterModal({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            {vm.noticeFilterOpen ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        onClick={() => vm.setNoticeFilterOpen(false)}
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
                                onClick={() => vm.setNoticeFilterOpen(false)}
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
                                        value={vm.noticeFilterDraft.symbol}
                                        onFocus={() => vm.setNoticeSymbolDropdownOpen(true)}
                                        onChange={(event) => {
                                            vm.setNoticeFilterDraft((prev) => ({
                                                ...prev,
                                                symbol: event.target.value,
                                            }));
                                            vm.setNoticeSymbolDropdownOpen(true);
                                        }}
                                        type="text"
                                        placeholder="مثال: غدانه"
                                        className="h-10 w-full rounded-xl border border-border/80 bg-surface-2 px-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    />

                                    {vm.noticeFilterDraft.symbol.trim() !== '' && vm.noticeSymbolDropdownOpen ? (
                                        <div
                                            className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-y-auto rounded-xl border border-border/80 bg-surface shadow-card">
                                            {vm.noticeSymbolLoading ? (
                                                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                                    در حال جستجو...
                                                </div>
                                            ) : null}

                                            {!vm.noticeSymbolLoading && vm.noticeSymbolError ? (
                                                <div className="px-3 py-2 text-xs text-negative">
                                                    <p>جستجوی نماد با خطا مواجه شد.</p>
                                                    <button
                                                        type="button"
                                                        onClick={vm.retryNoticeSymbolSearch}
                                                        className="mt-1 rounded-full border border-negative/40 bg-negative/10 px-2.5 py-1 text-[11px] text-negative transition hover:bg-negative/15"
                                                    >
                                                        تلاش مجدد
                                                    </button>
                                                </div>
                                            ) : null}

                                            {!vm.noticeSymbolLoading && !vm.noticeSymbolError && vm.noticeSymbolResults.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-muted">نتیجه‌ای پیدا نشد.</div>
                                            ) : null}

                                            {!vm.noticeSymbolLoading && !vm.noticeSymbolError && vm.noticeSymbolResults.length > 0
                                                ? vm.noticeSymbolResults.slice(0, 10).map((item) => (
                                                    <button
                                                        key={`notice-symbol-${item.key}`}
                                                        type="button"
                                                        onMouseDown={(event) => {
                                                            event.preventDefault();
                                                            vm.applyNoticeSymbolSuggestion(item.symbol);
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
                                    checked={vm.noticeFilterDraft.underSupervisionOnly}
                                    onChange={(event) =>
                                        vm.setNoticeFilterDraft((prev) => ({
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
                                            vm.setNoticeFilterDraft((prev) => ({
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
                                        value={vm.noticeFilterDraft.fromDate?.day ?? ''}
                                        onChange={(event) => vm.updateDraftDatePart('fromDate', 'day', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">روز</option>
                                        {vm.dayOptions.map((day) => (
                                            <option key={`from-day-${day}`} value={day}>
                                                {formatFaInteger(day)}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={vm.noticeFilterDraft.fromDate?.month ?? ''}
                                        onChange={(event) => vm.updateDraftDatePart('fromDate', 'month', event.target.value)}
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
                                        value={vm.noticeFilterDraft.fromDate?.year ?? ''}
                                        onChange={(event) => vm.updateDraftDatePart('fromDate', 'year', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">سال</option>
                                        {vm.noticeYearOptions.map((year) => (
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
                                            vm.setNoticeFilterDraft((prev) => ({
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
                                        value={vm.noticeFilterDraft.toDate?.day ?? ''}
                                        onChange={(event) => vm.updateDraftDatePart('toDate', 'day', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">روز</option>
                                        {vm.dayOptions.map((day) => (
                                            <option key={`to-day-${day}`} value={day}>
                                                {formatFaInteger(day)}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={vm.noticeFilterDraft.toDate?.month ?? ''}
                                        onChange={(event) => vm.updateDraftDatePart('toDate', 'month', event.target.value)}
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
                                        value={vm.noticeFilterDraft.toDate?.year ?? ''}
                                        onChange={(event) => vm.updateDraftDatePart('toDate', 'year', event.target.value)}
                                        className="h-10 rounded-lg border border-border/80 bg-surface px-2 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">سال</option>
                                        {vm.noticeYearOptions.map((year) => (
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
                                onClick={vm.clearNoticeFilters}
                                className="rounded-xl border border-border/80 bg-surface-2 px-3 py-2 text-xs font-medium text-muted transition hover:text-text"
                            >
                                حذف فیلترها
                            </button>

                            <button
                                type="button"
                                onClick={() => vm.applyNoticeFilters(vm.noticeFilterDraft)}
                                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                اعمال فیلترها
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
