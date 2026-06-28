import {Check, Copy, KeyRound, RefreshCw} from 'lucide-react';
import {FormEvent, useMemo, useState} from 'react';
import {appConfig} from './config/appConfig';
import {withAuthRequest} from './lib/authRequest';
import {USERNAME_VALIDATION_MESSAGE, validatePassword, validateUsername} from './lib/authValidation';

type AuthMode = 'login' | 'register';

type AuthPageProps = {
    onAuthenticated: (session: AuthSession) => void;
};

type AuthTokenResult = {
    accessToken?: string | null;
    userId: number;
    role: string;
};

export type AuthSession = {
    accessToken?: string;
    userId: number;
    role: string;
    rememberMe?: boolean;
};

type ApiErrorResult = {
    detail?: string;
    errors?: Record<string, string>;
};

type ApiResponse<T> = {
    message?: string;
    result?: T;
};

const toEnglishDigits = (value: string) =>
    value
        .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const normalizePhoneNumber = (raw: string) => {
    const value = toEnglishDigits(raw).replace(/\s+/g, '');
    if (value.startsWith('+98')) return value;
    if (value.startsWith('98')) return `+${value}`;
    if (value.startsWith('09') && value.length === 11) return `+98${value.slice(1)}`;
    return value;
};

const persianNamePattern = /^[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+$/;

const isPersianName = (value: string) => persianNamePattern.test(value.trim());

const generateStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%^&*_-+=?';
    const groups = [upper, lower, digits, symbols];
    const all = groups.join('');
    const randomIndex = (max: number) => {
        const maxUnbiased = Math.floor(0x1_0000_0000 / max) * max;
        const buffer = new Uint32Array(1);
        do {
            crypto.getRandomValues(buffer);
        } while (buffer[0] >= maxUnbiased);
        return buffer[0] % max;
    };
    const chars = groups.map((group) => group[randomIndex(group.length)]);
    while (chars.length < 16) {
        chars.push(all[randomIndex(all.length)]);
    }
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
};

const firstErrorMessage = (errors?: Record<string, string>) => {
    if (!errors) return null;
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return null;
    const message = errors[firstKey];
    return typeof message === 'string' && message.trim() !== '' ? message : null;
};

const toApiErrorMessage = (data: unknown, fallback: string) => {
    if (!data || typeof data !== 'object') return fallback;

    const response = data as ApiResponse<ApiErrorResult>;
    const detail = response.result?.detail;
    if (typeof detail === 'string' && detail.trim() !== '') {
        return detail;
    }

    const firstFieldError = firstErrorMessage(response.result?.errors);
    if (firstFieldError) {
        return firstFieldError;
    }

    if (typeof response.message === 'string' && response.message.trim() !== '') {
        return response.message;
    }

    return fallback;
};

const loginDescription = 'با نام کاربری یا ایمیل وارد شوید.';
const registerDescription = 'حساب جدید بسازید و مستقیم وارد داشبورد شوید.';

const INITIAL_BALANCE_PRESETS = [
    {value: 10_000_000, label: '۱۰ میلیون'},
    {value: 50_000_000, label: '۵۰ میلیون'},
    {value: 100_000_000, label: '۱۰۰ میلیون'},
] as const;

const parseInitialBalanceInput = (raw: string): number | null => {
    const normalized = toEnglishDigits(raw).replace(/[,\s]/g, '').trim();
    if (normalized === '') {
        return null;
    }
    if (!/^\d+$/.test(normalized)) {
        return Number.NaN;
    }
    return Number(normalized);
};

type FieldLabelProps = {
    title: string;
    required?: boolean;
    showRequirement?: boolean;
};

function FieldLabel({title, required = false, showRequirement = true}: FieldLabelProps) {
    return (
        <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-xs font-semibold text-text">
        {title}
          {showRequirement && required ? <span className="mr-1 text-negative">*</span> : null}
      </span>
        </div>
    );
}

export default function AuthPage({onAuthenticated}: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [generatedPasswordConfirmed, setGeneratedPasswordConfirmed] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nationalCode, setNationalCode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [selectedBalancePreset, setSelectedBalancePreset] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const description = useMemo(
        () => (mode === 'login' ? loginDescription : registerDescription),
        [mode]
    );

    const submitLabel = mode === 'login' ? 'ورود' : 'ثبت نام';

    const handleModeChange = (nextMode: AuthMode) => {
        setMode(nextMode);
        setError(null);
        setGeneratedPassword(null);
        setGeneratedPasswordConfirmed(false);
        setInitialBalance('');
        setSelectedBalancePreset(null);
    };

    const applyGeneratedPassword = () => {
        const nextPassword = generateStrongPassword();
        setPassword(nextPassword);
        setPasswordConfirmation(nextPassword);
        setGeneratedPassword(nextPassword);
        setGeneratedPasswordConfirmed(false);
        setError(null);
    };

    const copyGeneratedPassword = async () => {
        if (!generatedPassword) return;
        await navigator.clipboard?.writeText(generatedPassword);
    };

    const submitAuthRequest = async (endpoint: 'login' | 'register', payload: unknown) => {
        const response = await fetch(`${appConfig.authApiBaseUrl}/${endpoint}`, withAuthRequest(null, {
            method: 'POST',
            body: JSON.stringify(payload),
        }));

        const text = await response.text();
        let data: unknown = null;
        if (text) {
            try {
                data = JSON.parse(text) as unknown;
            } catch {
                data = null;
            }
        }

        if (!response.ok) {
            throw new Error(toApiErrorMessage(data, 'درخواست ناموفق بود.'));
        }

        if (!data || typeof data !== 'object') {
            throw new Error('پاسخ سرویس احراز هویت معتبر نیست.');
        }

        const apiResponse = data as ApiResponse<AuthTokenResult>;
        const userId = apiResponse.result?.userId;
        const role = apiResponse.result?.role;

        if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
            throw new Error('شناسه کاربر دریافت نشد.');
        }
        if (typeof role !== 'string' || role.trim() === '') {
            throw new Error('نقش کاربر دریافت نشد.');
        }

        return {
            accessToken: '',
            userId,
            role,
        } satisfies AuthSession;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const trimmedPassword = password.trim();
            if (mode === 'login') {
                const session = await submitAuthRequest('login', {
                    identifier: identifier.trim(),
                    password: trimmedPassword,
                    rememberMe,
                });
                onAuthenticated({...session, rememberMe});
                return;
            }

            if (!isPersianName(firstName) || !isPersianName(lastName)) {
                throw new Error('نام و نام خانوادگی باید فقط با حروف فارسی وارد شوند.');
            }

            const usernameError = validateUsername(username);
            if (usernameError) {
                throw new Error(usernameError);
            }

            const passwordError = validatePassword(trimmedPassword);
            if (passwordError) {
                throw new Error(passwordError);
            }

            if (trimmedPassword !== passwordConfirmation.trim()) {
                throw new Error('رمز عبور و تکرار آن یکسان نیستند.');
            }

            if (generatedPassword && trimmedPassword === generatedPassword && !generatedPasswordConfirmed) {
                throw new Error('برای استفاده از رمز پیشنهادی، ابتدا تأیید کنید که آن را در جای امن نگه داشته‌اید.');
            }

            const parsedBalance = parseInitialBalanceInput(initialBalance);
            if (parsedBalance !== null && (!Number.isFinite(parsedBalance) || parsedBalance < 0)) {
                throw new Error('موجودی اولیه باید عددی معتبر و بزرگ‌تر یا مساوی صفر باشد.');
            }

            const session = await submitAuthRequest('register', {
                username: username.trim().toLowerCase(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                nationalCode: toEnglishDigits(nationalCode).trim(),
                phoneNumber: normalizePhoneNumber(phoneNumber),
                email: toEnglishDigits(email).trim().toLowerCase(),
                password: trimmedPassword,
                ...(parsedBalance !== null ? {balance: parsedBalance} : {}),
            });
            onAuthenticated({...session, rememberMe: false});
        } catch (requestError) {
            const message =
                requestError instanceof Error ? requestError.message : 'خطایی در احراز هویت رخ داد.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center p-4 sm:p-6">
            <section className="w-full max-w-md rounded-2xl border border-border/70 bg-surface p-6 shadow-card sm:p-8">
                <h1 className="text-center text-2xl font-black text-text">بورس آزما</h1>
                <p className="mt-2 text-center text-sm text-muted">{description}</p>

                <div className="mt-6 grid grid-cols-2 rounded-xl bg-surface-2 p-1 text-sm">
                    <button
                        type="button"
                        onClick={() => handleModeChange('login')}
                        className={`rounded-lg px-3 py-2 transition ${
                            mode === 'login' ? 'bg-primary text-white shadow-sm' : 'text-muted'
                        }`}
                    >
                        ورود
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeChange('register')}
                        className={`rounded-lg px-3 py-2 transition ${
                            mode === 'register' ? 'bg-primary text-white shadow-sm' : 'text-muted'
                        }`}
                    >
                        ثبت نام
                    </button>
                </div>

                <form className="mt-5 space-y-3" onSubmit={handleSubmit} autoComplete="on">
                    {mode === 'register' ? (
                        <>
                            <div>
                                <FieldLabel title="نام کاربری" required/>
                                <input
                                    name="username"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    placeholder="نام کاربری (انگلیسی)"
                                    required
                                    minLength={3}
                                    maxLength={50}
                                    pattern="[A-Za-z0-9._-]{3,50}"
                                    title={USERNAME_VALIDATION_MESSAGE}
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>
                            <div>
                                <FieldLabel title="نام" required/>
                                <input
                                    name="given-name"
                                    autoComplete="given-name"
                                    pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                                    title="نام باید فقط با حروف فارسی وارد شود."
                                    value={firstName}
                                    onChange={(event) => setFirstName(event.target.value)}
                                    placeholder="نام"
                                    required
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>
                            <div>
                                <FieldLabel title="نام خانوادگی" required/>
                                <input
                                    name="family-name"
                                    autoComplete="family-name"
                                    pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                                    title="نام خانوادگی باید فقط با حروف فارسی وارد شود."
                                    value={lastName}
                                    onChange={(event) => setLastName(event.target.value)}
                                    placeholder="نام خانوادگی"
                                    required
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>
                            <div>
                                <FieldLabel title="کد ملی"/>
                                <input
                                    name="national-code"
                                    value={nationalCode}
                                    onChange={(event) => setNationalCode(event.target.value)}
                                    placeholder="کد ملی (10 رقم)"
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>
                            <div>
                                <FieldLabel title="شماره موبایل"/>
                                <input
                                    name="tel"
                                    autoComplete="tel"
                                    value={phoneNumber}
                                    onChange={(event) => setPhoneNumber(event.target.value)}
                                    placeholder="شماره موبایل (مثل 0912... یا +98912...)"
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>
                            <div>
                                <FieldLabel title="ایمیل"/>
                                <input
                                    name="email"
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="ایمیل"
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>
                            <div>
                                <FieldLabel title="موجودی اولیه کیف پول (ریال)"/>
                                <div className="mb-2 grid grid-cols-3 gap-1.5">
                                    {INITIAL_BALANCE_PRESETS.map((preset) => {
                                        const isSelected = selectedBalancePreset === preset.value;
                                        return (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => {
                                                    setInitialBalance(String(preset.value));
                                                    setSelectedBalancePreset(preset.value);
                                                    setError(null);
                                                }}
                                                className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                                                    isSelected
                                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                                        : 'border-border bg-surface-2 text-text hover:border-primary/30'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <input
                                    name="initial-balance"
                                    inputMode="numeric"
                                    value={initialBalance}
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setInitialBalance(nextValue);
                                        const parsed = parseInitialBalanceInput(nextValue);
                                        setSelectedBalancePreset(
                                            parsed !== null && INITIAL_BALANCE_PRESETS.some((item) => item.value === parsed)
                                                ? parsed
                                                : null,
                                        );
                                    }}
                                    placeholder="مبلغ به ریال"
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <FieldLabel title="نام کاربری یا ایمیل" required showRequirement={false}/>
                            <input
                                name="username"
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck={false}
                                value={identifier}
                                onChange={(event) => setIdentifier(event.target.value)}
                                placeholder="نام کاربری یا ایمیل"
                                required
                                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                            />
                        </div>
                    )}

                    <div>
                        <FieldLabel title="رمز عبور" required showRequirement={mode === 'register'}/>
                        <div className="flex gap-2">
                            <input
                                name="password"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    setGeneratedPasswordConfirmed(false);
                                }}
                                type="password"
                                placeholder="رمز عبور"
                                required
                                minLength={8}
                                maxLength={24}
                                pattern={mode === 'register' ? '^(?=.*[A-Za-z])(?=.*\\d).+$' : undefined}
                                title={mode === 'register' ? 'رمز عبور باید بین ۸ تا ۲۴ کاراکتر و حداقل شامل یک حرف و یک عدد باشد.' : undefined}
                                className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                            />
                            {mode === 'register' ? (
                                <button
                                    type="button"
                                    onClick={applyGeneratedPassword}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-text transition hover:border-primary/60"
                                >
                                    <KeyRound className="h-4 w-4"/>
                                    ساخت رمز
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {mode === 'register' ? (
                        <>
                            <div>
                                <FieldLabel title="تأیید رمز عبور" required/>
                                <input
                                    name="password-confirmation"
                                    autoComplete="new-password"
                                    value={passwordConfirmation}
                                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                                    type="password"
                                    placeholder="تکرار رمز عبور"
                                    required
                                    minLength={8}
                                    maxLength={24}
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                />
                            </div>

                            {generatedPassword ? (
                                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <code dir="ltr"
                                              className="min-w-0 flex-1 rounded-lg bg-bg px-2 py-1.5 text-xs text-text">
                                            {generatedPassword}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => void copyGeneratedPassword()}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text"
                                            aria-label="کپی رمز پیشنهادی"
                                        >
                                            <Copy className="h-4 w-4"/>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={applyGeneratedPassword}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text"
                                            aria-label="ساخت رمز جدید"
                                        >
                                            <RefreshCw className="h-4 w-4"/>
                                        </button>
                                    </div>
                                    <label
                                        className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-6 text-text">
                                        <input
                                            type="checkbox"
                                            checked={generatedPasswordConfirmed}
                                            onChange={(event) => setGeneratedPasswordConfirmed(event.target.checked)}
                                            className="mt-1"
                                        />
                                        <span>رمز پیشنهادی را ذخیره کرده‌ام و برای ورودهای بعدی به آن دسترسی دارم.</span>
                                    </label>
                                </div>
                            ) : null}
                        </>
                    ) : null}

                    {mode === 'login' ? (
                        <label className="group flex cursor-pointer items-center justify-between px-1 py-1.5">
                            <div className="flex items-center gap-2">
                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                  <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="peer sr-only"
                  />
                  <span
                      className="h-5 w-5 rounded-md border border-border bg-bg transition peer-checked:border-primary peer-checked:bg-primary/20"/>
                  <Check
                      className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-primary opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"/>
                </span>
                                <span className="text-xs font-semibold text-text">مرا به خاطر بسپار</span>
                            </div>
                        </label>
                    ) : null}

                    {error ? (
                        <p className="rounded-xl border border-negative/40 bg-negative/10 px-3 py-2 text-sm text-negative">
                            {error}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'در حال پردازش...' : submitLabel}
                    </button>
                </form>
            </section>
        </main>
    );
}
