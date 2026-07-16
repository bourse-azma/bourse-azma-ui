export type AdminStats = {
    totalUsers: number;
    onlineUsers: number;
    newUsersToday: number;
    totalOrders: number;
    totalTrades: number;
    openTickets: number;
};

export type AdminUser = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
    balance: number;
    createdAt: string;
    lastLoginAt?: string;
    lastSeenAt?: string;
    lastLoginIp?: string;
    blocked: boolean;
    blockedAt?: string;
    blockedReason?: string;
    online: boolean;
    orderCount: number;
    tradeCount: number;
    holdingCount: number;
    ticketCount: number;
};

export type AdminOrder = {
    id: number; side: 'BUY' | 'SELL'; sideLabel: string; symbol: string; quantity: number;
    executedQuantity: number; orderPrice: number; orderValue: number; orderTime: string; statusLabel: string;
};
export type AdminTrade = {
    id: number;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    value: number;
    executedAt: string;
};
export type AdminHolding = {
    id: number;
    symbol: string;
    quantity: number;
    buyPrice: number;
    livePrice: number;
    netValue: number;
    acquiredAt: string;
};
export type AdminWalletTransaction = {
    id: number; amount: number; balanceAfter: number; description: string; createdAt: string;
    source?: string; performedByAdminId?: number; performedByAdminName?: string; adminNote?: string;
};
export type AdminActivity = {
    id: number; activityType: 'LOGIN' | 'LOGOUT'; ipAddress?: string; occurredAt: string;
};
export type AdminUserDetail = {
    user: AdminUser; orders: AdminOrder[]; trades: AdminTrade[]; portfolio: AdminHolding[];
    walletTransactions: AdminWalletTransaction[]; activities: AdminActivity[];
};
export type PagedUsers = {
    items: AdminUser[];
    page: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean
};

export type AdminUserFormValues = {
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    password: string;
    balance: number;
};
