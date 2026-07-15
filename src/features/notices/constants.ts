import type {CodalNoticesQuery} from './types';

export const JALALI_MONTHS = [
    {value: 1, label: 'فروردین'},
    {value: 2, label: 'اردیبهشت'},
    {value: 3, label: 'خرداد'},
    {value: 4, label: 'تیر'},
    {value: 5, label: 'مرداد'},
    {value: 6, label: 'شهریور'},
    {value: 7, label: 'مهر'},
    {value: 8, label: 'آبان'},
    {value: 9, label: 'آذر'},
    {value: 10, label: 'دی'},
    {value: 11, label: 'بهمن'},
    {value: 12, label: 'اسفند'},
] as const;

// Codal's Length parameter is a date-range selector (maximum 12), not page size.
export const CODAL_MAX_LENGTH = 12;
export const CODAL_MAX_PAGE_LENGTH = CODAL_MAX_LENGTH;

export const DEFAULT_CODAL_NOTICE_QUERY: CodalNoticesQuery = {
    includeAudited: true,
    auditorRef: -1,
    categoryCode: -1,
    includeChildCategories: true,
    companyState: -1,
    companyType: -1,
    includeConsolidated: true,
    isNotAuditedFilter: false,
    length: CODAL_MAX_LENGTH,
    letterType: -1,
    includeMainCategories: true,
    includeNotAudited: true,
    includeNotConsolidated: true,
    page: 1,
    publisher: false,
    reportingType: -1,
    symbol: '',
    tracingNumber: -1,
};
