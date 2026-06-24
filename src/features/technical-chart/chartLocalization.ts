import type {Time} from 'lightweight-charts';
import {TickMarkType} from 'lightweight-charts';
import {
    formatJalaliDateParts,
    formatJalaliFromGregorian,
    gregorianMsToParts,
    gregorianToJalali,
} from '../../utils/jalaliCalendar';
import type {ChartTimeframe} from './chartConfig';
import type {ChartBar} from './mapChartBars';

type WeeklyRange = {
    startMs: number;
    endMs: number;
    startLabel: string;
    endLabel: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

let weeklyRanges: WeeklyRange[] = [];
const weeklyByBusinessDayKey = new Map<string, WeeklyRange>();

const businessDayKey = (gy: number, gm: number, gd: number) =>
    `${gy}-${gm}-${gd}`;

const businessDayToMs = (gy: number, gm: number, gd: number) => Date.UTC(gy, gm - 1, gd);

const formatMsAsJalali = (timeMs: number) => {
    const {gy, gm, gd} = gregorianMsToParts(timeMs);
    return formatJalaliFromGregorian(gy, gm, gd);
};

const formatWeeklyCrosshairLabel = (range: WeeklyRange) => {
    if (range.startLabel === range.endLabel) {
        return range.startLabel;
    }
    return `${range.startLabel} to ${range.endLabel}`;
};

const registerWeeklyRange = (range: WeeklyRange) => {
    const startParts = gregorianMsToParts(range.startMs);
    const endParts = gregorianMsToParts(range.endMs);
    weeklyByBusinessDayKey.set(businessDayKey(startParts.gy, startParts.gm, startParts.gd), range);
    weeklyByBusinessDayKey.set(businessDayKey(endParts.gy, endParts.gm, endParts.gd), range);
};

export const syncWeeklyPeriodLabels = (bars: ChartBar[]) => {
    weeklyRanges = [];
    weeklyByBusinessDayKey.clear();

    for (const bar of bars) {
        const periodStartMs = bar.periodStartMs ?? bar.time;
        const periodEndMs = bar.periodEndMs ?? bar.time;
        const range: WeeklyRange = {
            startMs: periodStartMs,
            endMs: periodEndMs,
            startLabel: formatMsAsJalali(periodStartMs),
            endLabel: formatMsAsJalali(periodEndMs),
        };
        weeklyRanges.push(range);
        registerWeeklyRange(range);
    }

    weeklyRanges.sort((left, right) => left.startMs - right.startMs);
};

export const clearWeeklyPeriodLabels = () => {
    weeklyRanges = [];
    weeklyByBusinessDayKey.clear();
};

const lookupWeeklyRange = (gy: number, gm: number, gd: number): WeeklyRange | null => {
    const exact = weeklyByBusinessDayKey.get(businessDayKey(gy, gm, gd));
    if (exact) {
        return exact;
    }

    const timeMs = businessDayToMs(gy, gm, gd);

    for (const range of weeklyRanges) {
        if (timeMs >= range.startMs && timeMs <= range.endMs) {
            return range;
        }
    }

    let nearest: WeeklyRange | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const range of weeklyRanges) {
        const distance = Math.min(
            Math.abs(timeMs - range.startMs),
            Math.abs(timeMs - range.endMs)
        );
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = range;
        }
    }

    if (nearest && nearestDistance <= 4 * MS_PER_DAY) {
        return nearest;
    }

    return null;
};

const formatWeeklyCrosshairLabelFromParts = (gy: number, gm: number, gd: number) => {
    const range = lookupWeeklyRange(gy, gm, gd);
    if (range) {
        return formatWeeklyCrosshairLabel(range);
    }
    return formatJalaliFromGregorian(gy, gm, gd);
};

/** Axis ticks: show the week start date (e.g. 1405/04/01). */
const formatWeeklyTickLabel = (gy: number, gm: number, gd: number) => {
    const range = lookupWeeklyRange(gy, gm, gd);
    if (range) {
        return range.startLabel;
    }
    return formatJalaliFromGregorian(gy, gm, gd);
};

const businessDayFromTime = (time: Time): { gy: number; gm: number; gd: number } | null => {
    if (typeof time === 'number') {
        const date = new Date(time * 1000);
        return {gy: date.getUTCFullYear(), gm: date.getUTCMonth() + 1, gd: date.getUTCDate()};
    }
    if (typeof time === 'string') {
        const [year, month, day] = time.split('-').map(Number);
        if (!year || !month || !day) {
            return null;
        }
        return {gy: year, gm: month, gd: day};
    }
    if ('year' in time) {
        return {gy: time.year, gm: time.month, gd: time.day};
    }
    return null;
};

const formatForTimeframe = (gy: number, gm: number, gd: number, timeframe: ChartTimeframe) => {
    if (timeframe === '1W') {
        return formatWeeklyCrosshairLabelFromParts(gy, gm, gd);
    }
    const {jy, jm, jd} = gregorianToJalali(gy, gm, gd);
    switch (timeframe) {
        case '12M':
            return String(jy);
        case '1M':
            return formatJalaliDateParts(jy, jm, 1);
        case '1D':
        default:
            return formatJalaliDateParts(jy, jm, jd);
    }
};

export const buildChartLocalization = (timeframe: ChartTimeframe) => ({
    locale: 'en-US',
    dateFormat: 'yyyy/MM/dd',
    timeFormatter: (time: Time) => {
        const parts = businessDayFromTime(time);
        if (!parts) {
            return '';
        }
        return formatForTimeframe(parts.gy, parts.gm, parts.gd, timeframe);
    },
});

export const buildTickMarkFormatter = (timeframe: ChartTimeframe) =>
    (time: Time, tickMarkType: TickMarkType) => {
        const parts = businessDayFromTime(time);
        if (!parts) {
            return null;
        }

        if (timeframe === '1W') {
            return formatWeeklyTickLabel(parts.gy, parts.gm, parts.gd);
        }

        if (timeframe === '12M') {
            const {jy} = gregorianToJalali(parts.gy, parts.gm, parts.gd);
            return String(jy);
        }

        if (timeframe === '1M') {
            const {jy, jm} = gregorianToJalali(parts.gy, parts.gm, parts.gd);
            if (tickMarkType === TickMarkType.Year) {
                return String(jy);
            }
            return `${jy}/${String(jm).padStart(2, '0')}`;
        }

        if (tickMarkType === TickMarkType.Year) {
            const {jy} = gregorianToJalali(parts.gy, parts.gm, parts.gd);
            return String(jy);
        }

        return formatJalaliFromGregorian(parts.gy, parts.gm, parts.gd);
    };
