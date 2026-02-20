import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthPage, { type AuthSession } from './AuthPage';
import TradingDashboard from './TradingDashboard';
import { appConfig } from './config/appConfig';
import { useTheme } from './hooks/useTheme';

const SESSION_STORAGE_KEY = 'boors-azma-session';
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'boors-azma-access-token';

type SessionState = {
  accessToken: string;
  userId: number;
  role: string;
};

type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  phoneNumber: string;
  email: string;
  role: string;
};

type ApiResponse<T> = {
  message?: string;
  result?: T;
};

type ApiErrorResult = {
  detail?: string;
  errors?: Record<string, string>;
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
  if (typeof detail === 'string' && detail.trim() !== '') return detail;
  const firstFieldError = firstErrorMessage(response.result?.errors);
  if (firstFieldError) return firstFieldError;
  if (typeof response.message === 'string' && response.message.trim() !== '') return response.message;
  return fallback;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

const tryExtractUserIdFromToken = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadText = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadText) as { sub?: string };
    const raw = payload.sub;
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
};

const getInitialSession = (): SessionState | null => {
  if (typeof window === 'undefined') return null;

  const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession) as SessionState;
      if (
        typeof parsed.accessToken === 'string' &&
        parsed.accessToken.trim() !== '' &&
        typeof parsed.userId === 'number' &&
        Number.isFinite(parsed.userId) &&
        parsed.userId > 0 &&
        typeof parsed.role === 'string' &&
        parsed.role.trim() !== ''
      ) {
        return parsed;
      }
    } catch {
      // Ignore invalid localStorage content.
    }
  }

  const legacyToken = window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
  if (!legacyToken || legacyToken.trim() === '') {
    return null;
  }
  const userId = tryExtractUserIdFromToken(legacyToken);
  if (!userId) {
    return null;
  }
  return {
    accessToken: legacyToken,
    userId,
    role: 'USER',
  };
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<SessionState | null>(getInitialSession);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editNationalCode, setEditNationalCode] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
    setSession(null);
    setProfile(null);
    setProfileModalOpen(false);
    setProfileEditMode(false);
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  const fetchProfile = useCallback(async (targetSession: SessionState) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await fetch(`/api/v1/users/${targetSession.userId}`, {
        headers: {
          Authorization: `Bearer ${targetSession.accessToken}`,
        },
      });
      const text = await response.text();
      const data = text ? (JSON.parse(text) as unknown) : null;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(data, 'دریافت اطلاعات پروفایل ناموفق بود.'));
      }
      const api = data as ApiResponse<UserProfile>;
      if (!api.result) {
        throw new Error('پاسخ پروفایل معتبر نیست.');
      }
      setProfile(api.result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'دریافت اطلاعات پروفایل با خطا مواجه شد.';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
    void fetchProfile(session);
  }, [fetchProfile, session]);

  const handleAuthenticated = useCallback((authSession: AuthSession) => {
    setSession({
      accessToken: authSession.accessToken,
      userId: authSession.userId,
      role: authSession.role,
    });
  }, []);

  const handleLogout = useCallback(() => {
    const currentSession = session;
    clearSession();
    if (!currentSession) return;
    void fetch(`${appConfig.authApiBaseUrl}/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentSession.accessToken}`,
      },
    }).catch(() => undefined);
  }, [clearSession, session]);

  const displayName = useMemo(() => {
    if (!profile) return 'پروفایل کاربری';
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    return fullName === '' ? 'پروفایل کاربری' : fullName;
  }, [profile]);

  const openProfileModal = useCallback(() => {
    if (profile) {
      setEditFirstName(profile.firstName);
      setEditLastName(profile.lastName);
      setEditNationalCode(profile.nationalCode);
      setEditPhoneNumber(profile.phoneNumber);
      setEditEmail(profile.email);
      setEditPassword('');
    }
    setSaveError(null);
    setSaveSuccess(null);
    setProfileModalOpen(true);
    setProfileEditMode(false);
  }, [profile]);

  const submitProfileUpdate = async () => {
    if (!session || !profile) return;
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    const payload = {
      id: profile.id,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      nationalCode: toEnglishDigits(editNationalCode).trim(),
      phoneNumber: normalizePhoneNumber(editPhoneNumber),
      email: toEnglishDigits(editEmail).trim().toLowerCase(),
      password: editPassword.trim() === '' ? null : editPassword.trim(),
    };

    try {
      const response = await fetch('/api/v1/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      const data = text ? (JSON.parse(text) as unknown) : null;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(data, 'ویرایش پروفایل انجام نشد.'));
      }
      const api = data as ApiResponse<UserProfile>;
      if (!api.result) {
        throw new Error('پاسخ ویرایش پروفایل معتبر نیست.');
      }
      setProfile(api.result);
      setSaveSuccess('اطلاعات پروفایل با موفقیت ذخیره شد.');
      setProfileEditMode(false);
      setEditPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در ویرایش پروفایل.';
      setSaveError(message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-bg text-text font-sans transition-colors duration-300">
      {session ? (
        <TradingDashboard
          theme={theme}
          onToggleTheme={toggleTheme}
          profileDisplayName={displayName}
          onOpenProfile={openProfileModal}
          onLogout={handleLogout}
        />
      ) : (
        <AuthPage onAuthenticated={handleAuthenticated} />
      )}

      {profileModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4">
          <section className="w-full max-w-lg rounded-2xl border border-border/80 bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-text">پروفایل کاربری</h2>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-muted transition hover:text-text"
              >
                بستن
              </button>
            </div>

            {profileLoading ? <p className="text-sm text-muted">در حال دریافت اطلاعات...</p> : null}
            {profileError ? <p className="text-sm text-negative">{profileError}</p> : null}

            {profile ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={editFirstName}
                    onChange={(event) => setEditFirstName(event.target.value)}
                    disabled={!profileEditMode}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                    placeholder="نام"
                  />
                  <input
                    value={editLastName}
                    onChange={(event) => setEditLastName(event.target.value)}
                    disabled={!profileEditMode}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                    placeholder="نام خانوادگی"
                  />
                </div>

                <input
                  value={editNationalCode}
                  onChange={(event) => setEditNationalCode(event.target.value)}
                  disabled={!profileEditMode}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                  placeholder="کد ملی"
                />
                <input
                  value={editPhoneNumber}
                  onChange={(event) => setEditPhoneNumber(event.target.value)}
                  disabled={!profileEditMode}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                  placeholder="شماره موبایل"
                />
                <input
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  disabled={!profileEditMode}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                  placeholder="ایمیل"
                />
                {profileEditMode ? (
                  <input
                    value={editPassword}
                    onChange={(event) => setEditPassword(event.target.value)}
                    type="password"
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                    placeholder="رمز جدید (اختیاری)"
                  />
                ) : null}

                {saveError ? (
                  <p className="rounded-lg border border-negative/40 bg-negative/10 px-3 py-2 text-xs text-negative">
                    {saveError}
                  </p>
                ) : null}
                {saveSuccess ? (
                  <p className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-xs text-positive">
                    {saveSuccess}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-1">
                  {profileEditMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileEditMode(false);
                          setSaveError(null);
                          setSaveSuccess(null);
                          setEditPassword('');
                        }}
                        className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted transition hover:text-text"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitProfileUpdate()}
                        disabled={saveLoading}
                        className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {saveLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setProfileEditMode(true)}
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                    >
                      ویرایش اطلاعات
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
