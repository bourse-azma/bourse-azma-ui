import {toEnglishDigits} from '../../utils/formatDateTime';
import type {JalaliDateParts} from '../notices/filterState';

export const parseJalaliDateTime = (value: string) => {
    const normalized = toEnglishDigits(value).trim();
    const match = normalized.match(
        /(?<year>\d{4})\/(?<month>\d{1,2})\/(?<day>\d{1,2})(?:\s+(?<hour>\d{1,2}):(?<minute>\d{1,2})(?::(?<second>\d{1,2}))?)?/
    );

    if (!match?.groups) return null;

    const year = Number(match.groups.year);
    const month = Number(match.groups.month);
    const day = Number(match.groups.day);
    const hour = Number(match.groups.hour ?? '0');
    const minute = Number(match.groups.minute ?? '0');
    const second = Number(match.groups.second ?? '0');

    if ([year, month, day, hour, minute, second].some((part) => Number.isNaN(part))) return null;

    const dateKey = Number(
        `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
    );

    const dateTimeKey = Number(
        `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day
            .toString()
            .padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute
            .toString()
            .padStart(2, '0')}${second.toString().padStart(2, '0')}`
    );

    return {year, month, day, dateKey, dateTimeKey};
};

export const dateKeyFromParts = (parts: JalaliDateParts) =>
    Number(
        `${parts.year.toString().padStart(4, '0')}${parts.month
            .toString()
            .padStart(2, '0')}${parts.day.toString().padStart(2, '0')}`
    );

export const stripHtml = (value: string) =>
    value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n')
        .trim();

export const parseNumberish = (value: string) => {
    const normalized = toEnglishDigits(value).replace(/[,_\s\u066C\u060C]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
};
