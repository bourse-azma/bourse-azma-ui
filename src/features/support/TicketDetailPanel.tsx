import {useCallback, useEffect, useState} from 'react';
import {Loader2} from 'lucide-react';
import {
    addSupportTicketMessage,
    closeSupportTicket,
    editSupportTicketInitialMessage,
    editSupportTicketMessage,
    getSupportTicketDetail,
    rateSupportTicket,
} from './api';
import TicketDetailView from './TicketDetailView';
import {
    canCloseTicket,
    canUserReply,
    isTicketRateable,
} from './supportMeta';
import {useSupportTicketsAutoRefresh} from './useSupportTicketsAutoRefresh';
import type {SupportTicket, SupportTicketDetail} from './types';

const cardClass = 'rounded-2xl border border-border/70 bg-surface shadow-card dark:shadow-none';

type TicketDetailPanelProps = {
    accessToken: string;
    ticketId: number;
    enabled: boolean;
    onBack: () => void;
    onTicketUpdated: (ticket: SupportTicket) => void;
};

export default function TicketDetailPanel({
    accessToken,
    ticketId,
    enabled,
    onBack,
    onTicketUpdated,
}: TicketDetailPanelProps) {
    const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reply, setReply] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);
    const [closeSubmitting, setCloseSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadDetail = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        if (!silent) {
            setError(null);
        }
        try {
            const result = await getSupportTicketDetail(accessToken, ticketId);
            setDetail(result);
            if (result.ticket.rating) {
                setRating(result.ticket.rating);
            }
            if (result.ticket.ratingComment) {
                setRatingComment(result.ticket.ratingComment);
            }
        } catch (loadError) {
            if (!silent) {
                setError(loadError instanceof Error ? loadError.message : 'دریافت جزئیات تیکت ناموفق بود.');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [accessToken, ticketId]);

    useEffect(() => {
        void loadDetail();
    }, [loadDetail]);

    useSupportTicketsAutoRefresh(loadDetail, enabled);

    if (loading && !detail) {
        return (
            <section dir="rtl" className={`${cardClass} p-6`}>
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                </div>
            </section>
        );
    }

    if (!detail) {
        return (
            <section dir="rtl" className={`${cardClass} p-6`}>
                <p className="text-sm text-negative">{error ?? 'تیکت یافت نشد.'}</p>
            </section>
        );
    }

    const {ticket, messages} = detail;

    return (
        <TicketDetailView
            ticket={ticket}
            messages={messages}
            mode="user"
            loading={loading}
            error={error}
            success={success}
            onBack={onBack}
            reply={reply}
            onReplyChange={setReply}
            replySubmitting={replySubmitting}
            showReply={canUserReply(ticket.status)}
            showClose={canCloseTicket(ticket.status)}
            closeSubmitting={closeSubmitting}
            rating={rating}
            onRatingChange={setRating}
            ratingComment={ratingComment}
            onRatingCommentChange={setRatingComment}
            ratingSubmitting={ratingSubmitting}
            ratingSuccess={ratingSuccess}
            showRating={isTicketRateable(ticket.status) && ticket.rating == null}
            onSubmitReply={async (event) => {
                event.preventDefault();
                const normalized = reply.trim().replace(/\s+/g, ' ');
                if (!normalized) {
                    setError('متن پیام را وارد کنید.');
                    return;
                }
                setReplySubmitting(true);
                setError(null);
                setSuccess(null);
                try {
                    await addSupportTicketMessage(accessToken, ticketId, normalized);
                    setReply('');
                    await loadDetail(true);
                } catch (submitError) {
                    setError(submitError instanceof Error ? submitError.message : 'ارسال پیام ناموفق بود.');
                } finally {
                    setReplySubmitting(false);
                }
            }}
            onClose={async () => {
                setCloseSubmitting(true);
                setError(null);
                setSuccess(null);
                try {
                    const updated = await closeSupportTicket(accessToken, ticketId);
                    setDetail((prev) => (prev ? {...prev, ticket: updated} : prev));
                    onTicketUpdated(updated);
                    setSuccess('تیکت بسته شد.');
                } catch (closeError) {
                    setError(closeError instanceof Error ? closeError.message : 'بستن تیکت ناموفق بود.');
                } finally {
                    setCloseSubmitting(false);
                }
            }}
            onSubmitRating={async () => {
                if (rating < 1) {
                    setError('امتیاز را انتخاب کنید.');
                    return;
                }
                setRatingSubmitting(true);
                setError(null);
                setRatingSuccess(null);
                try {
                    const updated = await rateSupportTicket(accessToken, ticketId, {
                        rating,
                        comment: ratingComment.trim() || undefined,
                    });
                    setDetail((prev) => (prev ? {...prev, ticket: updated} : prev));
                    onTicketUpdated(updated);
                    setRatingSuccess('ثبت شد.');
                } catch (submitError) {
                    setError(submitError instanceof Error ? submitError.message : 'ثبت امتیاز ناموفق بود.');
                } finally {
                    setRatingSubmitting(false);
                }
            }}
            onEditMessage={async (messageId, newText) => {
                setError(null);
                if (messageId == null) {
                    await editSupportTicketInitialMessage(accessToken, ticketId, newText);
                } else {
                    await editSupportTicketMessage(accessToken, ticketId, messageId, newText);
                }
                await loadDetail(true);
            }}
        />
    );
}
