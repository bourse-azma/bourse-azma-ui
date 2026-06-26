import {type FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    AlertCircle,
    Loader2,
    MessageSquare,
} from 'lucide-react';
import {
    addAdminSupportTicketMessage,
    closeAdminSupportTicket,
    editAdminSupportTicketMessage,
    getAdminSupportTicketDetail,
    getAdminSupportTickets,
} from './api';
import TicketDetailView from './TicketDetailView';
import TicketListItem from './TicketListItem';
import {AdminTicketStatsStrip} from './TicketStatsStrip';
import {
    canCloseTicket,
    canUserReply,
    SUPPORT_CATEGORY_OPTIONS,
    SUPPORT_PRIORITY_OPTIONS,
    SUPPORT_STATUS_OPTIONS,
} from './supportMeta';
import {computeAdminTicketStats} from './supportStats';
import {useSupportTicketsAutoRefresh} from './useSupportTicketsAutoRefresh';
import type {
    SupportRequestCategory,
    SupportRequestPriority,
    SupportRequestStatus,
    SupportTicket,
    SupportTicketDetail,
    SupportTicketFilters,
} from './types';

const cardClass = 'rounded-2xl border border-border/70 bg-surface shadow-card dark:shadow-none';

type AdminSupportPanelProps = {
    accessToken: string;
    enabled: boolean;
};

export default function AdminSupportPanel({accessToken, enabled}: AdminSupportPanelProps) {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
    const [filters, setFilters] = useState<SupportTicketFilters>({});
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reply, setReply] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);
    const [closeSubmitting, setCloseSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const hasLoadedOnceRef = useRef(false);

    const fetchTickets = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const result = await getAdminSupportTickets(accessToken, filters);
            setTickets(result);
            hasLoadedOnceRef.current = true;
        } catch (fetchError) {
            if (!silent) {
                setError(fetchError instanceof Error ? fetchError.message : 'دریافت تیکت‌ها ناموفق بود.');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [accessToken, filters]);

    const loadDetail = useCallback(async (ticketId: number, silent = false) => {
        if (!silent) {
            setDetailLoading(true);
            setError(null);
        }
        try {
            const result = await getAdminSupportTicketDetail(accessToken, ticketId);
            setDetail(result);
        } catch (loadError) {
            if (!silent) {
                setError(loadError instanceof Error ? loadError.message : 'دریافت جزئیات تیکت ناموفق بود.');
            }
        } finally {
            if (!silent) {
                setDetailLoading(false);
            }
        }
    }, [accessToken]);

    useEffect(() => {
        if (!enabled) {
            return;
        }
        void fetchTickets(hasLoadedOnceRef.current);
    }, [enabled, fetchTickets]);

    useEffect(() => {
        if (selectedTicketId == null) {
            setDetail(null);
            return;
        }
        void loadDetail(selectedTicketId);
    }, [loadDetail, selectedTicketId]);

    useSupportTicketsAutoRefresh(
        useCallback(async (silent) => {
            if (selectedTicketId == null) {
                await fetchTickets(silent);
                return;
            }
            await Promise.all([fetchTickets(silent), loadDetail(selectedTicketId, silent)]);
        }, [fetchTickets, loadDetail, selectedTicketId]),
        enabled,
    );

    const sortedTickets = useMemo(
        () => [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        [tickets],
    );

    const stats = useMemo(() => computeAdminTicketStats(sortedTickets), [sortedTickets]);

    if (selectedTicketId != null && detail?.ticket) {
        const ticket = detail.ticket;

        return (
            <TicketDetailView
                ticket={ticket}
                messages={detail.messages}
                mode="admin"
                loading={detailLoading}
                error={error}
                success={success}
                onBack={() => {
                    setSelectedTicketId(null);
                    setReply('');
                    setSuccess(null);
                    setError(null);
                }}
                reply={reply}
                onReplyChange={setReply}
                replySubmitting={replySubmitting}
                showReply={canUserReply(ticket.status)}
                showClose={canCloseTicket(ticket.status)}
                closeSubmitting={closeSubmitting}
                replyPlaceholder="پاسخ پشتیبانی..."
                replyInputId="admin-reply"
                onSubmitReply={async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    const normalized = reply.trim().replace(/\s+/g, ' ');
                    if (!normalized) {
                        setError('متن پاسخ را وارد کنید.');
                        return;
                    }
                    setReplySubmitting(true);
                    setError(null);
                    setSuccess(null);
                    try {
                        await addAdminSupportTicketMessage(accessToken, selectedTicketId, normalized);
                        setReply('');
                        setSuccess('ارسال شد.');
                        await Promise.all([fetchTickets(true), loadDetail(selectedTicketId, true)]);
                    } catch (submitError) {
                        setError(submitError instanceof Error ? submitError.message : 'ارسال پاسخ ناموفق بود.');
                    } finally {
                        setReplySubmitting(false);
                    }
                }}
                onClose={async () => {
                    setCloseSubmitting(true);
                    setError(null);
                    setSuccess(null);
                    try {
                        const updated = await closeAdminSupportTicket(accessToken, selectedTicketId);
                        setDetail((prev) => (prev ? {...prev, ticket: updated} : prev));
                        setTickets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                        setSuccess('تیکت بسته شد.');
                    } catch (closeError) {
                        setError(closeError instanceof Error ? closeError.message : 'بستن تیکت ناموفق بود.');
                    } finally {
                        setCloseSubmitting(false);
                    }
                }}
                onEditMessage={async (messageId, newText) => {
                    if (messageId == null) {
                        throw new Error('پیام اولیه فقط توسط کاربر قابل ویرایش است.');
                    }
                    setError(null);
                    await editAdminSupportTicketMessage(accessToken, selectedTicketId, messageId, newText);
                    await loadDetail(selectedTicketId, true);
                }}
            />
        );
    }

    if (selectedTicketId != null && detailLoading && !detail) {
        return (
            <section dir="rtl" className={`${cardClass} p-6`}>
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                </div>
            </section>
        );
    }

    return (
        <section dir="rtl" className={`${cardClass} overflow-hidden`}>
            <div className="border-b border-border/50 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-bold text-text">درخواست‌ها</h2>
            </div>

            <AdminTicketStatsStrip stats={stats}/>

            <div className="grid grid-cols-1 gap-2 border-b border-border/50 px-4 py-3 sm:grid-cols-3 sm:px-5">
                <select
                    value={filters.status ?? ''}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            status: (event.target.value || undefined) as SupportRequestStatus | undefined,
                        }))
                    }
                    className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none"
                >
                    <option value="">همه وضعیت‌ها</option>
                    {SUPPORT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <select
                    value={filters.category ?? ''}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            category: (event.target.value || undefined) as SupportRequestCategory | undefined,
                        }))
                    }
                    className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none"
                >
                    <option value="">همه دسته‌ها</option>
                    {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <select
                    value={filters.priority ?? ''}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            priority: (event.target.value || undefined) as SupportRequestPriority | undefined,
                        }))
                    }
                    className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none"
                >
                    <option value="">همه اولویت‌ها</option>
                    {SUPPORT_PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {error ? (
                <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative sm:mx-5">
                    <AlertCircle className="h-4 w-4 shrink-0"/>
                    {error}
                </div>
            ) : null}

            <div className="p-4 sm:px-5">
                {loading && sortedTickets.length === 0 ? (
                    <div className="space-y-2">
                        {Array.from({length: 4}, (_, index) => (
                            <div key={index} className="h-20 animate-pulse rounded-xl bg-surface-2"/>
                        ))}
                    </div>
                ) : sortedTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-2/60 px-5 py-12 text-center">
                        <MessageSquare className="h-7 w-7 text-muted"/>
                        <p className="mt-2 text-sm font-semibold text-text">تیکتی یافت نشد</p>
                    </div>
                ) : (
                    <div className="thin-scrollbar max-h-[620px] space-y-2 overflow-y-auto">
                        {sortedTickets.map((item) => (
                            <TicketListItem
                                key={item.id}
                                ticket={item}
                                showUser
                                onClick={() => setSelectedTicketId(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
