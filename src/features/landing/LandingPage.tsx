import {FormEvent, useEffect, useState} from 'react';
import {AboutSection} from './components/AboutSection';
import {ContactSection} from './components/ContactSection';
import {HeroSection} from './components/HeroSection';
import {LandingFooter} from './components/LandingFooter';
import {LandingHeader} from './components/LandingHeader';

type LandingPageProps = {
    isAuthenticated: boolean;
    onDashboard: () => void;
    onLogin: () => void;
    onRegister: () => void;
};

export default function LandingPage({isAuthenticated, onDashboard, onLogin, onRegister}: LandingPageProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [contactStatus, setContactStatus] = useState<'idle' | 'sent'>('idle');

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
            <LandingHeader
                isScrolled={isScrolled}
                menuOpen={menuOpen}
                onToggleMenu={() => setMenuOpen((current) => !current)}
                onCloseMenu={() => setMenuOpen(false)}
                isAuthenticated={isAuthenticated}
                onDashboard={onDashboard}
                onLogin={onLogin}
                onRegister={onRegister}
            />

            <main>
                <HeroSection
                    isAuthenticated={isAuthenticated}
                    onDashboard={onDashboard}
                    onLogin={onLogin}
                    onRegister={onRegister}
                />
                <AboutSection/>
                <ContactSection contactStatus={contactStatus} onSubmit={submitContact}/>
            </main>

            <LandingFooter/>
        </div>
    );
}
