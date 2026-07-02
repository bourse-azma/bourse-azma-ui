import type {OrderStatusType} from '../trading/api';
import type {SymbolSearchSuggestion} from '../symbol-search/types';

export const ACTIVE_ORDER_STATUSES: OrderStatusType[] = ['REQUESTED', 'PARTIALLY_FILLED', 'TRIGGER_PENDING'];
export const ORDERS_PAGE_SIZE = 20;
export const WATCHLIST_NAME_MAX_LENGTH = 80;

export const WATCHLIST_TABLE_GRID = 'grid grid-cols-[minmax(0,1fr)_4.75rem_4rem_4.5rem] items-center gap-x-2';

export const DEFAULT_SELECTED_SYMBOL: SymbolSearchSuggestion = {
    key: 'TSE:فولاد:46348559193224090',
    type: 'TSE',
    symbol: 'فولاد',
    name: 'فولاد مبارکه اصفهان',
    instrumentCode: '46348559193224090',
    isin: 'IRO1FOLD0001',
    oldInstrumentCodes: [],
};
