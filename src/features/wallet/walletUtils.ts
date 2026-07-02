import type {WalletActionType, WalletTx} from './types';

export const WALLET_ACTIONS: { type: WalletActionType; label: string; hint: string }[] = [
    {type: 'ADD', label: 'افزایش', hint: 'واریز به کیف پول'},
    {type: 'SUBTRACT', label: 'کاهش', hint: 'برداشت از کیف پول'},
];

export function getWalletTransactionMeta(tx: WalletTx) {
    const isIncrease = tx.amount > 0;
    const balanceBefore = tx.balanceAfter - tx.amount;
    const trimmedDescription = tx.description.trim();
    const title = isIncrease ? 'افزایش موجودی' : 'کاهش موجودی';
    const isAutoDescription = /^(افزایش|کاهش|تغییر) موجودی/.test(trimmedDescription);

    return {isIncrease, balanceBefore, title, isAutoDescription};
}

export const parseWalletAmount = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '' || !/^\d+$/.test(trimmed)) {
        return null;
    }
    const value = Number(trimmed);
    if (!Number.isSafeInteger(value) || value <= 0) {
        return null;
    }
    return value;
};

export const computeProjectedBalance = (currentBalance: number, actionType: WalletActionType, rawValue: number) => {
    switch (actionType) {
        case 'ADD':
            return currentBalance + rawValue;
        case 'SUBTRACT':
            return currentBalance - rawValue;
        default:
            return currentBalance;
    }
};
