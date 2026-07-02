import {formatNumberFa, formatSignedNumberFa, ltrNumericClassName} from '../../utils/numberFormat';

type WalletReportsSummaryProps = {
    currentBalance: number;
    totalCount: number;
    totalNet: number;
    inflowCount: number;
    outflowCount: number;
};

export default function WalletReportsSummary({
                                                 currentBalance,
                                                 totalCount,
                                                 totalNet,
                                                 inflowCount,
                                                 outflowCount,
                                             }: WalletReportsSummaryProps) {
    return (
        <div className="border-b border-border/50 bg-surface-2/40 px-4 py-4 sm:px-5">
            <div
                className="rounded-2xl border border-primary/15 bg-gradient-to-l from-primary/8 via-surface to-surface p-4">
                <p className="text-[11px] font-medium text-muted">موجودی فعلی کیف پول</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-text sm:text-3xl">
                    {formatNumberFa(currentBalance)}
                    <span className="mr-1.5 text-sm font-medium text-muted">ریال</span>
                </p>
            </div>

            {totalCount > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-surface px-3 py-2.5">
                        <p className="text-[10px] text-muted">تعداد تراکنش</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-text">{formatNumberFa(totalCount)}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-surface px-3 py-2.5">
                        <p className="text-[10px] text-muted">خالص واریز و برداشت</p>
                        <p className={`mt-0.5 text-sm font-bold ${ltrNumericClassName} ${totalNet >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {formatSignedNumberFa(totalNet)}
                            <span className="mr-1 text-[10px] font-medium text-muted">ریال</span>
                        </p>
                    </div>
                    <div className="rounded-xl border border-positive/20 bg-positive/5 px-3 py-2.5">
                        <p className="text-[10px] text-positive/80">افزایش موجودی</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-positive">{formatNumberFa(inflowCount)}</p>
                    </div>
                    <div className="rounded-xl border border-negative/20 bg-negative/5 px-3 py-2.5">
                        <p className="text-[10px] text-negative/80">کاهش موجودی</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-negative">{formatNumberFa(outflowCount)}</p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
