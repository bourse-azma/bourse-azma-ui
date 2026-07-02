import {
    Activity,
    ChartCandlestick,
    GraduationCap,
    type LucideIcon,
    MonitorUp,
    Radar,
    ShieldCheck,
    Trophy,
} from 'lucide-react';

export type LandingFeature = {
    title: string;
    description: string;
    icon: LucideIcon;
    accent: 'teal' | 'gold';
};

export const navItems = [
    {label: 'صفحه اصلی', href: '#home'},
    {label: 'نمای بازار', href: '#market'},
    {label: 'معرفی', href: '#about'},
    {label: 'ارتباط با ما', href: '#contact'},
] as const;

export const trustSignals = ['داده‌های زنده بازار', 'سرمایه دمو قابل تنظیم', 'تمرین روی نمادهای واقعی'];

export const features: LandingFeature[] = [
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

export const teamMembers = [
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
] as const;
