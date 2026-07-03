function positiveInterval(value: string | undefined, key: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid admin config: ${key}`);
    }
    return Math.floor(parsed);
}

export const adminConfig = Object.freeze({
    statsRefreshMs: positiveInterval(
        import.meta.env.VITE_ADMIN_STATS_REFRESH_MS,
        'VITE_ADMIN_STATS_REFRESH_MS',
    ),
    usersRefreshMs: positiveInterval(
        import.meta.env.VITE_ADMIN_USERS_REFRESH_MS,
        'VITE_ADMIN_USERS_REFRESH_MS',
    ),
    userDetailRefreshMs: positiveInterval(
        import.meta.env.VITE_ADMIN_USER_DETAIL_REFRESH_MS,
        'VITE_ADMIN_USER_DETAIL_REFRESH_MS',
    ),
});
