import type {TradingDashboardVm} from './types';

export function MobileMainNav({vm}: { vm: TradingDashboardVm }) {
    return (
        <>
            <nav
                dir="rtl"
                className="border-t border-border/40 bg-surface/90 px-3 py-1.5 xl:hidden"
            >
                <div className="thin-scrollbar mx-auto flex max-w-[1800px] items-center gap-1 overflow-x-auto">
                    {vm.mainNavTabs.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => vm.setMainNavTab(item)}
                            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                                vm.mainNavTab === item
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border/70 bg-surface text-muted'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </nav>
        </>
    );
}
