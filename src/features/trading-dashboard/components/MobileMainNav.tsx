import {Bell, Building2, Flame, Wallet} from 'lucide-react';
import type {SidebarTab} from '../types';
import type {TradingDashboardVm} from './types';

const sidebarTabs: Array<{ id: SidebarTab; label: string; icon: typeof Bell }> = [
    {id: 'watchlist', label: 'دیده‌بان', icon: Bell},
    {id: 'popular', label: 'پرطرفدار', icon: Flame},
    {id: 'industries', label: 'صنایع', icon: Building2},
    {id: 'wallet', label: 'کیف پول', icon: Wallet},
];

export function MobileMainNav({vm}: { vm: TradingDashboardVm }) {
    const showSidebarTabs = vm.mainNavTab === 'بازار';

    return (
        <nav dir="rtl" className="border-t border-border/40 bg-surface/90 px-3 py-1 xl:hidden">
            <div className="mx-auto w-full max-w-[1800px] space-y-1">
                <div className="thin-scrollbar flex items-center gap-1 overflow-x-auto">
                    {vm.mainNavTabs.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => vm.setMainNavTab(item)}
                            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                                vm.mainNavTab === item
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border/70 bg-surface text-muted'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {showSidebarTabs ? (
                    <div className="thin-scrollbar flex items-center gap-1 overflow-x-auto md:hidden">
                        {sidebarTabs.map(({id, label, icon: Icon}) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => vm.openSidebarDrawer(id)}
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                                    vm.drawerOpen && vm.sidebarTab === id
                                        ? 'border-primary/30 bg-primary/10 text-primary'
                                        : 'border-border/70 bg-surface-2 text-muted'
                                }`}
                            >
                                <Icon className="h-3 w-3"/>
                                {label}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
        </nav>
    );
}
