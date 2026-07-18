import OrderBookPanel from '../../symbol-search/OrderBookPanel';
import OrderBookDepthPanel from '../../symbol-search/OrderBookDepthPanel';
import PeerGroupPanel from '../../symbol-search/PeerGroupPanel';
import TechnicalChartPanel from '../../technical-chart/TechnicalChartPanel';
import {cardClass} from '../styles';
import {
    formatCompactAmountFa,
    formatDepthPercent,
    formatNumberOrDash,
    formatOrderBookValue,
    formatPercentOrDash
} from '../formatters';
import type {TradingDashboardVm} from './types';

export function OrderBookSection({vm, accessToken}: { vm: TradingDashboardVm; accessToken: string }) {
    return (
        <>
            <section dir="rtl" className={`${cardClass} self-start p-3 md:col-span-2 xl:col-span-6`}>
                {vm.symbolLoading && !vm.activeSymbolData ? (
                    <div className="animate-pulse">
                        <div className="mb-3">
                            <div className="h-5 w-24 rounded bg-border/60"/>
                            <div className="mt-2 h-4 w-32 rounded bg-border/45"/>
                        </div>
                        <div className="mb-3 h-24 rounded-2xl bg-surface-2/60"/>
                        <div className="h-64 rounded-2xl border border-border/70 bg-surface-2/60"/>
                        <div className="mt-3 h-24 rounded-2xl bg-surface-2/60"/>
                    </div>
                ) : (
                    <>
                        <div className="mb-3">
                            <h2 className="text-sm font-semibold text-text">دفتر سفارشات اختصاصی شما</h2>
                            <p className="text-xs text-muted">{vm.activeSymbolSummary}</p>
                        </div>

                        {vm.symbolError && !vm.activeSymbolData ? (
                            <div
                                className="mb-3 rounded-xl border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
                                <div className="flex items-center justify-between gap-2">
                                    <span>{vm.symbolError}</span>
                                    <button
                                        type="button"
                                        onClick={vm.refreshSymbolDetails}
                                        className="rounded-full border border-negative/35 bg-negative/10 px-2.5 py-1 text-[11px] font-semibold transition hover:bg-negative/15"
                                    >
                                        تلاش مجدد
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        <div className="mb-3 rounded-xl border border-border/70 bg-surface-2 p-1">
                            <div className="grid grid-cols-3 gap-1 text-xs">
                                {vm.orderbookTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => vm.setOrderbookTab(tab.key)}
                                        className={`rounded-lg px-2 py-1.5 text-center transition ${
                                            vm.orderbookTab === tab.key
                                                ? 'bg-surface text-text shadow-sm'
                                                : 'text-muted hover:text-text'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {vm.orderbookTab === 'peers' ? (
                            <PeerGroupPanel
                                rows={vm.peerGroupRows}
                                sectorName={vm.peerGroupSectorName}
                                activeSymbol={vm.selectedSymbol.symbol}
                                loading={vm.peerGroupLoading}
                                error={vm.peerGroupError}
                                onRetry={vm.refreshPeerGroup}
                                onSelectSymbol={vm.handleSelectSymbol}
                                formatNumber={formatOrderBookValue}
                                formatCompactAmount={formatCompactAmountFa}
                                formatPercent={formatPercentOrDash}
                            />
                        ) : vm.orderbookTab === 'technical' ? (
                            <TechnicalChartPanel
                                instrumentCode={vm.selectedSymbol.instrumentCode}
                                accessToken={accessToken}
                                symbol={vm.selectedSymbol.symbol}
                                symbolName={vm.selectedSymbol.name}
                            />
                        ) : (
                            <>
                                <div
                                    className="mb-3 rounded-2xl border border-border/70 bg-surface-2 p-3 sm:p-4">
                                    <div
                                        className="mb-2 text-center text-[11px] font-medium text-muted sm:mb-3 sm:text-xs">بازه
                                        مجاز
                                        روزانه
                                    </div>
                                    <div
                                        className="grid grid-cols-[56px_1fr] items-center gap-2 text-xs sm:grid-cols-[74px_1fr] sm:gap-3 [direction:ltr]">
                <span
                    className={`text-left text-sm font-bold tabular-nums ${
                        vm.symbolPercent === null ? 'text-muted' : vm.symbolPositive ? 'text-positive' : 'text-negative'
                    }`}
                >
                  {formatNumberOrDash(vm.symbolPrice)}
                </span>

                                        <div>
                                            <div
                                                className="mb-1 flex items-center justify-between text-[11px] text-muted">
                                                                <span
                                                                    className="tabular-nums">{formatNumberOrDash(vm.dailyMin)}</span>
                                                <span
                                                    className="tabular-nums">{formatNumberOrDash(vm.dailyMax)}</span>
                                            </div>

                                            <div className="relative h-2 rounded-full bg-border/45">
                                                <div
                                                    className={`absolute inset-y-0 left-0 rounded-full ${vm.symbolPositive ? 'bg-positive/20' : 'bg-negative/20'}`}
                                                    style={{width: `${vm.markerPercent}%`}}
                                                />
                                                <div
                                                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-surface shadow-card ${
                                                        vm.symbolPositive ? 'bg-positive' : 'bg-negative'
                                                    }`}
                                                    style={{left: `calc(${vm.markerPercent}% - 8px)`}}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-border/70">
                                    <OrderBookPanel
                                        rows={vm.orderBookRows}
                                        formatNumber={formatOrderBookValue}
                                        embedded
                                    />

                                    <div className="border-t border-border/60 bg-surface-2 p-3">
                                        <OrderBookDepthPanel
                                            rows={vm.depthRows}
                                            formatCount={formatOrderBookValue}
                                            formatVolume={formatCompactAmountFa}
                                            formatPercent={formatDepthPercent}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </section>
        </>
    );
}
