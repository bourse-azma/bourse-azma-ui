export const authInputClassName = 'landing-input w-full rounded-xl px-3 py-2.5 text-sm';
export const authButtonSecondaryClassName =
    'inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs font-bold text-white transition hover:border-[#00E5C9]/35';

export const loginDescription = 'با نام کاربری یا ایمیل وارد شوید.';
export const registerDescription = 'حساب جدید بسازید و مستقیم وارد داشبورد شوید.';

export const INITIAL_BALANCE_PRESETS = [
    {value: 10_000_000, label: '۱۰ میلیون'},
    {value: 50_000_000, label: '۵۰ میلیون'},
    {value: 100_000_000, label: '۱۰۰ میلیون'},
] as const;
