export type ChartBar = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    /** First calendar day of a weekly bucket (inclusive). */
    periodStartMs?: number;
    /** Last calendar day of a weekly bucket (inclusive). */
    periodEndMs?: number;
    /** True for the most recent weekly candle (open week → present). */
    isLatestPeriod?: boolean;
};
