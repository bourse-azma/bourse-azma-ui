import {Bell, Building2, Flame, Wallet} from 'lucide-react';
import type {SidebarTab} from '../types';
import type {TradingDashboardVm} from './types';

const tabs: Array<{ id: SidebarTab; label: string; icon: typeof Bell }> = [
    {id: 'watchlist', label: 'دیده‌بان', icon: Bell},
    {id: 'popular', label: 'پرطرفدار', icon: Flame},
    {id: 'industries', label: 'صنایع', icon: Building2},
    {id: 'wallet', label: 'کیف پول', icon: Wallet},
];

export function MobileSidebarNav({vm}: { vm: TradingDashboardVm }) {
    if (vm.mainNavTab !== 'بازار') return null;

    return (
        <nav dir="rtl" className="border-t border-border/40 bg-surface/90 px-3 py-1.5 md:hidden">
            <div className="thin-scrollbar mx-auto flex max-w-[1800px] items-center gap-1.5 overflow-x-auto">
                {tabs.map(({id, label, icon: Icon}) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => vm.openSidebarDrawer(id)}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                            vm.drawerOpen && vm.sidebarTab === id
                                ? 'border-primary/30 bg-primary/10 text-primary'
                                : 'border-border/70 bg-surface-2 text-muted hover:text-text'
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5"/>
                        {label}
                    </button>
                ))}
            </div>
        </nav>
    );
}
