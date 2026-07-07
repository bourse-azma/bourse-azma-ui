import {useEffect, useMemo, useState} from 'react';
import MarketOverviewSection from '../market-overview/MarketOverviewSection';
import MarketTickerStrip from '../market-overview/MarketTickerStrip';
import {buildTickerItems, useLandingMarketData} from '../market-overview/useLandingMarketData';
import {FeaturesSection} from './components/FeaturesSection';
import {LandingFooter} from './components/LandingFooter';
import {LandingHeader} from './components/LandingHeader';

type MarketPageProps = {
    isAuthenticated: boolean;
    onDashboard: () => void;
    onLogin: () => void;
    onRegister: () => void;
};

export default function MarketPage({isAuthenticated, onDashboard, onLogin, onRegister}: MarketPageProps) {
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

            <main className="pt-24 pb-16">
                <MarketTickerStrip items={tickerItems}/>
                <MarketOverviewSection
                    data={marketData}
                    isAuthenticated={isAuthenticated}
                    onLogin={onLogin}
                    onRegister={onRegister}
                />
                <FeaturesSection/>
            </main>

            <LandingFooter/>
        </div>
    );
}
