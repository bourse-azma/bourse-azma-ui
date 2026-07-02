import {
    Activity,
    ArrowLeft,
    BadgeCheck,
    ChartCandlestick,
    ChevronLeft,
    Github,
    GraduationCap,
    Mail,
    MapPinned,
    Menu,
    MonitorUp,
    Radar,
    Send,
    ShieldCheck,
    Sparkles,
    Trophy,
    UserPlus,
    WalletCards,
    X,
    type LucideIcon,
} from 'lucide-react';
import {FormEvent, useEffect, useState} from 'react';
import heroImage from './assets/boors-azma-hero-fintech.png';

type LandingPageProps = {
    onLogin: () => void;
    onRegister: () => void;
};

type Feature = {
    title: string;
    description: string;
    icon: LucideIcon;
    accent: 'teal' | 'gold';
};

const navItems = [
    {label: 'صفحه اصلی', href: '#home'},
    {label: 'معرفی', href: '#about'},
    {label: 'ارتباط با ما', href: '#contact'},
];

const headerIcons = [
    {label: 'نمودار کندل', icon: ChartCandlestick},
    {label: 'کیف پول دمو', icon: WalletCards},
    {label: 'امنیت حساب', icon: ShieldCheck},
];

const trustSignals = ['رایگان', 'بدون ریسک واقعی', 'شبیه‌سازی ۱۰۰٪ واقعی'];

const features: Feature[] = [
    {
        title: 'واقعی‌ترین شبیه‌سازی بازار',
        description: 'تمرین خرید و فروش در محیطی نزدیک به تجربه بازار سرمایه ایران، بدون درگیر شدن سرمایه واقعی.',
        icon: ChartCandlestick,
        accent: 'teal',
    },
    {
        title: 'داشبورد حرفه‌ای تحلیل تکنیکال',
        description: 'نمایش قیمت، روندها، کندل‌ها و شاخص‌های تحلیلی در یک فضای سریع، تمیز و مناسب تصمیم‌گیری.',
        icon: MonitorUp,
        accent: 'gold',
    },
    {
        title: 'رقابت و لیدربورد',
        description: 'رتبه‌بندی معامله‌گران دمو و ساخت انگیزه برای بهتر شدن استراتژی، مدیریت سرمایه و عملکرد.',
        icon: Trophy,
        accent: 'teal',
    },
    {
        title: 'آموزش و یادگیری تعاملی',
        description: 'یادگیری مفاهیم معامله‌گری با تمرین عملی، بازخورد سریع و تجربه‌ای قابل اعتماد برای تازه‌کارها.',
        icon: GraduationCap,
        accent: 'gold',
    },
    {
        title: 'امنیت بالا و محیط بدون ریسک',
        description: 'تمرکز کامل روی یادگیری و آزمون استراتژی‌ها، بدون فشار روانی زیان مالی و با تجربه کاربری امن.',
        icon: ShieldCheck,
        accent: 'teal',
    },
];

const tickerItems = [
    'شاخص کل ۲,۱۸۴,۹۲۰  +۱.۲۴٪',
    'فولاد  ۷,۸۴۰  +۰.۸٪',
    'شستا  ۱,۲۹۰  -۰.۳٪',
    'خودرو  ۳,۴۲۰  +۲.۱٪',
    'وبملت  ۶,۱۱۰  +۱.۶٪',
    'رمپنا  ۱۲,۷۰۰  +۰.۹٪',
];

const teamMembers = [
    {
        name: 'مهندس عرفان داوودی‌نصر',
        email: 'davoodinasr.erfan@gmail.com',
        github: 'ErfanDavoodiNasr',
        icon: Activity,
    },
    {
        name: 'مهندس محسن جلیلی',
        email: 'mohsenjalili@ut.ac.ir',
        github: 'reallermaker',
        icon: Radar,
    },
];

function BoorsAzmaLogo({compact = false}: { compact?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <svg
                viewBox="0 0 64 64"
                aria-hidden="true"
                className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} shrink-0 drop-shadow-[0_0_22px_rgba(0,229,201,0.38)]`}
            >
                <defs>
                    <linearGradient id="logoStroke" x1="10" x2="56" y1="56" y2="8" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00E5C9"/>
                        <stop offset="1" stopColor="#FFB300"/>
                    </linearGradient>
                    <linearGradient id="logoBg" x1="8" x2="56" y1="8" y2="56" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#10203D"/>
                        <stop offset="1" stopColor="#081225"/>
                    </linearGradient>
                </defs>
                <rect x="5" y="5" width="54" height="54" rx="8" fill="url(#logoBg)" stroke="#1F3B5C"/>
                <path
                    d="M17 38c0 8 6.2 12 18.7 12H47"
                    fill="none"
                    stroke="url(#logoStroke)"
                    strokeLinecap="round"
                    strokeWidth="6"
                />
                <circle cx="27" cy="53" r="3.3" fill="#FFB300"/>
                <path
                    d="M19 31l8-7 7 5 12-15"
                    fill="none"
                    stroke="#00E5C9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                />
                <path d="M46 14v11h-10" fill="none" stroke="#FFB300" strokeLinecap="round" strokeWidth="3"/>
            </svg>
            {!compact ? (
                <div>
                    <p className="text-lg font-black leading-5 text-white">بورس‌آزما</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#00E5C9]">Boors Azma</p>
                </div>
            ) : null}
        </div>
    );
}

function IconBadge({icon: Icon, accent = 'teal'}: { icon: LucideIcon; accent?: 'teal' | 'gold' }) {
    return (
        <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-lg border ${
                accent === 'teal'
                    ? 'border-[#00E5C9]/30 bg-[#00E5C9]/10 text-[#00E5C9]'
                    : 'border-[#FFB300]/35 bg-[#FFB300]/10 text-[#FFB300]'
            }`}
        >
            <Icon className="h-6 w-6" strokeWidth={1.8}/>
        </span>
    );
}

function TickerStrip() {
    const ticker = [...tickerItems, ...tickerItems];
    return (
        <div className="landing-ticker" dir="ltr" aria-label="نمای زنده بازار">
            <div className="landing-ticker-track">
                {ticker.map((item, index) => (
                    <span key={`${item}-${index}`} className="landing-ticker-item">
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function LandingPage({onLogin, onRegister}: LandingPageProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const updateHeader = () => setIsScrolled(window.scrollY > 18);
        updateHeader();
        window.addEventListener('scroll', updateHeader, {passive: true});
        return () => window.removeEventListener('scroll', updateHeader);
    }, []);

    useEffect(() => {
        document.body.style.backgroundColor = '#0A1428';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    const closeMenu = () => setMenuOpen(false);

    const submitContact = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    return (
        <div className="landing-shell bg-[#0A1428] text-white" dir="rtl">
            <header className={`landing-header ${isScrolled ? 'landing-header-solid' : ''}`}>
                <div className="mx-auto flex h-20 w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4">
                    <a href="#home" className="shrink-0" aria-label="بورس‌آزما">
                        <BoorsAzmaLogo/>
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

                    <div className="hidden items-center gap-2 xl:flex" aria-label="ابزارهای معاملاتی">
                        {headerIcons.map(({label, icon: Icon}) => (
                            <span
                                key={label}
                                title={label}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/6 text-[#00E5C9]"
                            >
                                <Icon className="h-5 w-5" strokeWidth={1.7}/>
                            </span>
                        ))}
                    </div>

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
                        onClick={() => setMenuOpen((current) => !current)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-white/8 text-white lg:hidden"
                        aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
                    >
                        {menuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                    </button>
                </div>

                {menuOpen ? (
                    <div className="mx-auto mb-4 w-[min(1180px,calc(100%-32px))] rounded-lg border border-white/12 bg-[#0B172D]/95 p-3 shadow-2xl lg:hidden">
                        <div className="grid gap-2">
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMenu}
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
                                    closeMenu();
                                    onLogin();
                                }}
                                className="rounded-lg border border-white/14 px-3 py-2 text-sm font-bold text-white"
                            >
                                ورود
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    closeMenu();
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

            <main>
                <section id="home" className="landing-hero relative flex min-h-[92svh] items-center overflow-hidden pt-24">
                    <div
                        className="landing-hero-image"
                        style={{backgroundImage: `url(${heroImage})`}}
                        aria-hidden="true"
                    />
                    <div className="landing-data-grid" aria-hidden="true"/>
                    <div className="landing-scanline" aria-hidden="true"/>

                    <div className="relative z-10 mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col gap-10 py-16 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[#00E5C9]/24 bg-[#00E5C9]/8 px-3 py-2 text-xs font-bold text-[#BFFFF7]">
                                <Sparkles className="h-4 w-4 text-[#FFB300]"/>
                                شبیه‌سازی حرفه‌ای معاملات بورس ایران
                            </div>
                            <h1 className="max-w-4xl text-4xl font-black leading-[1.35] text-white sm:text-5xl lg:text-7xl">
                                آینده ترید را همین امروز تجربه کن
                            </h1>
                            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#D8E6F7] sm:text-lg">
                                بورس‌آزما — پلتفرم دمو و شبیه‌سازی حرفه‌ای معاملات بورس با محیط واقعی
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={onRegister}
                                    className="landing-glow-button inline-flex items-center justify-center gap-2 rounded-lg bg-[#00E5C9] px-6 py-3.5 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8]"
                                >
                                    همین حالا ثبت‌نام کن
                                    <ArrowLeft className="h-4 w-4"/>
                                </button>
                                <button
                                    type="button"
                                    onClick={onLogin}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/16 bg-white/8 px-6 py-3.5 text-sm font-black text-white backdrop-blur transition hover:border-[#FFB300]/45 hover:bg-[#FFB300]/10"
                                >
                                    ورود به حساب
                                    <ChevronLeft className="h-4 w-4"/>
                                </button>
                            </div>

                            <div className="mt-7 flex flex-wrap gap-2">
                                {trustSignals.map((signal) => (
                                    <span
                                        key={signal}
                                        className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/7 px-3 py-2 text-xs font-bold text-white/82 backdrop-blur"
                                    >
                                        <BadgeCheck className="h-4 w-4 text-[#00E5C9]"/>
                                        {signal}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="landing-market-panel w-full max-w-[460px]">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-white/54">نمای دمو بازار</p>
                                    <p className="mt-1 text-2xl font-black text-white">پرتفوی آزمون</p>
                                </div>
                                <span className="rounded-lg border border-[#00E5C9]/25 bg-[#00E5C9]/10 px-3 py-2 text-xs font-black text-[#00E5C9]">
                                    زنده
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="landing-metric">
                                    <span>بازده امروز</span>
                                    <strong className="text-[#00E5C9]">+۳.۸۴٪</strong>
                                </div>
                                <div className="landing-metric">
                                    <span>ریسک واقعی</span>
                                    <strong className="text-[#FFB300]">۰ ریال</strong>
                                </div>
                            </div>

                            <div className="mt-5 h-36 rounded-lg border border-white/10 bg-[#071225]/78 p-4">
                                <svg viewBox="0 0 360 120" className="h-full w-full" aria-hidden="true">
                                    <path
                                        d="M8 92C35 84 48 49 76 58C102 67 104 93 132 79C160 65 164 26 192 34C222 43 219 70 249 58C279 46 297 20 352 26"
                                        fill="none"
                                        stroke="#00E5C9"
                                        strokeLinecap="round"
                                        strokeWidth="4"
                                    />
                                    <path
                                        d="M8 101C56 93 77 87 111 88C151 89 168 70 202 74C239 78 254 63 292 58C318 55 334 49 352 41"
                                        fill="none"
                                        stroke="#FFB300"
                                        strokeDasharray="7 8"
                                        strokeLinecap="round"
                                        strokeWidth="3"
                                    />
                                    {[38, 80, 126, 174, 220, 272, 326].map((x, index) => (
                                        <g key={x}>
                                            <line
                                                x1={x}
                                                x2={x}
                                                y1={24 + (index % 3) * 9}
                                                y2={92 - (index % 2) * 12}
                                                stroke={index % 2 === 0 ? '#00E5C9' : '#FFB300'}
                                                strokeLinecap="round"
                                                strokeWidth="3"
                                            />
                                            <rect
                                                x={x - 6}
                                                y={45 + (index % 4) * 8}
                                                width="12"
                                                height="26"
                                                rx="2"
                                                fill={index % 2 === 0 ? '#00E5C9' : '#FFB300'}
                                                opacity="0.88"
                                            />
                                        </g>
                                    ))}
                                </svg>
                            </div>

                            <div className="mt-4 space-y-2">
                                {[
                                    ['فولاد', '+۲.۴٪', '#00E5C9'],
                                    ['وبملت', '+۱.۷٪', '#00E5C9'],
                                    ['خودرو', '-۰.۶٪', '#FFB300'],
                                ].map(([symbol, value, color]) => (
                                    <div key={symbol} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                                        <span className="text-sm font-bold text-white/78">{symbol}</span>
                                        <span className="text-sm font-black" style={{color}}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <TickerStrip/>

                <section id="features" className="landing-section py-20 sm:py-24">
                    <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
                        <div className="max-w-2xl">
                            <span className="text-sm font-black text-[#00E5C9]">امکانات کلیدی</span>
                            <h2 className="mt-3 text-3xl font-black leading-[1.45] text-white sm:text-4xl">
                                ابزارهایی که معامله‌گر را برای بازار واقعی آماده می‌کنند
                            </h2>
                        </div>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            {features.map((feature) => (
                                <article key={feature.title} className="landing-feature-card">
                                    <IconBadge icon={feature.icon} accent={feature.accent}/>
                                    <h3 className="mt-5 text-lg font-black leading-8 text-white">{feature.title}</h3>
                                    <p className="mt-3 text-sm font-medium leading-7 text-[#AFC1D8]">{feature.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="about" className="landing-section border-y border-white/8 bg-white/[0.025] py-20 sm:py-24">
                    <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                        <div>
                            <span className="text-sm font-black text-[#FFB300]">معرفی</span>
                            <h2 className="mt-3 text-3xl font-black leading-[1.45] text-white sm:text-4xl">درباره بورس‌آزما</h2>
                            <p className="mt-6 text-base font-medium leading-9 text-[#D8E6F7]">
                                بورس‌آزما یک پلتفرم شبیه‌سازی و آموزش معاملات بورس است که توسط دو مهندس با تجربه توسعه یافته. هدف ما فراهم کردن محیطی امن و واقعی برای تمرین ترید بدون ریسک مالی است.
                            </p>
                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {[
                                    ['سرمایه دمو', 'قابل تنظیم'],
                                    ['تمرکز', 'بورس ایران'],
                                    ['تجربه', 'بدون ریسک'],
                                ].map(([title, value]) => (
                                    <div key={title} className="rounded-lg border border-white/10 bg-white/6 p-4">
                                        <p className="text-xs font-bold text-white/52">{title}</p>
                                        <p className="mt-2 text-lg font-black text-white">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {teamMembers.map(({name, email, github, icon: Icon}) => (
                                <article key={email} className="landing-team-card">
                                    <div className="flex items-start gap-4">
                                        <span className="landing-team-avatar">
                                            <Icon className="h-7 w-7"/>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-black text-white">{name}</h3>
                                            <a
                                                href={`mailto:${email}`}
                                                className="mt-2 block break-all text-sm font-semibold text-[#B7C9DE] transition hover:text-[#00E5C9]"
                                            >
                                                {email}
                                            </a>
                                            <a
                                                href={`https://github.com/${github}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-xs font-black text-white transition hover:border-[#00E5C9]/45 hover:text-[#00E5C9]"
                                            >
                                                <Github className="h-4 w-4"/>
                                                GitHub: {github}
                                            </a>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="contact" className="landing-section py-20 sm:py-24">
                    <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                        <div>
                            <span className="text-sm font-black text-[#00E5C9]">ارتباط با ما</span>
                            <h2 className="mt-3 text-3xl font-black leading-[1.45] text-white sm:text-4xl">
                                برای همکاری، بازخورد یا توسعه نسخه بعدی در تماس باشید
                            </h2>
                            <div className="mt-8 space-y-3">
                                <a
                                    href="mailto:mohsenjalili@ut.ac.ir"
                                    className="landing-contact-link"
                                >
                                    <Mail className="h-5 w-5 text-[#00E5C9]"/>
                                    mohsenjalili@ut.ac.ir
                                </a>
                                <a
                                    href="mailto:davoodinasr.erfan@gmail.com"
                                    className="landing-contact-link"
                                >
                                    <Mail className="h-5 w-5 text-[#FFB300]"/>
                                    davoodinasr.erfan@gmail.com
                                </a>
                                <a
                                    href="https://github.com/reallermaker"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="landing-contact-link"
                                >
                                    <Github className="h-5 w-5 text-[#00E5C9]"/>
                                    github.com/reallermaker
                                </a>
                            </div>

                            <div className="landing-map mt-8">
                                <MapPinned className="h-6 w-6 text-[#FFB300]"/>
                                <div>
                                    <p className="text-sm font-black text-white">طراحی و توسعه در ایران</p>
                                    <p className="mt-1 text-xs font-semibold text-[#9FB4CD]">فین‌تک فارسی، تمرکز بر تجربه بورس ایران</p>
                                </div>
                            </div>
                        </div>

                        <form className="landing-contact-form" onSubmit={submitContact}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold text-white/68">نام و نام خانوادگی</span>
                                    <input className="landing-input" placeholder="نام شما"/>
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold text-white/68">ایمیل</span>
                                    <input className="landing-input" type="email" placeholder="email@example.com" dir="ltr"/>
                                </label>
                            </div>
                            <label className="mt-4 block">
                                <span className="mb-2 block text-xs font-bold text-white/68">موضوع</span>
                                <input className="landing-input" placeholder="موضوع پیام"/>
                            </label>
                            <label className="mt-4 block">
                                <span className="mb-2 block text-xs font-bold text-white/68">پیام</span>
                                <textarea className="landing-input min-h-32 resize-y" placeholder="پیام خود را بنویسید"/>
                            </label>
                            <button
                                type="submit"
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00E5C9] px-5 py-3 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8] sm:w-auto"
                            >
                                <Send className="h-4 w-4"/>
                                ارسال پیام
                            </button>
                        </form>
                    </div>
                </section>
            </main>

            <footer className="landing-section border-t border-white/8 py-10">
                <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
                    <div>
                        <BoorsAzmaLogo compact/>
                        <p className="mt-4 max-w-md text-sm font-medium leading-7 text-[#AFC1D8]">
                            بورس‌آزما فضای حرفه‌ای تمرین، آموزش و رقابت معامله‌گران بازار سرمایه ایران است.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">لینک‌های سریع</h3>
                        <div className="mt-3 grid gap-2">
                            {navItems.map((item) => (
                                <a key={item.href} href={item.href} className="text-sm font-semibold text-[#AFC1D8] hover:text-[#00E5C9]">
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">شبکه‌ها</h3>
                        <div className="mt-3 flex gap-2">
                            {['reallermaker', 'ErfanDavoodiNasr'].map((github) => (
                                <a
                                    key={github}
                                    href={`https://github.com/${github}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/6 text-white transition hover:border-[#00E5C9]/45 hover:text-[#00E5C9]"
                                    aria-label={`GitHub ${github}`}
                                >
                                    <Github className="h-5 w-5"/>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mx-auto mt-8 flex w-[min(1180px,calc(100%-32px))] flex-col gap-2 border-t border-white/8 pt-6 text-xs font-semibold text-[#8EA6C4] sm:flex-row sm:items-center sm:justify-between">
                    <span>© ۲۰۲۶ بورس‌آزما. همه حقوق محفوظ است.</span>
                    <span>ساخته شده با ❤️ در ایران</span>
                </div>
            </footer>
        </div>
    );
}
