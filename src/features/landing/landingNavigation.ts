import {type MouseEvent, useEffect} from 'react';

export function scrollToLandingHash(hash?: string) {
    const id = (hash ?? window.location.hash.slice(1)).replace(/^#/, '');
    if (!id) return;

    requestAnimationFrame(() => {
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({behavior: 'smooth'});
        }, 150);
    });
}

export function handleLandingNavClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith('/')) return;

    e.preventDefault();
    const [path, hash] = href.split('#');

    if (window.location.pathname !== path) {
        window.history.pushState(null, '', hash ? `${path}#${hash}` : path);
        window.dispatchEvent(new Event('popstate'));
    } else if (hash) {
        window.history.replaceState(null, '', `${path}#${hash}`);
    } else {
        window.history.replaceState(null, '', path);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
    }

    if (hash) {
        scrollToLandingHash(hash);
    } else {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
}

export function useLandingHashScroll() {
    useEffect(() => {
        if (!window.location.hash) return;
        scrollToLandingHash();
    }, []);
}
