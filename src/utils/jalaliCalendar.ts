import {toEnglishDigits} from './formatDateTime';

const JALALI_BREAKS: number[] = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

/** Must match Java integer division (truncate toward zero), not Math.floor. */
const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - div(a, b) * b;

const g2d = (gy: number, gm: number, gd: number) => {
    let d =
        div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
        div(153 * mod(gm + 9, 12) + 2, 5) +
        gd -
        34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
};

const d2g = (jdn: number) => {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return {gy, gm, gd};
};

const jalCal = (jy: number) => {
    const bl = JALALI_BREAKS.length;
    let gy = jy + 621;
    let leapJ = -14;
    let jp = JALALI_BREAKS[0];
    let jm = 0;
    let jump = 0;

    for (let i = 1; i < bl; i += 1) {
        jm = JALALI_BREAKS[i];
        jump = jm - jp;
        if (jy < jm) {
            break;
        }
        leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
        jp = jm;
    }

    let n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) {
        leapJ += 1;
    }

    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;

    if (jump - n < 6) {
        n = n - jump + div(jump + 4, 33) * 33;
    }

    let leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) {
        leap = 4;
    }

    return {gy, leap, march};
};

const j2d = (jy: number, jm: number, jd: number) => {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
};

export const jalaliToGregorian = (jy: number, jm: number, jd: number) => d2g(j2d(jy, jm, jd));

const d2j = (jdn: number) => {
    const {gy} = d2g(jdn);
    let jy = gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f;
    if (k >= 0) {
        if (k <= 185) {
            return {jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1};
        }
        k -= 186;
    } else {
        jy -= 1;
        k += 179;
        if (r.leap === 1) {
            k += 1;
        }
    }
    return {jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1};
};

export const gregorianToJalali = (gy: number, gm: number, gd: number) => d2j(g2d(gy, gm, gd));

const MS_PER_DAY = 86_400_000;

export const gregorianMsToParts = (timeMs: number) => {
    const date = new Date(timeMs);
    return {gy: date.getUTCFullYear(), gm: date.getUTCMonth() + 1, gd: date.getUTCDate()};
};

export const jalaliMonthStartMs = (timeMs: number) => {
    const {gy, gm, gd} = gregorianMsToParts(timeMs);
    const {jy, jm} = gregorianToJalali(gy, gm, gd);
    const g = jalaliToGregorian(jy, jm, 1);
    return Date.UTC(g.gy, g.gm - 1, g.gd);
};

export const jalaliYearStartMs = (timeMs: number) => {
    const {gy, gm, gd} = gregorianMsToParts(timeMs);
    const {jy} = gregorianToJalali(gy, gm, gd);
    const g = jalaliToGregorian(jy, 1, 1);
    return Date.UTC(g.gy, g.gm - 1, g.gd);
};

export const rollingWeekStartMs = (timeMs: number) => {
    const dayEpoch = Math.floor(timeMs / MS_PER_DAY);
    return Math.floor(dayEpoch / 7) * 7 * MS_PER_DAY;
};

export const formatJalaliDateParts = (jy: number, jm: number, jd: number) =>
    `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;

export const formatJalaliFromGregorian = (gy: number, gm: number, gd: number) => {
    const {jy, jm, jd} = gregorianToJalali(gy, gm, gd);
    return formatJalaliDateParts(jy, jm, jd);
};

const isLikelyJalaliYear = (year: number) => year >= 1200 && year <= 1500;

const compactDateMatch = (value: string) => {
    const normalized = toEnglishDigits(value).trim();
    const match = normalized.match(/^(\d{4})(\d{2})(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!match) {
        return null;
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
    };
};

const normalizeCompactDeven = (compact: number) => {
    const year = Math.floor(compact / 10_000);
    if (isLikelyJalaliYear(year)) {
        const month = Math.floor((compact % 10_000) / 100);
        const day = compact % 100;
        const {gy, gm, gd} = jalaliToGregorian(year, month, day);
        return gy * 10_000 + gm * 100 + gd;
    }
    return compact;
};

export const parseTsetmcEventDateToMs = (eventDate: string | number | null | undefined): number | null => {
    if (eventDate === null || eventDate === undefined) {
        return null;
    }

    if (typeof eventDate === 'number') {
        if (eventDate >= 10_000_000 && eventDate <= 99_999_999) {
            const gregorianDeven = normalizeCompactDeven(eventDate);
            const year = Math.floor(gregorianDeven / 10_000);
            const month = Math.floor((gregorianDeven % 10_000) / 100);
            const day = gregorianDeven % 100;
            return Date.UTC(year, month - 1, day);
        }
        if (eventDate > 1_000_000_000_000) {
            return eventDate;
        }
        if (eventDate > 1_000_000_000) {
            return eventDate * 1000;
        }
        return null;
    }

    const trimmed = toEnglishDigits(eventDate).trim();
    if (trimmed === '') {
        return null;
    }

    const compact = compactDateMatch(trimmed);
    if (compact) {
        const gregorianDeven = normalizeCompactDeven(
            compact.year * 10_000 + compact.month * 100 + compact.day
        );
        const year = Math.floor(gregorianDeven / 10_000);
        const month = Math.floor((gregorianDeven % 10_000) / 100);
        const day = gregorianDeven % 100;
        return Date.UTC(year, month - 1, day);
    }

    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
};
