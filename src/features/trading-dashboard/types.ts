import type {Theme} from '../../hooks/useTheme';
import type {SymbolSearchSuggestion} from '../symbol-search/types';
import type {OrderStatusType} from '../trading/api';

export type SidebarTab = 'watchlist' | 'popular' | 'industries' | 'wallet';
export type SymbolTab = 'notices' | 'details';
export type OrderbookTab = 'peers' | 'info' | 'technical';
export type OrderFilter = 'open' | 'partial' | 'done' | 'cancelled' | 'failed' | 'all';
export type BottomPanelTab = 'orders' | 'portfolio';

export type DemoOrderRow = {
    id: number;
    type: 'buy' | 'sell';
    symbol: string;
    instrumentCode: string;
    quantity: number;
    remainingQuantity: number;
    executedQuantity: number;
    orderPrice: number;
    averageExecutedPrice: number | null;
    livePrice: number | null;
    time: string;
    status: OrderStatusType;
    statusLabel: string;
    cancellable: boolean;
};

export type DemoPortfolioRow = {
    id: string;
    time: string;
    symbol: string;
    instrumentCode: string;
    quantity: number;
    buyPrice: number;
    livePrice: number | null;
};

export type UserProfile = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    role: string;
    balance?: number;
};

export type TradingDashboardProps = {
    loginEpoch: string;
    theme: Theme;
    accessToken: string;
    onToggleTheme: (origin?: { x: number; y: number }) => void;
    profileDisplayName: string;
    onOpenProfile: () => void;
    onLogout: () => void;
    userProfile?: UserProfile;
    onProfileUpdated?: (profile: UserProfile) => void;
};

export type MarketOverviewResult = {
    indexValue: number;
    indexChange: number;
    totalTrades: number;
    totalTradeValue: number;
    totalTradeVolume: number;
    marketStateTitle: string;
};

export type MarketOverviewApiResult = {
    marketOverview?: {
        totalIndexValue: number;
        totalIndexChange: number;
        totalTradeCount: number;
        totalTradeValue: number;
        totalTradeVolume: number;
        marketStateTitle: string;
    };
};

export type MarketOverviewApiResponse = {
    code: number;
    result?: MarketOverviewApiResult;
};

export type WatchlistModalState =
    | { mode: 'create'; pendingSymbol?: SymbolSearchSuggestion }
    | {
    mode: 'edit';
    watchlistId: number;
    originalName: string;
};

export type AddToWatchlistModalState = {
    symbol: SymbolSearchSuggestion;
};

export type WatchlistToast = {
    id: number;
    title?: string;
    message: string;
    tone: 'success' | 'error';
};
