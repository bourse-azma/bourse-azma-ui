import {type FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AlertCircle, Check, Loader2, MessageSquare, Plus, Send,} from 'lucide-react';
import {createSupportTicket, getSupportTickets} from './api';
import TicketDetailPanel from './TicketDetailPanel';
import TicketListItem from './TicketListItem';
import {UserTicketStatsStrip} from './TicketStatsStrip';
import {SUPPORT_CATEGORY_OPTIONS, SUPPORT_PRIORITY_OPTIONS,} from './supportMeta';
import {computeUserTicketStats} from './supportStats';
import {useSupportTicketsAutoRefresh} from './useSupportTicketsAutoRefresh';
import type {SupportRequestCategory, SupportRequestPriority, SupportTicket} from './types';

const cardClass = 'rounded-2xl border border-border/70 bg-surface shadow-card dark:shadow-none';

type SupportRequestsPanelProps = {
    accessToken: string;
    enabled: boolean;
};

export default function SupportRequestsPanel({accessToken, enabled}: SupportRequestsPanelProps) {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState<SupportRequestCategory>('OTHER');
    const [priority, setPriority] = useState<SupportRequestPriority>('MEDIUM');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const hasLoadedOnceRef = useRef(false);

    const fetchTickets = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        setError(null);
        try {
            const result = await getSupportTickets(accessToken);
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
    }, [accessToken]);

    useEffect(() => {
        if (!enabled) {
            return;
        }
        void fetchTickets(hasLoadedOnceRef.current);
    }, [enabled, fetchTickets]);

    useSupportTicketsAutoRefresh(fetchTickets, enabled && selectedTicketId == null);

    const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedSubject = subject.trim().replace(/\s+/g, ' ');
        const normalizedMessage = message.trim().replace(/\s+/g, ' ');
        if (!normalizedSubject || !normalizedMessage) {
            setError('موضوع و متن پیام را کامل وارد کنید.');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const created = await createSupportTicket(accessToken, {
                subject: normalizedSubject,
                message: normalizedMessage,
                category,
                priority,
            });
            setTickets((prev) => [created, ...prev]);
            setSubject('');
            setMessage('');
            setCategory('OTHER');
            setPriority('MEDIUM');
            setShowCreateForm(false);
            setSuccess('تیکت ثبت شد.');
            setSelectedTicketId(created.id);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'ثبت تیکت ناموفق بود.');
        } finally {
            setSubmitting(false);
        }
    };

    const sortedTickets = useMemo(
        () => [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [tickets],
    );

    const stats = useMemo(() => computeUserTicketStats(sortedTickets), [sortedTickets]);

    if (selectedTicketId != null) {
        return (
            <TicketDetailPanel
                accessToken={accessToken}
                ticketId={selectedTicketId}
                enabled={enabled}
                onBack={() => setSelectedTicketId(null)}
                onTicketUpdated={(updated) => {
                    setTickets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                }}
            />
        );
    }

    return (
        <section dir="rtl" className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-bold text-text">درخواست‌ها</h2>
                <button
                    type="button"
                    onClick={() => {
                        setShowCreateForm((prev) => !prev);
                        setError(null);
                        setSuccess(null);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-bold text-white transition hover:brightness-105"
                >
                    <Plus className="h-3.5 w-3.5"/>
                    تیکت جدید
                </button>
            </div>

            {sortedTickets.length > 0 ? <UserTicketStatsStrip stats={stats}/> : null}

            {showCreateForm ? (
                <form onSubmit={submitTicket} className="space-y-3 border-b border-border/50 p-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <select
                            value={category}
                            onChange={(event) => setCategory(event.target.value as SupportRequestCategory)}
                            className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/25"
                        >
                            {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <select
                            value={priority}
                            onChange={(event) => setPriority(event.target.value as SupportRequestPriority)}
                            className="h-10 rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/25"
                        >
                            {SUPPORT_PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        maxLength={120}
                        placeholder="موضوع"
                        className="h-10 w-full rounded-xl border border-border/80 bg-surface px-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/25"
                    />

                    <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        maxLength={2000}
                        rows={4}
                        placeholder="شرح درخواست"
                        className="w-full resize-none rounded-xl border border-border/80 bg-surface px-3 py-3 text-sm leading-7 text-text outline-none placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/25"
                    />

                    {error ? (
                        <div
                            className="flex items-center gap-2 rounded-xl border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
                            <AlertCircle className="h-4 w-4 shrink-0"/>
                            {error}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-70"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        ثبت
                    </button>
                </form>
            ) : null}

            {success ? (
                <div
                    className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/10 px-3 py-2 text-xs text-positive sm:mx-5">
                    <Check className="h-4 w-4 shrink-0"/>
                    {success}
                </div>
            ) : null}

            <div className="p-4 sm:px-5">
                {loading && sortedTickets.length === 0 ? (
                    <div className="space-y-2">
                        {Array.from({length: 3}, (_, index) => (
                            <div key={index} className="h-20 animate-pulse rounded-xl bg-surface-2"/>
                        ))}
                    </div>
                ) : sortedTickets.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-2/60 px-5 py-12 text-center">
                        <MessageSquare className="h-7 w-7 text-muted"/>
                        <p className="mt-2 text-sm font-semibold text-text">تیکتی ثبت نشده</p>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(true)}
                            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"
                        >
                            <Plus className="h-4 w-4"/>
                            تیکت جدید
                        </button>
                    </div>
                ) : (
                    <div className="thin-scrollbar max-h-[560px] space-y-2 overflow-y-auto">
                        {sortedTickets.map((item) => (
                            <TicketListItem
                                key={item.id}
                                ticket={item}
                                onClick={() => setSelectedTicketId(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
