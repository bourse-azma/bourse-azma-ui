import {useEffect, useState} from 'react';
import {Ban, Loader2, ShieldCheck, Trash2, X} from 'lucide-react';
import type {AdminUser} from './types';

export type AdminUserAction = {
    type: 'block' | 'unblock' | 'delete';
    user: AdminUser;
};

export function AdminUserActionModal({action, busy, onCancel, onConfirm}: {
    action: AdminUserAction | null;
    busy: boolean;
    onCancel: () => void;
    onConfirm: (reason?: string) => void | Promise<void>;
}) {
    const [reason, setReason] = useState('');
    useEffect(() => setReason(action?.user.blockedReason ?? ''), [action]);
    if (!action) return null;

    const isDelete = action.type === 'delete';
    const isBlock = action.type === 'block';
    const title = isDelete ? 'حذف حساب کاربر' : isBlock ? 'مسدود کردن کاربر' : 'رفع مسدودی کاربر';
    const description = isDelete
        ? 'حساب کاربر از پنل حذف و دسترسی او فوراً قطع می‌شود. سوابق مالی برای حسابرسی حفظ خواهند شد.'
        : isBlock
            ? 'تمام نشست‌ها و توکن‌های فعال کاربر فوراً باطل و سفارش‌های باز او لغو می‌شوند.'
            : 'کاربر دوباره می‌تواند با نام کاربری و رمز عبور خود وارد سامانه شود.';
    const Icon = isDelete ? Trash2 : isBlock ? Ban : ShieldCheck;
    const color = isDelete ? 'text-negative bg-negative/10' : isBlock ? 'text-warning bg-warning/10' : 'text-positive bg-positive/10';

    return <div className="fixed inset-0 z-[110] grid place-items-center bg-black/65 p-4" onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) onCancel();
    }}>
        <section dir="rtl" role="dialog" aria-modal="true"
                 className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 text-right shadow-2xl">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon
                        className="h-5 w-5"/></div>
                    <div><h2 className="font-black text-text">{title}</h2><p
                        className="mt-1 text-xs leading-6 text-muted">{description}</p></div>
                </div>
                <button type="button" onClick={onCancel} disabled={busy}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2"><X
                    className="h-4 w-4"/></button>
            </div>

            <div className="my-5 rounded-xl border border-border/70 bg-surface-2 p-3"><span
                className="block text-[11px] text-muted">کاربر انتخاب‌شده</span><strong
                className="mt-1 block text-sm">{action.user.firstName} {action.user.lastName}</strong><span dir="ltr"
                                                                                                            className="mt-0.5 block text-right text-xs text-muted">@{action.user.username}</span>
            </div>

            {isBlock ? <label className="block text-xs font-bold text-text">دلیل مسدودی <span
                className="font-normal text-muted">(اختیاری)</span><textarea value={reason} maxLength={500}
                                                                             onChange={event => setReason(event.target.value)}
                                                                             rows={3}
                                                                             placeholder="مثلاً نقض قوانین سامانه"
                                                                             className="mt-2 w-full resize-none rounded-xl border border-border bg-surface-2 p-3 text-right font-normal outline-none focus:border-primary"/></label> : null}

            <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={onCancel} disabled={busy}
                        className="rounded-xl border border-border px-4 py-2.5 text-xs">انصراف
                </button>
                <button type="button" disabled={busy}
                        onClick={() => void onConfirm(isBlock ? reason.trim() : undefined)}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60 ${isDelete ? 'bg-negative' : isBlock ? 'bg-warning' : 'bg-positive'}`}>{busy ?
                    <Loader2 className="h-4 w-4 animate-spin"/> : <Icon
                        className="h-4 w-4"/>}{isDelete ? 'بله، حذف شود' : isBlock ? 'تأیید مسدودسازی' : 'تأیید رفع مسدودی'}</button>
            </div>
        </section>
    </div>;
}
