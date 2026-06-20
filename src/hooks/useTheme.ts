import {useCallback, useEffect, useState} from 'react';

export type Theme = 'light' | 'dark';
type ThemeToggleOrigin = { x: number; y: number };
type ViewTransition = { ready: Promise<void> };
type DocumentWithViewTransition = Document & {
    startViewTransition?: (updateCallback: () => void) => ViewTransition;
};

const THEME_STORAGE_KEY = 'bourse-theme';

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'light';

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback((origin?: ThemeToggleOrigin) => {
        const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
        const doc = document as DocumentWithViewTransition;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!doc.startViewTransition || prefersReducedMotion) {
            setTheme(nextTheme);
            return;
        }

        const fallbackX = window.innerWidth / 2;
        const fallbackY = window.innerHeight / 2;
        const x = origin?.x ?? fallbackX;
        const y = origin?.y ?? fallbackY;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = doc.startViewTransition(() => {
            setTheme(nextTheme);
        });

        transition.ready
            .then(() => {
                const isDarkMode = nextTheme === 'dark';
                const clipFrom = `circle(0px at ${x}px ${y}px)`;
                const clipTo = `circle(${endRadius}px at ${x}px ${y}px)`;

                const animationOptions: KeyframeAnimationOptions & { pseudoElement: string } = {
                    duration: 420,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'both',
                    pseudoElement: isDarkMode ? '::view-transition-new(root)' : '::view-transition-old(root)',
                };

                document.documentElement.animate(
                    {
                        clipPath: isDarkMode ? [clipFrom, clipTo] : [clipTo, clipFrom],
                    },
                    animationOptions
                );
            })
            .catch(() => undefined);
    }, [theme]);

    return {theme, toggleTheme};
}
