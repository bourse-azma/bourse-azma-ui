export type WalletTx = {
    id: number;
    amount: number;
    balanceAfter: number;
    description: string;
    source?: string | null;
    createdAt: string;
};

export type WalletTxSummary = {
    totalCount: number;
    totalNet: number;
    inflowCount: number;
    outflowCount: number;
};

export type WalletActionType = 'ADD' | 'SUBTRACT';
