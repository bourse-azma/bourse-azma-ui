import {ArrowRight, Check, Copy, KeyRound, RefreshCw} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useState} from 'react';
import BourseAzmaLogo from './components/BourseAzmaLogo';
import {appConfig} from './config/appConfig';
import {toApiErrorMessage} from './lib/apiError';
import {withAuthRequest} from './lib/authRequest';
import {USERNAME_VALIDATION_MESSAGE, validatePassword, validateUsername} from './lib/authValidation';
import {isPersianName, normalizePhoneNumber, toEnglishDigits} from './lib/stringUtils';

export type AuthMode = 'login' | 'register';

type AuthPageProps = {
    onAuthenticated: (session: AuthSession) => void;
    initialMode?: AuthMode;
    onBackToLanding?: () => void;
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

type ApiResponse<T> = {
    message?: string;
    result?: T;
};

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

const authInputClassName = 'landing-input w-full rounded-xl px-3 py-2.5 text-sm';
const authButtonSecondaryClassName =
    'inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs font-bold text-white transition hover:border-[#00E5C9]/35';
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
            <span className="text-xs font-semibold text-white/78">
                {title}
                {showRequirement && required ? <span className="mr-1 text-[#FF6B7A]">*</span> : null}
            </span>
        </div>
    );
}

export default function AuthPage({onAuthenticated, initialMode = 'login', onBackToLanding}: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>(initialMode);
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

    useEffect(() => {
        document.body.style.backgroundColor = '#0A1428';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    useEffect(() => {
        setMode(initialMode);
        setError(null);
        setGeneratedPassword(null);
        setGeneratedPasswordConfirmed(false);
        setInitialBalance('');
        setSelectedBalancePreset(null);
    }, [initialMode]);

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
        <div className="landing-shell auth-shell min-h-screen bg-[#0A1428] text-white" dir="rtl">
            <div className="landing-data-grid pointer-events-none fixed inset-0 opacity-20" aria-hidden="true"/>
            <main className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md">
                    {onBackToLanding ? (
                        <button
                            type="button"
                            onClick={onBackToLanding}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-black text-white/78 shadow-[0_16px_45px_-30px_rgba(0,229,201,0.8)] backdrop-blur transition hover:border-[#00E5C9]/40 hover:bg-[#00E5C9]/10 hover:text-white"
                        >
                            <ArrowRight className="h-4 w-4"/>
                            بازگشت به صفحه اصلی
                        </button>
                    ) : null}

                    <section className="auth-card w-full p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center">
                            <BourseAzmaLogo compact/>
                            <p className="mt-3 text-sm font-medium text-[#AFC1D8]">{description}</p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 rounded-xl bg-white/6 p-1 text-sm">
                            <button
                                type="button"
                                onClick={() => handleModeChange('login')}
                                className={`rounded-lg px-3 py-2 font-black transition ${
                                    mode === 'login' ? 'bg-[#00E5C9] text-[#061221] shadow-sm' : 'text-white/65'
                                }`}
                            >
                                ورود
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange('register')}
                                className={`rounded-lg px-3 py-2 font-black transition ${
                                    mode === 'register' ? 'bg-[#00E5C9] text-[#061221] shadow-sm' : 'text-white/65'
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
                                            className={authInputClassName}
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
                                            className={authInputClassName}
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
                                            className={authInputClassName}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel title="کد ملی"/>
                                        <input
                                            name="national-code"
                                            value={nationalCode}
                                            onChange={(event) => setNationalCode(event.target.value)}
                                            placeholder="کد ملی (10 رقم)"
                                            className={authInputClassName}
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
                                            className={authInputClassName}
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
                                            className={authInputClassName}
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
                                                                ? 'border-[#00E5C9]/40 bg-[#00E5C9]/10 text-[#00E5C9]'
                                                                : 'border-white/12 bg-white/6 text-white hover:border-[#00E5C9]/30'
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
                                            className={authInputClassName}
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
                                        className={authInputClassName}
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
                                        className={`min-w-0 flex-1 ${authInputClassName}`}
                                    />
                                    {mode === 'register' ? (
                                        <button
                                            type="button"
                                            onClick={applyGeneratedPassword}
                                            className={authButtonSecondaryClassName}
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
                                            className={authInputClassName}
                                        />
                                    </div>

                                    {generatedPassword ? (
                                        <div className="rounded-xl border border-[#00E5C9]/30 bg-[#00E5C9]/10 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <code dir="ltr"
                                                      className="min-w-0 flex-1 rounded-lg bg-[#071225] px-2 py-1.5 text-xs text-white">
                                                    {generatedPassword}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={() => void copyGeneratedPassword()}
                                                    className={`h-9 w-9 shrink-0 items-center justify-center ${authButtonSecondaryClassName}`}
                                                    aria-label="کپی رمز پیشنهادی"
                                                >
                                                    <Copy className="h-4 w-4"/>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={applyGeneratedPassword}
                                                    className={`h-9 w-9 shrink-0 items-center justify-center ${authButtonSecondaryClassName}`}
                                                    aria-label="ساخت رمز جدید"
                                                >
                                                    <RefreshCw className="h-4 w-4"/>
                                                </button>
                                            </div>
                                            <label
                                                className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-6 text-white/82">
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
                      className="h-5 w-5 rounded-md border border-white/16 bg-[#071225] transition peer-checked:border-[#00E5C9] peer-checked:bg-[#00E5C9]/20"/>
                  <Check
                      className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-[#00E5C9] opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"/>
                </span>
                                        <span className="text-xs font-semibold text-white/82">مرا به خاطر بسپار</span>
                                    </div>
                                </label>
                            ) : null}

                            {error ? (
                                <p className="rounded-xl border border-[#FF6B7A]/40 bg-[#FF6B7A]/10 px-3 py-2 text-sm text-[#FFB4BC]">
                                    {error}
                                </p>
                            ) : null}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="landing-glow-button w-full rounded-xl bg-[#00E5C9] px-4 py-2.5 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? 'در حال پردازش...' : submitLabel}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
