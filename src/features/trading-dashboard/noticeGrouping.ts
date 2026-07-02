import type {CodalNotice, NoticeGroup} from '../notices/types';
import {dateKeyFromParts, parseJalaliDateTime} from './jalaliNoticeUtils';
import {getNoticeSymbols} from './noticeSymbolUtils';
import type {NoticeUiFilters} from '../notices/filterState';

export function groupCodalNotices(
    codalNotices: CodalNotice[],
    noticeFilters: Pick<NoticeUiFilters, 'fromDate' | 'toDate' | 'underSupervisionOnly'>
): NoticeGroup[] {
    const fromDateKey = noticeFilters.fromDate ? dateKeyFromParts(noticeFilters.fromDate) : null;
    const toDateKey = noticeFilters.toDate ? dateKeyFromParts(noticeFilters.toDate) : null;
    const groups = new Map<string, NoticeGroup>();

    codalNotices.forEach((notice) => {
        const parsed = parseJalaliDateTime(notice.publishDateTime || notice.sentDateTime);
        if (fromDateKey !== null && (!parsed || parsed.dateKey < fromDateKey)) return;
        if (toDateKey !== null && (!parsed || parsed.dateKey > toDateKey)) return;
        const noticeSymbols = getNoticeSymbols(notice);

        const underSupervision =
            notice.supervision?.underSupervision === 1 || notice.underSupervision === 1;
        if (noticeFilters.underSupervisionOnly && !underSupervision) return;

        const key = `${notice.title.trim()}|${notice.publishDateTime}|${notice.letterCode}`;
        const existing = groups.get(key);

        if (!existing) {
            groups.set(key, {
                id: key,
                title: notice.title.trim() || 'بدون عنوان',
                publishDateTime: notice.publishDateTime || notice.sentDateTime || 'ناموجود',
                symbols: noticeSymbols,
                notices: [notice],
                hasUnderSupervision: underSupervision,
            });
            return;
        }

        existing.notices.push(notice);
        existing.hasUnderSupervision = existing.hasUnderSupervision || underSupervision;

        noticeSymbols.forEach((symbol) => {
            if (!existing.symbols.includes(symbol)) {
                existing.symbols.push(symbol);
            }
        });
    });

    return Array.from(groups.values()).sort((a, b) => {
        const aDate = parseJalaliDateTime(a.publishDateTime)?.dateTimeKey ?? 0;
        const bDate = parseJalaliDateTime(b.publishDateTime)?.dateTimeKey ?? 0;
        return bDate - aDate;
    });
}

export function collectNoticeYearOptions(codalNotices: CodalNotice[]): number[] {
    const years = new Set<number>();

    for (let year = 1404; year >= 1390; year -= 1) {
        years.add(year);
    }

    codalNotices.forEach((notice) => {
        const parsed = parseJalaliDateTime(notice.publishDateTime || notice.sentDateTime);
        if (parsed) years.add(parsed.year);
    });

    return Array.from(years).sort((a, b) => b - a);
}

export function earliestNoticeDateKey(codalNotices: CodalNotice[]): number | null {
    let minDate = Number.POSITIVE_INFINITY;
    codalNotices.forEach((notice) => {
        const parsed = parseJalaliDateTime(notice.publishDateTime || notice.sentDateTime);
        if (!parsed) return;
        if (parsed.dateKey < minDate) {
            minDate = parsed.dateKey;
        }
    });
    return Number.isFinite(minDate) ? minDate : null;
}
