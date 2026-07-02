export type CodalNoticeSupervision = {
    underSupervision: number;
    additionalInfo: string;
    reasons: string[];
};

export type CodalNotice = {
    tracingNumber: number;
    symbol: string;
    companyName: string;
    underSupervision: number;
    supervision: CodalNoticeSupervision;
    title: string;
    letterCode: string;
    sentDateTime: string;
    publishDateTime: string;
    reportUrl: string;
    pdfUrl: string;
    excelUrl: string;
    attachmentUrl: string;
    hasPdf: boolean;
    hasExcel: boolean;
    hasAttachment: boolean;
};

export type CodalNoticesResult = {
    totalCount: number;
    page: number;
    notices: CodalNotice[];
};

export type CodalNoticesQuery = {
    includeAudited: boolean;
    auditorRef: number;
    categoryCode: number;
    includeChildCategories: boolean;
    companyState: number;
    companyType: number;
    includeConsolidated: boolean;
    isNotAuditedFilter: boolean;
    length: number;
    letterType: number;
    includeMainCategories: boolean;
    includeNotAudited: boolean;
    includeNotConsolidated: boolean;
    page: number;
    publisher: boolean;
    reportingType: number;
    symbol: string;
    tracingNumber: number;
};

export type NoticeGroup = {
    id: string;
    title: string;
    publishDateTime: string;
    symbols: string[];
    notices: CodalNotice[];
    hasUnderSupervision: boolean;
};
