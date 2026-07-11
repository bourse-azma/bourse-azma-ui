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
    {label: 'صفحه اصلی', href: '/'},
    {label: 'معرفی', href: '/#about'},
    {label: 'ارتباط با ما', href: '/#contact'},
] as const;

export const trustSignals = ['کاربری آسان', 'بسیار امن', 'سریع و دقیق'];

export const features: LandingFeature[] = [
    {
        title: 'معاملات سریع و مطمئن',
        description: 'خرید و فروش سهام در بازار سرمایه ایران با بالاترین سرعت و دقت، و تجربه‌ای بی‌نظیر از پایداری.',
        icon: ChartCandlestick,
        accent: 'teal',
    },
    {
        title: 'داشبورد حرفه‌ای تحلیل تکنیکال',
        description: 'نمایش قیمت، روندها، کندل‌ها و شاخص‌های تحلیلی در یک فضای یکپارچه و مناسب تصمیم‌گیری‌های حساس.',
        icon: MonitorUp,
        accent: 'gold',
    },
    {
        title: 'باشگاه مشتریان و رتبه‌بندی',
        description: 'رتبه‌بندی برترین معامله‌گران و ارائه خدمات ویژه به کاربران فعال برای بهبود عملکرد و مدیریت سرمایه.',
        icon: Trophy,
        accent: 'teal',
    },
    {
        title: 'رابط کاربری آسان و مدرن',
        description: 'طراحی شده برای استفاده ساده و بدون پیچیدگی، تا شما تنها روی معاملات و استراتژی‌های خود تمرکز کنید.',
        icon: GraduationCap,
        accent: 'gold',
    },
    {
        title: 'بالاترین سطح امنیت',
        description: 'استفاده از پروتکل‌های امنیتی پیشرفته برای حفاظت کامل از اطلاعات و دارایی‌های شما در تمامی مراحل معامله.',
        icon: ShieldCheck,
        accent: 'teal',
    },
];

export const teamMembers = [
    {
        name: 'مهندس عرفان داوودی نصر',
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
] as const;
