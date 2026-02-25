import { Check } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { appConfig } from './config/appConfig';

type AuthMode = 'login' | 'register';

type AuthPageProps = {
  onAuthenticated: (session: AuthSession) => void;
};

type AuthTokenResult = {
  accessToken: string;
  userId: number;
  role: string;
};

export type AuthSession = {
  accessToken: string;
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

type FieldLabelProps = {
  title: string;
  required?: boolean;
  showRequirement?: boolean;
};

function FieldLabel({ title, required = false, showRequirement = true }: FieldLabelProps) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-xs font-semibold text-text">
        {title}
        {showRequirement && required ? <span className="mr-1 text-negative">*</span> : null}
      </span>
    </div>
  );
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
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
  };

  const submitAuthRequest = async (endpoint: 'login' | 'register', payload: unknown) => {
    const response = await fetch(`${appConfig.authApiBaseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

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
    const accessToken = apiResponse.result?.accessToken;
    const userId = apiResponse.result?.userId;
    const role = apiResponse.result?.role;

    if (typeof accessToken !== 'string' || accessToken.trim() === '') {
      throw new Error('توکن ورود دریافت نشد.');
    }
    if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
      throw new Error('شناسه کاربر دریافت نشد.');
    }
    if (typeof role !== 'string' || role.trim() === '') {
      throw new Error('نقش کاربر دریافت نشد.');
    }

    return {
      accessToken,
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
        });
        onAuthenticated({ ...session, rememberMe });
        return;
      }

      const session = await submitAuthRequest('register', {
        username: username.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalCode: toEnglishDigits(nationalCode).trim(),
        phoneNumber: normalizePhoneNumber(phoneNumber),
        email: toEnglishDigits(email).trim().toLowerCase(),
        password: trimmedPassword,
      });
      onAuthenticated(session);
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

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <>
              <div>
                <FieldLabel title="نام کاربری" required />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="نام کاربری (انگلیسی)"
                  required
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              </div>
              <div>
                <FieldLabel title="نام" required />
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="نام"
                  required
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              </div>
              <div>
                <FieldLabel title="نام خانوادگی" required />
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="نام خانوادگی"
                  required
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              </div>
              <div>
                <FieldLabel title="کد ملی" />
                <input
                  value={nationalCode}
                  onChange={(event) => setNationalCode(event.target.value)}
                  placeholder="کد ملی (۱۰ رقم)"
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              </div>
              <div>
                <FieldLabel title="شماره موبایل" />
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="شماره موبایل (مثل 0912... یا +98912...)"
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              </div>
              <div>
                <FieldLabel title="ایمیل" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ایمیل"
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              </div>
            </>
          ) : (
            <div>
              <FieldLabel title="نام کاربری یا ایمیل" required showRequirement={false} />
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="نام کاربری یا ایمیل"
                required
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </div>
          )}

          <div>
            <FieldLabel title="رمز عبور" required showRequirement={mode === 'register'} />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="رمز عبور"
              required
              minLength={8}
              maxLength={24}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
            />
          </div>

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
                  <span className="h-5 w-5 rounded-md border border-border bg-bg transition peer-checked:border-primary peer-checked:bg-primary/20" />
                  <Check className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-primary opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100" />
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
