import {FormEvent} from 'react';
import {Github, Mail, MapPinned, Send} from 'lucide-react';

type ContactSectionProps = {
    contactStatus: 'idle' | 'sent';
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ContactSection({contactStatus, onSubmit}: ContactSectionProps) {
    return (
        <section id="contact" className="landing-section py-20 sm:py-24">
            <div className="landing-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                    <span className="text-sm font-black text-[#00E5C9]">ارتباط با ما</span>
                    <h2 className="mt-3 text-3xl font-black leading-[1.45] text-white sm:text-4xl">
                        همکاری و ارتباط با ما
                    </h2>
                    <p className="mt-4 text-sm font-medium leading-8 text-[#AFC1D8]">
                        برای همکاری، دریافت دمو یا طرح پرسش، از طریق فرم یا ایمیل با ما در تماس باشید.
                    </p>
                    <div className="mt-8 space-y-3">
                        <a href="mailto:info@bourseazma.ir" className="landing-contact-link">
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
                        <MapPinned className="h-6 w-6 shrink-0 text-[#FFB300]"/>
                        <p className="text-sm font-semibold text-white leading-relaxed">ایران، تهران، چیتگر، برج رزمال، طبقه هشتم، گروه توسعه نرم‌افزاری آوین</p>
                    </div>
                </div>

                <form className="landing-contact-form" onSubmit={onSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold text-white/68">نام و نام خانوادگی</span>
                            <input className="landing-input" name="name" placeholder="نام شما"/>
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold text-white/68">ایمیل</span>
                            <input className="landing-input" name="email" type="email" placeholder="email@example.com"
                                   dir="ltr"/>
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
    );
}
