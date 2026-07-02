import {cardClass} from '../styles';
import {SymbolNoticesPanel} from './SymbolNoticesPanel';
import {SymbolPriceCard} from './SymbolPriceCard';
import type {TradingDashboardVm} from './types';

export function SymbolInfoSection({vm}: { vm: TradingDashboardVm }) {
    return (
        <section dir="rtl" className={`${cardClass} self-start p-3 md:col-span-1 xl:col-span-3`}>
            <SymbolPriceCard vm={vm}/>

            <div className="mt-3 rounded-xl border border-border/70 bg-surface-2 p-1">
                <div className="grid grid-cols-2 gap-1 text-xs">
                    <button
                        type="button"
                        onClick={() => vm.setSymbolTab('notices')}
                        className={`rounded-lg px-2 py-2 transition ${
                            vm.symbolTab === 'notices' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                        }`}
                    >
                        اطلاعیه‌ها
                    </button>
                    <button
                        type="button"
                        onClick={() => vm.setSymbolTab('details')}
                        className={`rounded-lg px-2 py-2 transition ${
                            vm.symbolTab === 'details' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                        }`}
                    >
                        جزئیات نماد
                    </button>
                </div>
            </div>

            <SymbolNoticesPanel vm={vm}/>
        </section>
    );
}
