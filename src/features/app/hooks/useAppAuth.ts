import {useCallback, useEffect, useMemo, useState} from 'react';
import type {AuthMode, AuthSession} from '../../auth/types';
import {clearLoginSymbolState, readLoginEpoch, startNewLoginEpoch} from '../../symbol-search/selectedSymbolState';
import {appConfig} from '../../../config/appConfig';
import {toApiErrorMessage} from '../../../lib/apiError';
import {withAuthRequest} from '../../../lib/authRequest';
import {
    getInitialSession,
    LEGACY_ACCESS_TOKEN_STORAGE_KEY,
    SESSION_STORAGE_KEY,
    SESSION_STORAGE_KEY_TEMP,
} from '../sessionStorage';
import type {ApiResponse, AuthState, PersistedSession, PublicView, SessionState, UserProfile} from '../types';

export function useAppAuth() {
    const [session, setSession] = useState<SessionState | null>(getInitialSession);
    const [authState, setAuthState] = useState<AuthState>(() => (getInitialSession() ? 'checking' : 'unauthenticated'));
    const [publicView, setPublicView] = useState<PublicView>('landing');
    const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('login');
    const [loginEpoch, setLoginEpoch] = useState(() => readLoginEpoch() ?? '');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const clearSession = useCallback(() => {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY_TEMP);
        window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
        clearLoginSymbolState();
        setLoginEpoch('');
        setSession(null);
        setAuthState('unauthenticated');
        setProfile(null);
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

    return {
        session,
        authState,
        publicView,
        authInitialMode,
        loginEpoch,
        profile,
        profileLoading,
        profileError,
        displayName,
        setProfile,
        handleAuthenticated,
        openAuth,
        openLanding,
        handleLogout,
    };
}
