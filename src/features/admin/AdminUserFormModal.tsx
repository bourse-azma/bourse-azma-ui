import {type FormEvent, useEffect, useState} from 'react';
import {Loader2, X} from 'lucide-react';
import type {AdminUser, AdminUserFormValues} from './types';

const emptyForm: AdminUserFormValues = {
    username: '', firstName: '', lastName: '', nationalCode: '', phoneNumber: '',
    email: '', password: '', balance: 0,
};

export function AdminUserFormModal({open, user, onClose, onSubmit}: {
    open: boolean;
    user: AdminUser | null;
    onClose: () => void;
    onSubmit: (values: AdminUserFormValues) => Promise<void>;
}) {
    const [form, setForm] = useState<AdminUserFormValues>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const editing = user !== null;

    useEffect(() => {
        if (!open) return;
        setForm(user ? {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            nationalCode: user.nationalCode ?? '',
            phoneNumber: user.phoneNumber ?? '',
            email: user.email ?? '',
            password: '',
            balance: user.balance,
        } : emptyForm);
        setError(null);
    }, [open, user]);

    if (!open) return null;
    const update = <K extends keyof AdminUserFormValues>(key: K, value: AdminUserFormValues[K]) =>
        setForm(current => ({...current, [key]: value}));
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit(form);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'ذخیره اطلاعات ناموفق بود.');
        } finally {
            setSubmitting(false);
        }
    };

    const fields: Array<{ key: keyof AdminUserFormValues; label: string; type?: string; placeholder?: string }> = [
        {key: 'firstName', label: 'نام'}, {key: 'lastName', label: 'نام خانوادگی'},
        {key: 'username', label: 'نام کاربری', placeholder: 'username'},
        {key: 'nationalCode', label: 'کد ملی', placeholder: '۱۰ رقم'},
        {key: 'phoneNumber', label: 'شماره موبایل', placeholder: '+989123456789'},
        {key: 'email', label: 'ایمیل', type: 'email'},
        {key: 'password', label: editing ? 'رمز جدید (اختیاری)' : 'رمز عبور', type: 'password'},
    ];

    return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onMouseDown={e => {
        if (e.target === e.currentTarget && !submitting) onClose();
    }}>
        <section dir="rtl"
                 className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-right shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
                <div><h2 className="font-black">{editing ? 'ویرایش کاربر' : 'ثبت کاربر جدید'}</h2><p
                    className="text-xs text-muted">اطلاعات حساب کاربری را وارد کنید.</p></div>
                <button type="button" onClick={onClose} disabled={submitting}
                        className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2"><X className="h-4 w-4"/>
                </button>
            </div>
            <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map(field => <label key={field.key} className="text-xs font-bold text-text">{field.label}<input
                    required={field.key === 'username' || field.key === 'firstName' || field.key === 'lastName' || (!editing && field.key === 'password')}
                    type={field.type ?? 'text'} value={String(form[field.key])} placeholder={field.placeholder}
                    onChange={e => update(field.key, e.target.value as never)}
                    dir={['username', 'nationalCode', 'phoneNumber', 'email', 'password'].includes(field.key) ? 'ltr' : 'rtl'}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-right font-normal outline-none focus:border-primary"/></label>)}
                {!editing ?
                    <label className="text-xs font-bold text-text">موجودی اولیه<input required min={0} type="number"
                                                                                      value={form.balance}
                                                                                      onChange={e => update('balance', Number(e.target.value))}
                                                                                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-right font-normal outline-none focus:border-primary"/></label> : null}
                {error ? <div
                    className="sm:col-span-2 rounded-xl bg-negative/10 p-3 text-xs text-negative">{error}</div> : null}
                <div className="flex justify-end gap-2 sm:col-span-2">
                    <button type="button" onClick={onClose} disabled={submitting}
                            className="rounded-xl border border-border px-4 py-2.5 text-xs">انصراف
                    </button>
                    <button disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">{submitting ?
                        <Loader2
                            className="h-4 w-4 animate-spin"/> : null}{editing ? 'ذخیره تغییرات' : 'ثبت کاربر'}</button>
                </div>
            </form>
        </section>
    </div>;
}
