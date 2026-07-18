import type {WalletActionType, WalletTx} from './types';

export const WALLET_ACTIONS: { type: WalletActionType; label: string; hint: string }[] = [
    {type: 'ADD', label: 'افزایش', hint: 'واریز به کیف پول'},
    {type: 'SUBTRACT', label: 'کاهش', hint: 'برداشت از کیف پول'},
];

export function getWalletTransactionMeta(tx: WalletTx) {
    const isIncrease = tx.amount > 0;
    const balanceBefore = tx.balanceAfter - tx.amount;
    const trimmedDescription = tx.description.trim();
    const trade = trimmedDescription.match(/^(خرید|فروش)\s+(.+?)\s+به تعداد\s+/);
    const sourceTitles: Record<string, string> = {
        DEPOSIT: 'واریز به کیف پول',
        WITHDRAWAL: 'برداشت از کیف پول',
        INITIAL_BALANCE: 'موجودی اولیه',
        ADMIN_ADJUSTMENT: 'تعدیل موجودی توسط مدیر',
        ADMIN: 'تعدیل موجودی توسط مدیر',
    };
    const legacyTitle = /^موجودی اولیه|^ثبت‌نام بدون موجودی اولیه/.test(trimmedDescription)
        ? 'موجودی اولیه'
        : /^ویرایش موجودی توسط مدیر/.test(trimmedDescription)
            ? 'تعدیل موجودی توسط مدیر'
            : /^افزایش موجودی/.test(trimmedDescription)
                ? 'واریز به کیف پول'
                : /^کاهش موجودی/.test(trimmedDescription)
                    ? 'برداشت از کیف پول'
                    : null;
    const title = trade ? `${trade[1]} ${trade[2]}` : sourceTitles[tx.source ?? '']
        ?? legacyTitle
        ?? (isIncrease ? 'افزایش موجودی' : 'کاهش موجودی');
    const isAutoDescription = /^(افزایش|کاهش) موجودی/.test(trimmedDescription);

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

export const validateWalletAmount = (raw: string, maximum: number): string | null => {
    const trimmed = raw.trim();
    if (trimmed === '' || !/^\d+$/.test(trimmed)) {
        return 'مبلغ باید عدد صحیح مثبت باشد.';
    }

    try {
        if (BigInt(trimmed) > BigInt(Math.trunc(maximum))) {
            return `مبلغ واردشده بیش از حد مجاز است؛ حداکثر مبلغ هر تراکنش کیف پول ${maximum.toLocaleString('en-US')} ریال است.`;
        }
    } catch {
        return 'مبلغ باید عدد صحیح مثبت باشد.';
    }

    return parseWalletAmount(trimmed) === null ? 'مبلغ باید عدد صحیح مثبت باشد.' : null;
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
