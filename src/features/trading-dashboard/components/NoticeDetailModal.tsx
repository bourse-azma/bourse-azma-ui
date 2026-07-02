import {ExternalLink, X} from 'lucide-react';
import {formatDateTimeFa} from '../../../utils/formatDateTime';
import type {TradingDashboardVm} from './types';

export function NoticeDetailModal({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            {vm.activeNoticeGroup ? (
                <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-5">
                    <button
                        type="button"
                        onClick={() => vm.setActiveNoticeGroup(null)}
                        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                        aria-label="close notice dialog"
                    />

                    <div
                        dir="rtl"
                        className="relative w-full max-w-[620px] rounded-2xl border border-border/70 bg-surface shadow-card"
                    >
                        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                            <h3 className="text-xl font-semibold text-text">
                                {vm.activeNoticeGroup.hasUnderSupervision ? 'پیام ناظر' : 'اطلاعیه'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => vm.setActiveNoticeGroup(null)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-muted transition hover:text-text"
                                aria-label="close notice details"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="thin-scrollbar max-h-[70vh] overflow-y-auto px-4 py-4">
                            <h4 className="text-2xl leading-10 font-extrabold text-text">{vm.activeNoticeGroup.title}</h4>
                            <p className="mt-1 text-[13px] tabular-nums text-muted"
                               dir="ltr">{formatDateTimeFa(vm.activeNoticeGroup.publishDateTime)}</p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {vm.activeNoticeGroup.symbols.map((symbol) => (
                                    <span
                                        key={`modal-symbol-${symbol}`}
                                        className="inline-flex rounded-full border border-border/70 bg-surface-2 px-2.5 py-1 text-[12px] text-muted"
                                    >
                    {symbol}
                  </span>
                                ))}

                                {vm.activeNoticeGroup.hasUnderSupervision ? (
                                    <span
                                        className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[12px] text-warning">
                    تحت نظارت
                  </span>
                                ) : null}
                            </div>

                            {vm.activeNoticeDetails ? (
                                <div
                                    className="mt-4 rounded-xl border border-border/70 bg-surface-2 p-3 text-sm text-text">
                                    <p className="mb-1">
                                        <span
                                            className="font-semibold">نماد:</span> {vm.activeNoticeDetails.primary.symbol}
                                    </p>
                                    <p>
                                        <span
                                            className="font-semibold">شرکت:</span> {vm.activeNoticeDetails.primary.companyName}
                                    </p>
                                </div>
                            ) : null}

                            {vm.activeNoticeDetails?.additionalInfo ? (
                                <div
                                    className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-3 text-sm leading-8 whitespace-pre-line text-text">
                                    {vm.activeNoticeDetails.additionalInfo}
                                </div>
                            ) : null}

                            {vm.activeNoticeDetails && vm.activeNoticeDetails.reasons.length > 0 ? (
                                <div className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-3">
                                    <h5 className="mb-2 text-sm font-semibold text-text">دلایل اعلام نظارت</h5>
                                    <ul className="space-y-1 text-sm leading-7 text-text">
                                        {vm.activeNoticeDetails.reasons.map((reason) => (
                                            <li key={reason} className="rounded-lg bg-surface px-2 py-1">
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {vm.activeNoticeDetails ? (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {vm.activeNoticeDetails.primary.reportUrl ? (
                                        <a
                                            href={vm.activeNoticeDetails.primary.reportUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                                        >
                                            مشاهده اطلاعیه
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}

                                    {vm.activeNoticeDetails.primary.pdfUrl ? (
                                        <a
                                            href={vm.activeNoticeDetails.primary.pdfUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
                                        >
                                            PDF
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}

                                    {vm.activeNoticeDetails.primary.excelUrl ? (
                                        <a
                                            href={vm.activeNoticeDetails.primary.excelUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
                                        >
                                            Excel
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}

                                    {vm.activeNoticeDetails.primary.attachmentUrl ? (
                                        <a
                                            href={vm.activeNoticeDetails.primary.attachmentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
                                        >
                                            پیوست
                                            <ExternalLink className="h-3.5 w-3.5"/>
                                        </a>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
