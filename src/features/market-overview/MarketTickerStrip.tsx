import {useEffect, useRef, useState} from 'react';
import type {LandingTickerItem} from './useLandingMarketData';

type MarketTickerStripProps = {
    items: LandingTickerItem[];
};

const formatPrice = (value: number) => Math.round(value).toLocaleString('en-US');
const formatChange = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

export default function MarketTickerStrip({items}: MarketTickerStripProps) {
    const [orderedItems, setOrderedItems] = useState<LandingTickerItem[]>([]);
    const orderRef = useRef<string[]>([]);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const firstGroupRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (items.length === 0) return;
        if (orderRef.current.length === 0) {
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            orderRef.current = shuffled.map((item) => item.instrumentCode);
        }
        const byCode = new Map(items.map((item) => [item.instrumentCode, item]));
        const stable = orderRef.current.map((code) => byCode.get(code)).filter((item): item is LandingTickerItem => Boolean(item));
        const additions = items.filter((item) => !orderRef.current.includes(item.instrumentCode));
        orderRef.current.push(...additions.map((item) => item.instrumentCode));
        setOrderedItems([...stable, ...additions]);
    }, [items]);

    useEffect(() => {
        const track = trackRef.current;
        const group = firstGroupRef.current;
        if (!track || !group) return;

        const syncAnimation = () => {
            const distance = group.getBoundingClientRect().width;
            if (distance <= 0) return;
            track.style.setProperty('--ticker-distance', `${distance}px`);
            // Keep the speed independent of item count so all 40 symbols remain readable.
            track.style.setProperty('--ticker-duration', `${Math.max(90, distance / 24)}s`);
        };
        syncAnimation();
        const observer = new ResizeObserver(syncAnimation);
        observer.observe(group);
        return () => observer.disconnect();
    }, [orderedItems.length]);

    const renderTickerGroup = (copy: number) => (
        <div ref={copy === 0 ? firstGroupRef : undefined} className="landing-ticker-group" aria-hidden={copy > 0}>
            {orderedItems.map((item) => {
                const isPositive = item.changePercent >= 0;
                return (
                    <span key={`${item.instrumentCode}-${copy}`} className="landing-ticker-item">
                        <span className="landing-ticker-symbol">{item.symbol}</span>
                        <span className="landing-ticker-price" dir="ltr">{formatPrice(item.price)}</span>
                        <span
                            className={isPositive ? 'landing-ticker-change-positive' : 'landing-ticker-change-negative'}
                            dir="ltr">
                            {formatChange(item.changePercent)}
                        </span>
                    </span>
                );
            })}
        </div>
    );

    return (
        <div className="landing-ticker" dir="ltr" aria-label="نمای زنده ۴۰ نماد پربازدید بازار">
            <div ref={trackRef} className="landing-ticker-track">
                {orderedItems.length > 0 ? (
                    <>{renderTickerGroup(0)}{renderTickerGroup(1)}</>
                ) : (
                    <span className="landing-ticker-item">در حال دریافت نمادهای پربازدید بازار...</span>
                )}
            </div>
        </div>
    );
}
