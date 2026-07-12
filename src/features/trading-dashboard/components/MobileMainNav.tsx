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
    return (
        <nav dir="rtl" className="border-t border-border/40 bg-surface/90 px-3 py-1.5 xl:hidden">
            <div className="mx-auto w-full max-w-[1800px] space-y-1.5">
                <div aria-label="بخش‌های اصلی"
                     className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2/80 p-1 ring-1 ring-border/60">
                    {vm.mainNavTabs.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => vm.setMainNavTab(item)}
                            className={`min-w-0 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
                                vm.mainNavTab === item
                                    ? 'bg-surface text-primary shadow-sm ring-1 ring-primary/20'
                                    : 'text-muted hover:bg-surface/60'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div aria-label="ابزارهای بازار" className="grid grid-cols-4 gap-1">
                    {sidebarTabs.map(({id, label, icon: Icon}) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => vm.openSidebarDrawer(id)}
                            className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-1 text-[9px] font-medium transition ${
                                vm.drawerOpen && vm.sidebarTab === id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted hover:bg-surface-2'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5 shrink-0"/>
                            <span className="max-w-full truncate">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}
