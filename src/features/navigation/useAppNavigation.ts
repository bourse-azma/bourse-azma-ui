import {useCallback, useEffect, useState} from 'react';

export type AppPath = '/' | '/dashboard' | '/admin' | '/login' | '/register' | '/market';

const knownPaths = new Set<AppPath>(['/', '/dashboard', '/admin', '/login', '/register', '/market']);

function readPathname(): AppPath | null {
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    return knownPaths.has(pathname as AppPath) ? (pathname as AppPath) : null;
}

export function useAppNavigation() {
    const [pathname, setPathname] = useState<AppPath | null>(readPathname);

    useEffect(() => {
        const handlePopState = () => setPathname(readPathname());
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = useCallback((path: AppPath, options?: { replace?: boolean }) => {
        const method = options?.replace ? 'replaceState' : 'pushState';
        window.history[method](null, '', path);
        setPathname(path);
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, []);

    return {pathname, navigate};
}
