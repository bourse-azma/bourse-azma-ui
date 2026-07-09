import {Github} from 'lucide-react';
import {teamMembers} from '../constants';

export function AboutSection() {
    return (
        <section id="about" className="landing-section border-y border-white/8 bg-white/[0.025] py-20 sm:py-24">
            <div className="landing-container grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <div>
                    <span className="text-sm font-black text-[#FFB300]">معرفی</span>
                    <h2 className="mt-3 text-3xl font-black leading-[1.45] text-white sm:text-4xl">درباره بورس‌آزما</h2>
                    <p className="mt-6 text-base font-medium leading-9 text-[#D8E6F7]">
                        بورس‌آزما پلتفرمی برای تمرین معامله‌گری روی داده‌های واقعی بازار سرمایه ایران است.
                        اینجا می‌توانید بدون ریسک سرمایه واقعی، استراتژی بسازید، سفارش ثبت کنید و عملکرد خود را بسنجید.
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
    );
}
