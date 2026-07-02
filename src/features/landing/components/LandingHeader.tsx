import {Menu, UserPlus, X} from 'lucide-react';
import BourseAzmaLogo from '../../../components/BourseAzmaLogo';
import {navItems} from '../constants';

type LandingHeaderProps = {
    isScrolled: boolean;
    menuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    onLogin: () => void;
    onRegister: () => void;
};

export function LandingHeader({
                                  isScrolled,
                                  menuOpen,
                                  onToggleMenu,
                                  onCloseMenu,
                                  onLogin,
                                  onRegister,
                              }: LandingHeaderProps) {
    return (
        <header className={`landing-header ${isScrolled ? 'landing-header-solid' : ''}`}>
            <div className="mx-auto flex h-20 w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4">
                <a href="#home" className="shrink-0" aria-label="بورس آزما">
                    <BourseAzmaLogo/>
                </a>

                <nav className="hidden items-center gap-2 lg:flex" aria-label="ناوبری اصلی">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/8 hover:text-white"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 lg:flex">
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
                </div>

                <button
                    type="button"
                    onClick={onToggleMenu}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-white/8 text-white lg:hidden"
                    aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
                >
                    {menuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                </button>
            </div>

            {menuOpen ? (
                <div
                    className="mx-auto mb-4 w-[min(1180px,calc(100%-32px))] rounded-lg border border-white/12 bg-[#0B172D]/95 p-3 shadow-2xl lg:hidden">
                    <div className="grid gap-2">
                        {navItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={onCloseMenu}
                                className="rounded-lg px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/8"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onCloseMenu();
                                onLogin();
                            }}
                            className="rounded-lg border border-white/14 px-3 py-2 text-sm font-bold text-white"
                        >
                            ورود
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onCloseMenu();
                                onRegister();
                            }}
                            className="rounded-lg bg-[#00E5C9] px-3 py-2 text-sm font-black text-[#061221]"
                        >
                            ثبت‌نام
                        </button>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
