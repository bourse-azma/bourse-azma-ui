export type AuthMode = 'login' | 'register';

export type AuthPageProps = {
    onAuthenticated: (session: AuthSession) => void;
    initialMode?: AuthMode;
    onBackToLanding?: () => void;
};

export type AuthTokenResult = {
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

export type ApiResponse<T> = {
    message?: string;
    result?: T;
};
