export type SessionState = {
    accessToken: string;
    rememberMe: boolean;
};

export type PersistedSession = {
    rememberMe: boolean;
};

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export type UserProfile = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    role: string;
    balance?: number;
};

export type ApiResponse<T> = {
    message?: string;
    result?: T;
};
