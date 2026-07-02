import {Bell, Building2, Flame, Wallet,} from 'lucide-react';
import type {SidebarTab} from '../../trading-dashboard/types';

type SidebarTabBarProps = {
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
};

const tabs: Array<{ id: SidebarTab; label: string; icon: typeof Bell }> = [
    {id: 'watchlist', label: 'دیده‌بان', icon: Bell},
    {id: 'popular', label: 'پرطرفدار', icon: Flame},
    {id: 'industries', label: 'صنایع', icon: Building2},
    {id: 'wallet', label: 'کیف پول', icon: Wallet},
];

export function SidebarTabBar({activeTab, onTabChange}: SidebarTabBarProps) {
    return (
        <div className="mb-3 border-b border-border/70 pb-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {tabs.map(({id, label, icon: Icon}) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onTabChange(id)}
                        className={`relative inline-flex items-center gap-1.5 rounded-lg px-1 py-1 transition ${
                            activeTab === id ? 'text-text' : 'text-muted hover:text-text'
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5"/>
                        {label}
                        {activeTab === id ? (
                            <span className="absolute inset-x-0 -bottom-[8px] h-0.5 rounded-full bg-primary"/>
                        ) : null}
                    </button>
                ))}
            </div>
        </div>
    );
}
