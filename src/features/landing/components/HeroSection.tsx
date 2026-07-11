import {ArrowLeft, BadgeCheck, ChevronLeft, Sparkles} from 'lucide-react';
import heroImage from '../../../assets/boors-azma-hero-fintech.png';
import {trustSignals} from '../constants';

type HeroSectionProps = {
    isAuthenticated: boolean;
    onDashboard: () => void;
    onLogin: () => void;
    onRegister: () => void;
};

export function HeroSection({isAuthenticated, onDashboard, onLogin, onRegister}: HeroSectionProps) {
    return (
        <section id="home" className="landing-hero relative flex min-h-[92svh] items-center overflow-hidden pt-24">
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
                        سامانه حرفه ای معاملات بورس تهران
                    </div>
                    <h1 className="max-w-4xl text-4xl font-black leading-[1.35] text-white sm:text-5xl lg:text-7xl">
                        معاملاتی امن، سریع و دقیق را تجربه کنید
                    </h1>
                    <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#D8E6F7] sm:text-lg">
                        بورس آزما پلتفرمی کارآمد با بالاترین استانداردهای امنیتی برای انجام معاملات، مدیریت سرمایه و تحلیل بازار سرمایه ایران است. این پروژه شامل پلتفرم بورس دیتا هم هست که به زودی در اختیار کاربران قرار خواهد گرفت.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={isAuthenticated ? onDashboard : onRegister}
                            className="landing-glow-button inline-flex items-center justify-center gap-2 rounded-lg bg-[#00E5C9] px-6 py-3.5 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8]"
                        >
                            شروع معامله‌گری
                            <ArrowLeft className="h-4 w-4"/>
                        </button>
                        {!isAuthenticated ? <button
                            type="button"
                            onClick={onLogin}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/16 bg-white/8 px-6 py-3.5 text-sm font-black text-white backdrop-blur transition hover:border-[#FFB300]/45 hover:bg-[#FFB300]/10"
                        >
                            ورود به حساب
                            <ChevronLeft className="h-4 w-4"/>
                        </button> : null}
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
    );
}
