import {useRef, useState} from 'react';
import {AlertCircle, Check, Coins, Loader2, Wallet} from 'lucide-react';
import {toApiErrorMessage} from '../../lib/apiError';
import {withAuthRequest} from '../../lib/authRequest';
import {formatNumberFa} from '../../utils/numberFormat';
import type {AccountSummary} from '../trading/accountSummary';
import type {UserProfile} from '../trading-dashboard/types';
import {computeProjectedBalance, parseWalletAmount, validateWalletAmount, WALLET_ACTIONS} from './walletUtils';
import type {WalletActionType} from './types';

export function WalletTabContent({
                                     userProfile,
                                     accountSummary,
                                     accessToken,
                                     maximumWalletAdjustment,
                                     onProfileUpdated,
                                 }: {
    userProfile?: UserProfile;
    accountSummary: AccountSummary;
    accessToken: string;
    maximumWalletAdjustment: number;
    onProfileUpdated?: (profile: UserProfile) => void;
}) {
    const [actionType, setActionType] = useState<WalletActionType>('ADD');
    const [value, setValue] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingRef = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const currentBalance = accountSummary.customerBalance;
    const {buyingPower, blockedAmount} = accountSummary;
    const parsedValue = parseWalletAmount(value);
    const amountValidationError = value === '' ? null : validateWalletAmount(value, maximumWalletAdjustment);
    const displayedError = error ?? amountValidationError;
    const projectedBalance =
        parsedValue !== null
            ? computeProjectedBalance(currentBalance, actionType, parsedValue)
            : null;

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submittingRef.current) return;
        setError(null);
        setSuccess(null);
        if (!value || amountValidationError || parsedValue === null) {
            setError(amountValidationError ?? 'مبلغ باید عدد صحیح مثبت باشد.');
            return;
        }
        if (actionType === 'SUBTRACT' && parsedValue > buyingPower) {
            setError('مبلغ برداشت از قدرت خرید شما بیشتر است. بخشی از موجودی در سفارش‌های باز بلوکه شده است.');
            return;
        }
        if (projectedBalance !== null && projectedBalance < 0) {
            setError('این عملیات موجودی را منفی می‌کند. مبلغ را کاهش دهید.');
            return;
        }

        submittingRef.current = true;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/v1/wallet/adjust', withAuthRequest(accessToken, {
                method: 'POST',
                body: JSON.stringify({
                    type: actionType,
                    value: parsedValue,
                    description: description.trim() || undefined,
                }),
            }));
            const data = await res.json();
            if (!res.ok) {
                throw new Error(toApiErrorMessage(data, 'خطا در انجام عملیات'));
            }
            if (data.result && onProfileUpdated) {
                onProfileUpdated(data.result);
            }
            setSuccess('موجودی با موفقیت به‌روزرسانی شد.');
            setValue('');
            setDescription('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'خطا در ثبت تغییرات');
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            <div
                className="relative overflow-hidden rounded-3xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.98))] p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(15,23,42,0.98))]">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_42%)]"/>
                <div
                    className="pointer-events-none absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-slate-900/5 blur-2xl dark:bg-white/5"/>
                <div
                    className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"/>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div
                                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-1 text-[10px] text-muted">
                                <Wallet className="h-3.5 w-3.5 text-emerald-600"/>
                                کیف پول
                            </div>
                            <div className="mt-3 text-sm font-semibold text-text">
                                {userProfile?.firstName} {userProfile?.lastName}
                            </div>
                            <div className="mt-1 text-[10px] text-muted" dir="ltr">
                                @{userProfile?.username}
                            </div>
                        </div>
                        <div
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-surface text-emerald-600">
                            <Wallet className="h-4 w-4"/>
                        </div>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-border/70 bg-surface/90 px-4 py-3">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted">مانده مشتری</span>
                            <span className="font-semibold tabular-nums text-text">
                                {currentBalance.toLocaleString('en-US')} ریال
                            </span>
                        </div>
                        {blockedAmount > 0 ? (
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="text-muted">بلوکه شده</span>
                                <span className="font-semibold tabular-nums text-text">
                                    {blockedAmount.toLocaleString('en-US')} ریال
                                </span>
                            </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
                            <span className="text-[11px] text-muted">قدرت خرید</span>
                            <div className="min-w-0 text-left tabular-nums">
                                <div
                                    className="break-all text-xl font-black leading-tight tracking-tight text-text sm:text-2xl">
                                    {buyingPower.toLocaleString('en-US')} <span
                                    className="text-xs font-semibold text-muted">ریال</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleAdjust}
                  className="space-y-3 rounded-3xl border border-border/70 bg-surface/90 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-text">مدیریت موجودی</h4>
                        <p className="mt-1 text-[11px] text-muted">واریز یا برداشت از کیف پول</p>
                    </div>
                    <span
                        className="rounded-full border border-border/70 bg-surface-2 px-2.5 py-1 text-[10px] text-muted">ریال</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    {WALLET_ACTIONS.map((action) => {
                        const active = actionType === action.type;
                        const isNegativeAction = action.type === 'SUBTRACT';
                        return (
                            <button
                                key={action.type}
                                type="button"
                                title={action.hint}
                                onClick={() => {
                                    setActionType(action.type);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className={`rounded-xl border px-2 py-2 text-[10px] font-semibold transition ${
                                    active
                                        ? isNegativeAction
                                            ? 'border-negative/40 bg-negative/10 text-negative'
                                            : 'border-primary/40 bg-primary/10 text-primary'
                                        : 'border-border/70 bg-surface-2 text-muted hover:border-primary/25 hover:text-text'
                                }`}
                            >
                                {action.label}
                            </button>
                        );
                    })}
                </div>

                <div>
                    <label className="mb-1 block text-[10px] text-muted">مبلغ (ریال)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(null);
                            setSuccess(null);
                        }}
                        placeholder="مثلا 20000000"
                        required
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text tabular-nums focus:border-primary/45"
                    />
                    {parsedValue !== null ? (
                        <div className="mt-1.5 text-[10px] text-muted">
                            معادل تومان: {(parsedValue / 10).toLocaleString('en-US')}
                        </div>
                    ) : null}
                    <div className="mt-1.5 text-[10px] text-muted">
                        سقف هر تراکنش: {formatNumberFa(maximumWalletAdjustment)} ریال
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {[1_000_000, 10_000_000, 100_000_000, 1_000_000_000].map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => {
                                setValue(String(preset));
                                setError(null);
                                setSuccess(null);
                            }}
                            className="rounded-lg border border-border/70 bg-surface-2 px-2.5 py-1 text-[10px] text-text transition hover:border-primary/35"
                        >
                            {formatNumberFa(preset)}
                        </button>
                    ))}
                </div>

                {projectedBalance !== null ? (
                    <div
                        className={`rounded-xl border px-3 py-2 text-[10px] ${
                            projectedBalance < 0
                                ? 'border-negative/35 bg-negative/8 text-negative'
                                : 'border-border/70 bg-surface-2 text-muted'
                        }`}
                    >
                        <span className="text-muted">موجودی پس از عملیات: </span>
                        <span className="font-bold text-text tabular-nums">
                            {projectedBalance.toLocaleString('en-US')} ریال
                        </span>
                    </div>
                ) : null}

                <div>
                    <label className="mb-1 block text-[10px] text-muted">توضیحات (اختیاری)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="مثلا واریز سود مجمع یا اصلاح موجودی"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text"
                    />
                </div>

                {displayedError ? (
                    <div
                        className="flex items-start gap-1.5 rounded-xl border border-negative/30 bg-negative/8 px-2.5 py-2 text-[10px] text-negative">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
                        <span>{displayedError}</span>
                    </div>
                ) : null}
                {success ? (
                    <div
                        className="flex items-start gap-1.5 rounded-xl border border-positive/30 bg-positive/8 px-2.5 py-2 text-[10px] text-positive">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
                        <span>{success}</span>
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={isSubmitting || Boolean(amountValidationError) || (projectedBalance !== null && projectedBalance < 0)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-text py-2 text-xs font-bold text-surface transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Coins className="h-3.5 w-3.5"/>}
                    {isSubmitting ? 'در حال ثبت...' : 'ثبت تراکنش'}
                </button>
            </form>
        </div>
    );
}
