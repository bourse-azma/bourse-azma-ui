import type {SupportRequestCategory, SupportRequestPriority, SupportRequestStatus, SupportTicketClosedBy} from './types';

type MetaItem = {
    label: string;
    className: string;
};

export const SUPPORT_STATUS_META: Record<SupportRequestStatus, MetaItem> = {
    OPEN: {
        label: 'در انتظار پاسخ',
        className: 'border-positive/25 bg-positive/10 text-positive',
    },
    IN_PROGRESS: {
        label: 'در حال بررسی',
        className: 'border-primary/25 bg-primary/10 text-primary',
    },
    RESOLVED: {
        label: 'پاسخ داده شده',
        className: 'border-warning/25 bg-warning/10 text-warning',
    },
    CLOSED: {
        label: 'بسته شده',
        className: 'border-border/70 bg-surface-2 text-muted',
    },
};

export const SUPPORT_CATEGORY_META: Record<SupportRequestCategory, { label: string }> = {
    TECHNICAL: {label: 'مشکل فنی'},
    TRADING: {label: 'معاملات و سفارش'},
    WALLET: {label: 'کیف پول'},
    ACCOUNT: {label: 'حساب کاربری'},
    SUGGESTION: {label: 'پیشنهاد'},
    OTHER: {label: 'سایر'},
};

export const SUPPORT_PRIORITY_META: Record<SupportRequestPriority, MetaItem> = {
    LOW: {
        label: 'کم',
        className: 'border-border/70 bg-surface-2 text-muted',
    },
    MEDIUM: {
        label: 'متوسط',
        className: 'border-primary/20 bg-primary/8 text-primary',
    },
    HIGH: {
        label: 'زیاد',
        className: 'border-warning/25 bg-warning/10 text-warning',
    },
    CRITICAL: {
        label: 'فوری',
        className: 'border-negative/30 bg-negative/10 text-negative',
    },
};

export const SUPPORT_CATEGORY_OPTIONS = Object.entries(SUPPORT_CATEGORY_META).map(([value, meta]) => ({
    value: value as SupportRequestCategory,
    label: meta.label,
}));

export const SUPPORT_PRIORITY_OPTIONS = Object.entries(SUPPORT_PRIORITY_META).map(([value, meta]) => ({
    value: value as SupportRequestPriority,
    label: meta.label,
}));

export const SUPPORT_STATUS_OPTIONS = Object.entries(SUPPORT_STATUS_META).map(([value, meta]) => ({
    value: value as SupportRequestStatus,
    label: meta.label,
}));

export const isTicketRateable = (status: SupportRequestStatus) => status === 'CLOSED';

export const isTicketClosed = (status: SupportRequestStatus) => status === 'CLOSED';

export const canUserReply = (status: SupportRequestStatus) =>
    status === 'OPEN' || status === 'IN_PROGRESS';

export const canCloseTicket = (status: SupportRequestStatus) =>
    status === 'OPEN' || status === 'IN_PROGRESS' || status === 'RESOLVED';

export const CLOSED_BY_LABELS: Record<SupportTicketClosedBy, string> = {
    USER: 'توسط کاربر',
    ADMIN: 'توسط پشتیبانی',
};
