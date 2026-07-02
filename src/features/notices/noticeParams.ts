import {clamp} from '../trading-dashboard/formatters';
import {getNoticeSymbols} from '../trading-dashboard/noticeSymbolUtils';
import {CODAL_MAX_PAGE_LENGTH} from './constants';
import type {CodalNotice, CodalNoticesQuery, NoticeGroup} from './types';

export const buildCodalNoticeParams = (query: CodalNoticesQuery) => {
    const params = new URLSearchParams();
    const safeLength = clamp(Math.floor(query.length), 1, CODAL_MAX_PAGE_LENGTH);
    params.set('includeAudited', String(query.includeAudited));
    params.set('auditorRef', String(query.auditorRef));
    params.set('categoryCode', String(query.categoryCode));
    params.set('includeChildCategories', String(query.includeChildCategories));
    params.set('companyState', String(query.companyState));
    params.set('companyType', String(query.companyType));
    params.set('includeConsolidated', String(query.includeConsolidated));
    params.set('isNotAuditedFilter', String(query.isNotAuditedFilter));
    params.set('length', String(safeLength));
    params.set('letterType', String(query.letterType));
    params.set('includeMainCategories', String(query.includeMainCategories));
    params.set('includeNotAudited', String(query.includeNotAudited));
    params.set('includeNotConsolidated', String(query.includeNotConsolidated));
    params.set('page', String(query.page));
    params.set('publisher', String(query.publisher));
    params.set('reportingType', String(query.reportingType));
    params.set('tracingNumber', String(query.tracingNumber));

    const symbol = query.symbol.trim();
    if (symbol !== '') {
        params.set('symbol', symbol);
    }

    return params;
};

export const toNoticeIdentityKey = (notice: CodalNotice) =>
    `${notice.tracingNumber}|${notice.symbol}|${notice.publishDateTime}|${notice.title}`;

export const toSingleNoticeGroup = (notice: CodalNotice): NoticeGroup => {
    const noticeSymbols = getNoticeSymbols(notice);
    const underSupervision = notice.supervision?.underSupervision === 1 || notice.underSupervision === 1;

    return {
        id: toNoticeIdentityKey(notice),
        title: notice.title.trim() || 'بدون عنوان',
        publishDateTime: notice.publishDateTime || notice.sentDateTime || 'ناموجود',
        symbols: noticeSymbols,
        notices: [notice],
        hasUnderSupervision: underSupervision,
    };
};

export const mergeUniqueNotices = (existing: CodalNotice[], incoming: CodalNotice[]) => {
    const seen = new Set(existing.map(toNoticeIdentityKey));
    const merged = [...existing];

    incoming.forEach((notice) => {
        const key = toNoticeIdentityKey(notice);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(notice);
    });

    return merged;
};
