import {
    Activity,
    ArrowLeft,
    BadgeCheck,
    ChartCandlestick,
    ChevronLeft,
    Github,
    GraduationCap,
    type LucideIcon,
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
    X,
} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useState} from 'react';
import heroImage from './assets/boors-azma-hero-fintech.png';
import BourseAzmaLogo from './components/BourseAzmaLogo';
import MarketOverviewSection from './features/market-overview/MarketOverviewSection';
import MarketTickerStrip from './features/market-overview/MarketTickerStrip';
import {buildTickerItems, useLandingMarketData} from './features/market-overview/useLandingMarketData';

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
    {label: 'نمای بازار', href: '#market'},
    {label: 'معرفی', href: '#about'},
    {label: 'ارتباط با ما', href: '#contact'},
];

const trustSignals = ['داده‌های زنده بازار', 'سرمایه دمو قابل تنظیم', 'تمرین روی نمادهای واقعی'];

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
        title: 'تمرکز روی یادگیری و آزمون استراتژی',
        description: 'فضایی برای تمرین سناریوهای معاملاتی، مقایسه تصمیم‌ها و ساخت عادت‌های بهتر قبل از ورود جدی به بازار.',
        icon: ShieldCheck,
        accent: 'teal',
    },
];

const teamMembers = [
    {
        name: 'عرفان داوودی نصر',
        email: 'davoodinasr.erfan@gmail.com',
        github: 'ErfanDavoodiNasr',
        icon: Activity,
    },
    {
        name: 'محسن جلیلی',
        email: 'mohsenjalili@ut.ac.ir',
        github: 'reallermaker',
        icon: Radar,
    },
];

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

export default function LandingPage({onLogin, onRegister}: LandingPageProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const marketData = useLandingMarketData(true);
    const tickerItems = useMemo(() => buildTickerItems(marketData), [marketData]);

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

    const [contactStatus, setContactStatus] = useState<'idle' | 'sent'>('idle');

    const submitContact = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const name = String(formData.get('name') ?? '').trim();
        const email = String(formData.get('email') ?? '').trim();
        const subject = String(formData.get('subject') ?? '').trim();
        const message = String(formData.get('message') ?? '').trim();

        const body = [
            name ? `نام: ${name}` : '',
            email ? `ایمیل: ${email}` : '',
            '',
            message,
        ].filter((line, index, lines) => line !== '' || (index > 0 && lines[index - 1] !== '')).join('\n');

        const mailto = `mailto:info@bourseazma.ir?subject=${encodeURIComponent(subject || 'پیام از وب‌سایت بورس‌آزما')}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
        setContactStatus('sent');
    };

    return (
        <div className="landing-shell bg-[#0A1428] text-white" dir="rtl">
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
                        onClick={() => setMenuOpen((current) => !current)}
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
                <section id="home"
                         className="landing-hero relative flex min-h-[92svh] items-center overflow-hidden pt-24">
                    <div
                        className="landing-hero-image"
                        style={{backgroundImage: `url(${heroImage})`}}
                        aria-hidden="true"
                    />
                    <div className="landing-data-grid" aria-hidden="true"/>
                    <div className="landing-scanline" aria-hidden="true"/>

                    <div className="relative z-10 mx-auto w-[min(1180px,calc(100%-32px))] py-16">
                        <div className="max-w-3xl">
                            <div
                                className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[#00E5C9]/24 bg-[#00E5C9]/8 px-3 py-2 text-xs font-bold text-[#BFFFF7]">
                                <Sparkles className="h-4 w-4 text-[#FFB300]"/>
                                تمرین حرفه‌ای معاملات بورس ایران
                            </div>
                            <h1 className="max-w-4xl text-4xl font-black leading-[1.35] text-white sm:text-5xl lg:text-7xl">
                                بازار را قبل از معامله واقعی تجربه کن
                            </h1>
                            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#D8E6F7] sm:text-lg">
                                بورس آزما محیطی برای تمرین تصمیم‌گیری، مدیریت سرمایه و تحلیل نمادهای بازار سرمایه ایران
                                است.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={onRegister}
                                    className="landing-glow-button inline-flex items-center justify-center gap-2 rounded-lg bg-[#00E5C9] px-6 py-3.5 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8]"
                                >
                                    شروع تمرین معامله‌گری
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
                    </div>
                </section>

                <MarketTickerStrip items={tickerItems}/>

                <MarketOverviewSection data={marketData} onLogin={onLogin} onRegister={onRegister}/>

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
                    <div
                        className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                        <div>
                            <span className="text-sm font-black text-[#FFB300]">معرفی</span>
                            <h2 className="mt-3 text-3xl font-black leading-[1.45] text-white sm:text-4xl">درباره
                                بورس‌آزما</h2>
                            <p className="mt-6 text-base font-medium leading-9 text-[#D8E6F7]">
                                بورس‌آزما پلتفرمی برای تمرین معامله‌گری روی داده‌های واقعی بازار سرمایه ایران است.
                                اینجا می‌توانید بدون ریسک سرمایه واقعی، استراتژی بسازید، سفارش ثبت کنید و عملکرد خود را
                                بسنجید.
                            </p>
                            <p className="mt-4 text-sm font-medium leading-8 text-[#AFC1D8]">
                                تمرکز ما روی تجربه‌ای نزدیک به بازار واقعی، ابزارهای تحلیلی کاربردی و محیطی است که
                                یادگیری و تمرین را جدی بگیرد.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {teamMembers.map(({name, email, github, icon: Icon}) => (
                                <article key={email} className="landing-team-card">
                                    <div className="flex items-start gap-3">
                                        <span className="landing-team-avatar">
                                            <Icon className="h-5 w-5"/>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base font-semibold text-white">{name}</h3>
                                            <a
                                                href={`mailto:${email}`}
                                                className="mt-1.5 block break-all text-sm text-[#9FB4CD] transition hover:text-[#00E5C9]"
                                            >
                                                {email}
                                            </a>
                                            <a
                                                href={`https://github.com/${github}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/55 transition hover:text-[#00E5C9]"
                                            >
                                                <Github className="h-3.5 w-3.5"/>
                                                {github}
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
                                همکاری، دمو و ارتباط با ما
                            </h2>
                            <p className="mt-4 text-sm font-medium leading-8 text-[#AFC1D8]">
                                برای همکاری، دریافت دمو یا طرح پرسش، از طریق فرم یا ایمیل با ما در تماس باشید.
                            </p>
                            <div className="mt-8 space-y-3">
                                <a
                                    href="mailto:info@bourseazma.ir"
                                    className="landing-contact-link"
                                >
                                    <Mail className="h-5 w-5 text-[#00E5C9]"/>
                                    info@bourseazma.ir
                                </a>
                                <a
                                    href="https://github.com/bourse-azma"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="landing-contact-link"
                                >
                                    <Github className="h-5 w-5 text-[#FFB300]"/>
                                    github.com/bourse-azma
                                </a>
                            </div>

                            <div className="landing-map mt-8">
                                <MapPinned className="h-6 w-6 text-[#FFB300]"/>
                                <p className="text-sm font-semibold text-white">تهران، مرکزی</p>
                            </div>
                        </div>

                        <form className="landing-contact-form" onSubmit={submitContact}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span
                                        className="mb-2 block text-xs font-bold text-white/68">نام و نام خانوادگی</span>
                                    <input className="landing-input" name="name" placeholder="نام شما"/>
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold text-white/68">ایمیل</span>
                                    <input className="landing-input" name="email" type="email"
                                           placeholder="email@example.com" dir="ltr"/>
                                </label>
                            </div>
                            <label className="mt-4 block">
                                <span className="mb-2 block text-xs font-bold text-white/68">موضوع</span>
                                <input className="landing-input" name="subject" placeholder="موضوع پیام"/>
                            </label>
                            <label className="mt-4 block">
                                <span className="mb-2 block text-xs font-bold text-white/68">پیام</span>
                                <textarea className="landing-input min-h-32 resize-y" name="message"
                                          placeholder="پیام خود را بنویسید"/>
                            </label>
                            <button
                                type="submit"
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00E5C9] px-5 py-3 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8] sm:w-auto"
                            >
                                <Send className="h-4 w-4"/>
                                ارسال پیام
                            </button>
                            {contactStatus === 'sent' ? (
                                <p className="mt-3 text-xs font-semibold text-[#00E5C9]">
                                    برنامه ایمیل شما باز می‌شود. پیام را از آنجا ارسال کنید.
                                </p>
                            ) : null}
                        </form>
                    </div>
                </section>
            </main>

            <footer className="landing-footer landing-section border-t border-white/8 pt-12 text-right" dir="rtl">
                <div
                    className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-start gap-10 md:grid-cols-[1.35fr_0.65fr_0.8fr]">
                    <div>
                        <BourseAzmaLogo/>
                        <p className="max-w-md text-sm font-medium leading-7 text-[#AFC1D8]">
                            بورس‌آزما فضای حرفه‌ای تمرین، آموزش و رقابت معامله‌گران بازار سرمایه ایران است.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">لینک‌های سریع</h3>
                        <div className="mt-3 grid gap-2">
                            {navItems.map((item) => (
                                <a key={item.href} href={item.href}
                                   className="text-sm font-semibold text-[#AFC1D8] hover:text-[#00E5C9]">
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">اطلاعات تماس</h3>
                        <div className="mt-4 grid gap-3 text-sm font-semibold text-[#AFC1D8]">
                            <a href="mailto:info@bourseazma.ir"
                               className="inline-flex items-center justify-start gap-2 text-right transition hover:text-[#00E5C9]">
                                <Mail className="h-4 w-4 shrink-0"/> <span dir="ltr">info@bourseazma.ir</span>
                            </a>
                            <span className="inline-flex items-center gap-2"><MapPinned
                                className="h-4 w-4 text-[#FFB300]"/> تهران، مرکزی</span>
                            <a href="https://github.com/bourse-azma" target="_blank" rel="noreferrer"
                               className="inline-flex items-center gap-2 transition hover:text-[#00E5C9]">
                                <Github className="h-4 w-4"/> گیت‌هاب بورس‌آزما
                            </a>
                        </div>
                    </div>
                </div>
                <div
                    className="mx-auto mt-10 flex w-[min(1180px,calc(100%-32px))] justify-center py-6 text-center text-xs font-semibold text-[#8EA6C4]">
                    <span>© ۲۰۲۶ بورس‌آزما. همه حقوق محفوظ است.</span>
                </div>
            </footer>
        </div>
    );
}
