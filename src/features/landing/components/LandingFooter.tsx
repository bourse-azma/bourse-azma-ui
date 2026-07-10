import {Mail, MapPinned} from 'lucide-react';
import BourseAzmaLogo from '../../../components/BourseAzmaLogo';
import {navItems} from '../constants';
import {handleLandingNavClick} from '../landingNavigation';

export function LandingFooter() {
    return (
        <footer className="landing-footer landing-section border-t border-white/8 pt-12 text-right" dir="rtl">
            <div className="landing-container grid items-start gap-10 md:grid-cols-[1.35fr_0.65fr_0.8fr]">
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
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={(e) => handleLandingNavClick(e, item.href)}
                                className="text-sm font-semibold text-[#AFC1D8] hover:text-[#00E5C9]"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-black text-white">اطلاعات تماس</h3>
                    <div className="mt-4 grid gap-3 text-sm font-semibold text-[#AFC1D8]">
                        <a
                            href="mailto:info@bourseazma.ir"
                            className="inline-flex items-center justify-start gap-2 text-right transition hover:text-[#00E5C9]"
                        >
                            <Mail className="h-4 w-4 shrink-0"/> <span dir="ltr">info@bourseazma.ir</span>
                        </a>
                        <span className="inline-flex items-start gap-2">
                            <MapPinned className="h-4 w-4 shrink-0 text-[#FFB300] mt-0.5"/> <span
                            className="leading-relaxed">ایران، تهران، چیتگر، برج رزمال، طبقه هشتم، گروه توسعه نرم‌افزاری آوین</span>
                        </span>
                    </div>
                </div>
            </div>
            <div
                className="landing-container mt-10 flex justify-center py-6 text-center text-xs font-semibold text-[#8EA6C4]">
                <span>© ۲۰۲۶ بورس‌آزما. همه حقوق محفوظ است.</span>
            </div>
        </footer>
    );
}
