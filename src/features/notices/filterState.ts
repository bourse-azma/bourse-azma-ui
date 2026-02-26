export type JalaliDateParts = {
  year: number;
  month: number;
  day: number;
};

export type NoticeUiFilters = {
  symbol: string;
  fromDate: JalaliDateParts | null;
  toDate: JalaliDateParts | null;
  underSupervisionOnly: boolean;
};

export type CodalNoticesQueryLike = {
  symbol: string;
  page: number;
};

export const createDefaultNoticeFilters = (): NoticeUiFilters => ({
  symbol: '',
  fromDate: null,
  toDate: null,
  underSupervisionOnly: false,
});

export const normalizeNoticeSymbol = (value: string) => value.trim();

export const toAppliedNoticeFilters = (draft: NoticeUiFilters): NoticeUiFilters => {
  let fromDate = draft.fromDate;
  let toDate = draft.toDate;

  if (fromDate && toDate) {
    const fromKey = Number(
      `${fromDate.year.toString().padStart(4, '0')}${fromDate.month.toString().padStart(2, '0')}${fromDate.day
        .toString()
        .padStart(2, '0')}`
    );
    const toKey = Number(
      `${toDate.year.toString().padStart(4, '0')}${toDate.month.toString().padStart(2, '0')}${toDate.day
        .toString()
        .padStart(2, '0')}`
    );
    if (fromKey > toKey) {
      [fromDate, toDate] = [toDate, fromDate];
    }
  }

  return {
    symbol: normalizeNoticeSymbol(draft.symbol),
    fromDate,
    toDate,
    underSupervisionOnly: draft.underSupervisionOnly,
  };
};

export const toNoticeQuery = <T extends CodalNoticesQueryLike>(previous: T, filters: NoticeUiFilters): T => ({
  ...previous,
  symbol: normalizeNoticeSymbol(filters.symbol),
  page: 1,
});

export const withNoticeSymbol = (draft: NoticeUiFilters, symbol: string): NoticeUiFilters => ({
  ...draft,
  symbol: normalizeNoticeSymbol(symbol),
});
