import {ChevronLeft, Clock3, Star} from 'lucide-react';
import {formatDateTimeFa} from '../../utils/formatDateTime';
import {formatNumberFa} from '../../utils/numberFormat';
import {CLOSED_BY_LABELS, SUPPORT_CATEGORY_META, SUPPORT_PRIORITY_META} from './supportMeta';
import {getTicketLifecycle} from './supportStats';
import type {SupportTicket} from './types';

type TicketListItemProps = {
    ticket: SupportTicket;
    onClick: () => void;
    showUser?: boolean;
};

export default function TicketListItem({ticket, onClick, showUser = false}: TicketListItemProps) {
    const lifecycle = getTicketLifecycle(ticket.status);
    const categoryMeta = SUPPORT_CATEGORY_META[ticket.category];
    const priorityMeta = SUPPORT_PRIORITY_META[ticket.priority];
    const needsRating = ticket.status === 'CLOSED' && ticket.rating == null;
    const closedByLabel = ticket.status === 'CLOSED' && ticket.closedBy
        ? CLOSED_BY_LABELS[ticket.closedBy]
        : null;

    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full rounded-xl border border-border/60 bg-surface px-3.5 py-3 text-right transition hover:border-primary/25 hover:bg-surface-2/60 sm:px-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold leading-6 text-text">{ticket.subject}</h4>
                        {needsRating ? (
                            <span
                                className="inline-flex items-center gap-1 rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                                <Star className="h-3 w-3"/>
                                امتیاز
                            </span>
                        ) : null}
                    </div>

                    {showUser && ticket.user ? (
                        <p className="mt-0.5 text-[11px] text-muted">
                            {ticket.user.displayName} · @{ticket.user.username}
                        </p>
                    ) : null}

                    <p className="mt-1 line-clamp-1 text-[11px] leading-6 text-muted">{ticket.message}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                        <span>#{formatNumberFa(ticket.id)}</span>
                        <span>·</span>
                        <span>{categoryMeta.label}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1" dir="ltr">
                            <Clock3 className="h-3 w-3"/>
                            {formatDateTimeFa(ticket.lastReplyAt)}
                        </span>
                        {ticket.rating ? (
                            <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 text-warning">
                                    <Star className="h-3 w-3 fill-warning"/>
                                    {formatNumberFa(ticket.rating)}
                                </span>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lifecycle.className}`}>
                        {lifecycle.label}
                    </span>
                    {closedByLabel ? (
                        <span className="text-[10px] text-muted">{closedByLabel}</span>
                    ) : null}
                    <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityMeta.className}`}>
                        {priorityMeta.label}
                    </span>
                    <ChevronLeft className="h-4 w-4 text-muted transition group-hover:text-primary"/>
                </div>
            </div>
        </button>
    );
}
