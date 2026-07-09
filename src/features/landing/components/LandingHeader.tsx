import {useEffect} from 'react';
import {LayoutDashboard, Menu, UserPlus, X} from 'lucide-react';
import BourseAzmaLogo from '../../../components/BourseAzmaLogo';
import {navItems} from '../constants';
import {handleLandingNavClick} from '../landingNavigation';

type LandingHeaderProps = {
    isScrolled: boolean;
    menuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    isAuthenticated: boolean;
    onDashboard: () => void;
    onLogin: () => void;
    onRegister: () => void;
};

export function LandingHeader({
                                  isScrolled,
                                  menuOpen,
                                  onToggleMenu,
                                  onCloseMenu,
                                  isAuthenticated,
                                  onDashboard,
                                  onLogin,
                                  onRegister,
                              }: LandingHeaderProps) {
    useEffect(() => {
        if (!menuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCloseMenu();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen, onCloseMenu]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) onCloseMenu();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [onCloseMenu]);

    return (
        <header className={`landing-header ${isScrolled ? 'landing-header-solid' : ''}`}>
            <div className="landing-container flex h-16 items-center justify-between gap-3 sm:h-20 sm:gap-4">
                <a href="/" className="shrink-0" onClick={(e) => handleLandingNavClick(e, '/')} aria-label="بورس آزما">
                    <BourseAzmaLogo/>
                </a>

                <nav className="hidden items-center gap-2 lg:flex" aria-label="ناوبری اصلی">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleLandingNavClick(e, item.href)}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/8 hover:text-white"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 lg:flex">
                    {isAuthenticated ? <button
                        type="button"
                        onClick={onDashboard}
                        className="landing-glow-button inline-flex items-center gap-2 rounded-lg bg-[#00E5C9] px-5 py-2.5 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8]"
                    >
                        <LayoutDashboard className="h-4 w-4"/>
                        ورود به داشبورد
                    </button> : <>
                        <button
                            type="button"
                            onClick={onLogin}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/14 bg-white/6 px-4 py-2 text-sm font-bold text-white transition hover:border-[#00E5C9]/45 hover:bg-[#00E5C9]/10"
                        >
                            ورود
                        </button>
                        <button
                            type="button"
                            onClick={onRegister}
                            className="landing-glow-button inline-flex items-center gap-2 rounded-lg bg-[#00E5C9] px-5 py-2.5 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8]"
                        >
                            <UserPlus className="h-4 w-4"/>
                            ثبت‌نام
                        </button>
                    </>}
                </div>

                <button
                    type="button"
                    onClick={onToggleMenu}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/8 text-white sm:h-11 sm:w-11 lg:hidden"
                    aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
                    aria-expanded={menuOpen}
                    aria-controls="landing-mobile-menu"
                >
                    {menuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                </button>
            </div>

            {menuOpen ? (
                <>
                    <button
                        type="button"
                        className="landing-mobile-menu-backdrop lg:hidden"
                        aria-label="بستن منو"
                        onClick={onCloseMenu}
                    />
                    <div
                        id="landing-mobile-menu"
                        role="dialog"
                        aria-modal="true"
                        aria-label="منوی موبایل"
                        className="landing-mobile-menu-panel lg:hidden"
                    >
                        <div className="grid gap-1">
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={(e) => {
                                        handleLandingNavClick(e, item.href);
                                        onCloseMenu();
                                    }}
                                    className="rounded-lg px-4 py-3 text-base font-bold text-white/85 transition hover:bg-white/8"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>
                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onCloseMenu();
                                    onDashboard();
                                }}
                                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00E5C9] px-4 py-3 text-sm font-black text-[#061221]"
                            >
                                <LayoutDashboard className="h-4 w-4"/>
                                ورود به داشبورد
                            </button>
                        ) : (
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onCloseMenu();
                                        onLogin();
                                    }}
                                    className="rounded-xl border border-white/14 px-4 py-3 text-sm font-bold text-white"
                                >
                                    ورود
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onCloseMenu();
                                        onRegister();
                                    }}
                                    className="rounded-xl bg-[#00E5C9] px-4 py-3 text-sm font-black text-[#061221]"
                                >
                                    ثبت‌نام
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </header>
    );
}
