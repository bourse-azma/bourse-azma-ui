import type {SymbolDepthRow, TsetmcClientType} from './types';

export const calculateDepthPercent = (part: number | null | undefined, total: number | null | undefined) => {
    const normalizedPart = part ?? 0;
    const normalizedTotal = total ?? 0;
    if (normalizedTotal <= 0) {
        return 0;
    }
    return (normalizedPart / normalizedTotal) * 100;
};

const sumNullableValues = (...values: Array<number | null | undefined>) =>
    values.reduce<number>((sum, value) => sum + (value ?? 0), 0);

export const buildDepthRowsFromClientType = (clientType: TsetmcClientType | null): SymbolDepthRow[] => {
    if (!clientType) return [];
    const totalBuy = sumNullableValues(
        clientType.individualBuyVolume,
        clientType.institutionalBuyVolume,
        clientType.uncategorizedBuyVolume
    );
    const totalSell = sumNullableValues(clientType.individualSellVolume, clientType.institutionalSellVolume);

    return [
        {
            id: 'real',
            label: 'حقیقی',
            buyCount: clientType.individualBuyCount,
            sellCount: clientType.individualSellCount,
            buyVolume: clientType.individualBuyVolume,
            sellVolume: clientType.individualSellVolume,
            buyPercent: calculateDepthPercent(clientType.individualBuyVolume, totalBuy),
            sellPercent: calculateDepthPercent(clientType.individualSellVolume, totalSell),
        },
        {
            id: 'legal',
            label: 'حقوقی',
            buyCount: clientType.institutionalBuyCount,
            sellCount: clientType.institutionalSellCount,
            buyVolume: clientType.institutionalBuyVolume,
            sellVolume: clientType.institutionalSellVolume,
            buyPercent: calculateDepthPercent(clientType.institutionalBuyVolume, totalBuy),
            sellPercent: calculateDepthPercent(clientType.institutionalSellVolume, totalSell),
        },
    ];
};
