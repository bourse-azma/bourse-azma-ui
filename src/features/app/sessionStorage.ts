import type {PersistedSession, SessionState} from './types';

export const SESSION_STORAGE_KEY = 'bourse-azma-session';
export const SESSION_STORAGE_KEY_TEMP = 'bourse-azma-session-temp';
export const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'bourse-azma-access-token';

export const getInitialSession = (): SessionState | null => {
    if (typeof window === 'undefined') return null;

    const parseStoredSession = (raw: string | null, rememberMe: boolean): SessionState | null => {
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as Partial<PersistedSession> & { userId?: number };
            const resolvedRememberMe =
                typeof parsed.rememberMe === 'boolean' ? parsed.rememberMe : rememberMe;
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
