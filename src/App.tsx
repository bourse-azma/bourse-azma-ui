import {useCallback, useEffect, useMemo, useState} from 'react';
import AuthPage, {type AuthMode, type AuthSession} from './AuthPage';
import LandingPage from './LandingPage';
import TradingDashboard from './TradingDashboard';
import FieldLabel from './components/ui/FieldLabel';
import {appConfig} from './config/appConfig';
import {useTheme} from './hooks/useTheme';
import {toApiErrorMessage} from './lib/apiError';
import {withAuthRequest} from './lib/authRequest';
import {
    PASSWORD_VALIDATION_MESSAGE,
    USERNAME_VALIDATION_MESSAGE,
    validatePassword,
    validateUsername
} from './lib/authValidation';
import {isPersianName, normalizePhoneNumber, toEnglishDigits} from './lib/stringUtils';
import {clearLoginSymbolState, readLoginEpoch, startNewLoginEpoch} from './features/symbol-search/selectedSymbolState';

const SESSION_STORAGE_KEY = 'bourse-azma-session';
const SESSION_STORAGE_KEY_TEMP = 'bourse-azma-session-temp';
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'bourse-azma-access-token';

type SessionState = {
    accessToken: string;
    rememberMe: boolean;
};

type PersistedSession = {
    rememberMe: boolean;
};

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

type UserProfile = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    nationalCode: string;
    phoneNumber: string;
    email: string;
    role: string;
    balance?: number;
};

type ApiResponse<T> = {
    message?: string;
    result?: T;
};

const getInitialSession = (): SessionState | null => {
    if (typeof window === 'undefined') return null;

    const parseStoredSession = (raw: string | null, rememberMe: boolean): SessionState | null => {
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as Partial<PersistedSession> & { userId?: number };
            const resolvedRememberMe =
                typeof parsed.rememberMe === 'boolean' ? parsed.rememberMe : rememberMe;
            // Accept legacy sessions that only stored userId as a sign-in marker.
            if (typeof parsed.userId === 'number' || typeof parsed.rememberMe === 'boolean') {
                return {
                    accessToken: '',
                    rememberMe: resolvedRememberMe,
                };
            }
        } catch {
            return null;
        }
        return null;
    };

    const sessionStored = parseStoredSession(window.sessionStorage.getItem(SESSION_STORAGE_KEY_TEMP), false);
    if (sessionStored) return sessionStored;

    const localStored = parseStoredSession(window.localStorage.getItem(SESSION_STORAGE_KEY), true);
    if (localStored) return localStored;

    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
    return null;
};

export default function App() {
    const {theme, toggleTheme} = useTheme();
    const [session, setSession] = useState<SessionState | null>(getInitialSession);
    const [authState, setAuthState] = useState<AuthState>(() => (getInitialSession() ? 'checking' : 'unauthenticated'));
    const [publicView, setPublicView] = useState<'landing' | 'auth'>('landing');
    const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('login');
    const [loginEpoch, setLoginEpoch] = useState(() => readLoginEpoch() ?? '');
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
    const [editUsername, setEditUsername] = useState('');
    const [editNationalCode, setEditNationalCode] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editCurrentPassword, setEditCurrentPassword] = useState('');

    const clearSession = useCallback(() => {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY_TEMP);
        window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
        clearLoginSymbolState();
        setLoginEpoch('');
        setSession(null);
        setAuthState('unauthenticated');
        setProfile(null);
        setProfileModalOpen(false);
        setProfileEditMode(false);
        setSaveError(null);
        setSaveSuccess(null);
        setPublicView('landing');
        setAuthInitialMode('login');
    }, []);

    const fetchProfile = useCallback(async (targetSession: SessionState) => {
        setProfileLoading(true);
        setProfileError(null);
        try {
            const response = await fetch('/api/v1/users/me', withAuthRequest(targetSession.accessToken, {
                method: 'GET',
            }));
            const text = await response.text();
            const data = text ? (JSON.parse(text) as unknown) : null;
            if (!response.ok) {
                clearSession();
                throw new Error(toApiErrorMessage(data, 'دریافت اطلاعات پروفایل ناموفق بود.'));
            }
            const api = data as ApiResponse<UserProfile>;
            if (!api.result) {
                throw new Error('پاسخ پروفایل معتبر نیست.');
            }
            setProfile(api.result);
            setAuthState('authenticated');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'دریافت اطلاعات پروفایل با خطا مواجه شد.';
            setProfileError(message);
            setAuthState('unauthenticated');
        } finally {
            setProfileLoading(false);
        }
    }, [clearSession]);

    useEffect(() => {
        if (!session) {
            setAuthState('unauthenticated');
            return;
        }
        setAuthState('checking');
        const persisted: PersistedSession = {
            rememberMe: session.rememberMe,
        };
        if (session.rememberMe) {
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(persisted));
            window.sessionStorage.removeItem(SESSION_STORAGE_KEY_TEMP);
        } else {
            window.sessionStorage.setItem(SESSION_STORAGE_KEY_TEMP, JSON.stringify(persisted));
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
        }
        window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
        void fetchProfile(session);
    }, [fetchProfile, session]);

    useEffect(() => {
        if (authState !== 'authenticated' || loginEpoch) return;
        setLoginEpoch(startNewLoginEpoch());
    }, [authState, loginEpoch]);

    const handleAuthenticated = useCallback((authSession: AuthSession) => {
        clearLoginSymbolState();
        const epoch = startNewLoginEpoch();
        setLoginEpoch(epoch);
        setPublicView('landing');
        setSession({
            accessToken: authSession.accessToken ?? '',
            rememberMe: authSession.rememberMe ?? false,
        });
        setAuthState('checking');
    }, []);

    const openAuth = useCallback((mode: AuthMode) => {
        setAuthInitialMode(mode);
        setPublicView('auth');
        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'smooth'}));
        }
    }, []);

    const openLanding = useCallback(() => {
        setPublicView('landing');
        setAuthInitialMode('login');
        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'smooth'}));
        }
    }, []);

    const handleLogout = useCallback(() => {
        const currentSession = session;
        clearSession();
        if (!currentSession) return;
        void fetch(`${appConfig.authApiBaseUrl}/logout`, withAuthRequest(currentSession.accessToken, {
            method: 'POST',
        })).catch(() => undefined);
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
            setEditUsername(profile.username);
            setEditNationalCode(profile.nationalCode);
            setEditPhoneNumber(profile.phoneNumber);
            setEditEmail(profile.email);
            setEditPassword('');
            setEditCurrentPassword('');
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

        const newPassword = editPassword.trim();
        const payload = {
            username: editUsername.trim().toLowerCase(),
            firstName: editFirstName.trim(),
            lastName: editLastName.trim(),
            nationalCode: toEnglishDigits(editNationalCode).trim(),
            phoneNumber: normalizePhoneNumber(editPhoneNumber),
            email: toEnglishDigits(editEmail).trim().toLowerCase(),
            password: newPassword === '' ? null : newPassword,
            currentPassword: newPassword === '' ? null : editCurrentPassword.trim(),
        };

        try {
            if (!isPersianName(payload.firstName) || !isPersianName(payload.lastName)) {
                throw new Error('نام و نام خانوادگی باید فقط با حروف فارسی وارد شوند.');
            }
            const usernameError = validateUsername(payload.username);
            if (usernameError) {
                throw new Error(usernameError);
            }
            if (newPassword !== '') {
                const passwordError = validatePassword(newPassword);
                if (passwordError) {
                    throw new Error(passwordError);
                }
            }
            if (newPassword !== '' && payload.currentPassword === '') {
                throw new Error('برای تغییر رمز عبور، رمز فعلی را وارد کنید.');
            }

            const response = await fetch('/api/v1/users/me', withAuthRequest(session.accessToken, {
                method: 'PUT',
                body: JSON.stringify(payload),
            }));
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
            setEditCurrentPassword('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'خطا در ویرایش پروفایل.';
            setSaveError(message);
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-bg text-text font-sans transition-colors duration-300">
            {authState === 'checking' ? (
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-muted">در حال بررسی ورود...</p>
                </div>
            ) : authState === 'authenticated' && session && loginEpoch ? (
                <TradingDashboard
                    key={loginEpoch}
                    loginEpoch={loginEpoch}
                    theme={theme}
                    accessToken={session.accessToken}
                    onToggleTheme={toggleTheme}
                    profileDisplayName={displayName}
                    onOpenProfile={openProfileModal}
                    onLogout={handleLogout}
                    userProfile={profile || undefined}
                    onProfileUpdated={setProfile}
                />
            ) : publicView === 'auth' ? (
                <AuthPage
                    onAuthenticated={handleAuthenticated}
                    initialMode={authInitialMode}
                    onBackToLanding={openLanding}
                />
            ) : (
                <LandingPage
                    onLogin={() => openAuth('login')}
                    onRegister={() => openAuth('register')}
                />
            )}

            {profileModalOpen ? (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4">
                    <section
                        className="w-full max-w-2xl rounded-3xl border border-border/80 bg-surface p-6 shadow-card sm:p-7">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-text">پروفایل کاربری</h2>
                                <p className="mt-1 text-xs text-muted">فیلدهای ستاره‌دار باید مقدار داشته باشند.</p>
                            </div>
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
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <FieldLabel title="نام کاربری" required/>
                                        <input
                                            name="username"
                                            autoComplete="username"
                                            value={editUsername}
                                            onChange={(event) => setEditUsername(event.target.value)}
                                            disabled={!profileEditMode}
                                            minLength={3}
                                            maxLength={50}
                                            pattern="[A-Za-z0-9._-]{3,50}"
                                            title={USERNAME_VALIDATION_MESSAGE}
                                            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                            placeholder="نام کاربری"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel title="نام" required/>
                                        <input
                                            name="given-name"
                                            autoComplete="given-name"
                                            pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                                            title="نام باید فقط با حروف فارسی وارد شود."
                                            value={editFirstName}
                                            onChange={(event) => setEditFirstName(event.target.value)}
                                            disabled={!profileEditMode}
                                            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                            placeholder="نام"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel title="نام خانوادگی" required/>
                                        <input
                                            name="family-name"
                                            autoComplete="family-name"
                                            pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                                            title="نام خانوادگی باید فقط با حروف فارسی وارد شود."
                                            value={editLastName}
                                            onChange={(event) => setEditLastName(event.target.value)}
                                            disabled={!profileEditMode}
                                            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                            placeholder="نام خانوادگی"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel title="کد ملی"/>
                                        <input
                                            name="national-code"
                                            value={editNationalCode}
                                            onChange={(event) => setEditNationalCode(event.target.value)}
                                            disabled={!profileEditMode}
                                            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                            placeholder="کد ملی"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel title="شماره موبایل"/>
                                    <input
                                        name="tel"
                                        autoComplete="tel"
                                        value={editPhoneNumber}
                                        onChange={(event) => setEditPhoneNumber(event.target.value)}
                                        disabled={!profileEditMode}
                                        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                        placeholder="شماره موبایل"
                                    />
                                </div>
                                <div>
                                    <FieldLabel title="ایمیل"/>
                                    <input
                                        name="email"
                                        autoComplete="email"
                                        type="email"
                                        value={editEmail}
                                        onChange={(event) => setEditEmail(event.target.value)}
                                        disabled={!profileEditMode}
                                        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                        placeholder="ایمیل"
                                    />
                                </div>
                                {profileEditMode ? (
                                    <div className="space-y-3 rounded-xl border border-border/70 bg-surface-2/60 p-3">
                                        <div>
                                            <FieldLabel title="رمز عبور فعلی"/>
                                            <input
                                                name="current-password"
                                                autoComplete="current-password"
                                                value={editCurrentPassword}
                                                onChange={(event) => setEditCurrentPassword(event.target.value)}
                                                type="password"
                                                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                                placeholder="فقط هنگام تغییر رمز عبور"
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel title="رمز عبور جدید"/>
                                            <input
                                                name="new-password"
                                                autoComplete="new-password"
                                                value={editPassword}
                                                onChange={(event) => setEditPassword(event.target.value)}
                                                type="password"
                                                minLength={8}
                                                maxLength={24}
                                                pattern="^(?=.*[A-Za-z])(?=.*\d).+$"
                                                title={PASSWORD_VALIDATION_MESSAGE}
                                                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                                placeholder="رمز جدید (در صورت نیاز وارد کنید)"
                                            />
                                            <p className="mt-1 text-[11px] text-muted">اگر این فیلد خالی بماند، رمز عبور
                                                تغییر نمی‌کند.</p>
                                        </div>
                                    </div>
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
                                                    setEditCurrentPassword('');
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
