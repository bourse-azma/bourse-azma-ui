import {type FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Loader2} from 'lucide-react';
import {
    addAdminSupportTicketMessage,
    closeAdminSupportTicket,
    editAdminSupportTicketMessage,
    getAdminSupportTicketDetail,
    getAdminSupportTickets,
} from './api';
import AdminTicketListView from './AdminTicketListView';
import TicketDetailView from './TicketDetailView';
import {canCloseTicket, canUserReply,} from './supportMeta';
import {computeAdminTicketStats} from './supportStats';
import {useSupportTicketsAutoRefresh} from './useSupportTicketsAutoRefresh';
import type {SupportTicket, SupportTicketDetail, SupportTicketFilters,} from './types';

const cardClass = 'rounded-2xl border border-border/70 bg-surface shadow-card dark:shadow-none';

type AdminSupportPanelProps = {
    accessToken: string;
    enabled: boolean;
};

export default function AdminSupportPanel({accessToken, enabled}: AdminSupportPanelProps) {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
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
    const replySubmittingRef = useRef(false);
    const closeSubmittingRef = useRef(false);

    const fetchTickets = useCallback(async (silent = false, pageToLoad = 0, append = false) => {
        if (!silent && !append) {
            setLoading(true);
            setError(null);
        }
        if (append) {
            setLoadingMore(true);
        }
        try {
            const result = await getAdminSupportTickets(accessToken, filters, pageToLoad, 20);
            setTickets((prev) => (append ? [...prev, ...result.items] : result.items));
            setPage(result.page);
            setHasMore(result.hasNext);
            hasLoadedOnceRef.current = true;
        } catch (fetchError) {
            if (!silent) {
                setError(fetchError instanceof Error ? fetchError.message : 'دریافت تیکت‌ها ناموفق بود.');
            }
        } finally {
            if (!silent && !append) {
                setLoading(false);
            }
            if (append) {
                setLoadingMore(false);
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
        void fetchTickets(hasLoadedOnceRef.current, 0, false);
    }, [enabled, filters, fetchTickets]);

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
                await fetchTickets(silent, 0, false);
                return;
            }
            await Promise.all([fetchTickets(silent, 0, false), loadDetail(selectedTicketId, silent)]);
        }, [fetchTickets, loadDetail, selectedTicketId]),
        enabled,
    );

    const sortedTickets = useMemo(
        () => [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        [tickets],
    );

    const stats = useMemo(() => computeAdminTicketStats(sortedTickets), [sortedTickets]);

    const handleLoadMore = useCallback(() => {
        if (!hasMore || loadingMore || loading) {
            return;
        }
        void fetchTickets(false, page + 1, true);
    }, [fetchTickets, hasMore, loading, loadingMore, page]);

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
                    if (replySubmittingRef.current) return;
                    const normalized = reply.trim().replace(/\s+/g, ' ');
                    if (!normalized) {
                        setError('متن پاسخ را وارد کنید.');
                        return;
                    }
                    replySubmittingRef.current = true;
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
                        replySubmittingRef.current = false;
                        setReplySubmitting(false);
                    }
                }}
                onClose={async () => {
                    if (closeSubmittingRef.current) return;
                    closeSubmittingRef.current = true;
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
                        closeSubmittingRef.current = false;
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
        <AdminTicketListView
            cardClass={cardClass}
            stats={stats}
            filters={filters}
            setFilters={setFilters}
            error={error}
            loading={loading}
            sortedTickets={sortedTickets}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            onSelectTicket={setSelectedTicketId}
        />
    );
}
