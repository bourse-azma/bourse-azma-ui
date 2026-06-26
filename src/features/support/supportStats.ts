import type {SupportRequestStatus, SupportTicket} from './types';

export type TicketLifecycleKey = 'awaiting' | 'answered' | 'closed';

export type TicketLifecycleMeta = {
    key: TicketLifecycleKey;
    label: string;
    className: string;
};

export const TICKET_LIFECYCLE_META: Record<TicketLifecycleKey, TicketLifecycleMeta> = {
    awaiting: {
        key: 'awaiting',
        label: 'در انتظار بررسی',
        className: 'border-primary/25 bg-primary/10 text-primary',
    },
    answered: {
        key: 'answered',
        label: 'پاسخ داده شده',
        className: 'border-warning/25 bg-warning/10 text-warning',
    },
    closed: {
        key: 'closed',
        label: 'بسته شده',
        className: 'border-border/70 bg-surface-2 text-muted',
    },
};

export const getTicketLifecycle = (status: SupportRequestStatus): TicketLifecycleMeta => {
    if (status === 'RESOLVED') {
        return TICKET_LIFECYCLE_META.answered;
    }
    if (status === 'CLOSED') {
        return TICKET_LIFECYCLE_META.closed;
    }
    return TICKET_LIFECYCLE_META.awaiting;
};

export type UserTicketStats = {
    total: number;
    awaiting: number;
    answered: number;
    closed: number;
};

export type AdminTicketStats = {
    awaiting: number;
    answered: number;
    closed: number;
};

export const computeUserTicketStats = (tickets: SupportTicket[]): UserTicketStats => ({
    total: tickets.length,
    awaiting: tickets.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length,
    answered: tickets.filter((item) => item.status === 'RESOLVED').length,
    closed: tickets.filter((item) => item.status === 'CLOSED').length,
});

export const computeAdminTicketStats = (tickets: SupportTicket[]): AdminTicketStats => ({
    awaiting: tickets.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length,
    answered: tickets.filter((item) => item.status === 'RESOLVED').length,
    closed: tickets.filter((item) => item.status === 'CLOSED').length,
});
