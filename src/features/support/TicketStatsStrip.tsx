import {formatNumberFa} from '../../utils/numberFormat';
import type {AdminTicketStats, UserTicketStats} from './supportStats';

type StatCardProps = {
    label: string;
    value: number;
    tone?: 'default' | 'primary' | 'warning' | 'muted';
};

function StatCard({label, value, tone = 'default'}: StatCardProps) {
    const toneClass =
        tone === 'primary'
            ? 'border-primary/20 bg-primary/5 text-primary'
            : tone === 'warning'
                ? 'border-warning/20 bg-warning/5 text-warning'
                : tone === 'muted'
                    ? 'border-border/60 bg-surface-2 text-muted'
                    : 'border-border/60 bg-surface text-text';

    return (
        <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
            <p className="text-[10px] opacity-80">{label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">{formatNumberFa(value)}</p>
        </div>
    );
}

export function UserTicketStatsStrip({stats}: { stats: UserTicketStats }) {
    return (
        <div
            className="grid grid-cols-2 gap-2 border-b border-border/50 bg-surface-2/30 px-4 py-3 sm:grid-cols-4 sm:px-5">
            <StatCard label="کل تیکت‌ها" value={stats.total}/>
            <StatCard label="در انتظار بررسی" value={stats.awaiting} tone="primary"/>
            <StatCard label="در حال بررسی" value={stats.inProgress} tone="warning"/>
            <StatCard label="بسته شده" value={stats.closed} tone="muted"/>
        </div>
    );
}

export function AdminTicketStatsStrip({stats}: { stats: AdminTicketStats }) {
    return (
        <div className="grid grid-cols-3 gap-2 border-b border-border/50 bg-surface-2/30 px-4 py-3 sm:px-5">
            <StatCard label="در انتظار بررسی" value={stats.awaiting} tone="primary"/>
            <StatCard label="در حال بررسی" value={stats.inProgress} tone="warning"/>
            <StatCard label="بسته شده" value={stats.closed} tone="muted"/>
        </div>
    );
}
