import {useEffect, useState} from 'react';
import {appConfig} from '../../config/appConfig';
import {marketOverviewTopic, type MarketOverviewUpdate} from '../../services/realtimeTypes';
import {webSocketService} from '../../services/webSocketService';
import type {MarketOverviewApiResponse, MarketOverviewResult} from '../trading-dashboard/types';

const normalizePath = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const joinUrl = (baseUrl: string, path: string) => `${trimTrailingSlash(baseUrl)}${normalizePath(path)}`;
const applyTemplate = (template: string, values: Record<string, string>) => {
    let resolved = template;
    Object.entries(values).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return resolved;
};

export function useMarketOverview(marketId: '1' | '2', accessToken: string, enabled: boolean) {
    const [data, setData] = useState<MarketOverviewResult | null>(null);
    const [loading, setLoading] = useState(enabled);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let active = true;
        const controller = new AbortController();
        setLoading(true);

        const applyOverview = (overview: NonNullable<MarketOverviewApiResponse['result']>['marketOverview']) => {
            if (!active || !overview) return;
            setData({
                indexValue: overview.totalIndexValue,
                indexChange: overview.totalIndexChange,
                totalTrades: overview.totalTradeCount,
                totalTradeValue: overview.totalTradeValue,
                totalTradeVolume: overview.totalTradeVolume,
                marketStateTitle: overview.marketStateTitle,
            });
        };

        const fetchOverview = async () => {
            try {
                const response = await fetch(
                    joinUrl(
                        appConfig.marketOverviewApiBaseUrl,
                        applyTemplate(appConfig.marketOverviewApiPath, {marketId})
                    ),
                    {signal: controller.signal}
                );
                if (!response.ok) return;

                const payload = (await response.json()) as MarketOverviewApiResponse;
                const overview = payload.result?.marketOverview;
                if (!active || payload.code !== 200 || !overview) return;

                applyOverview(overview);
            } catch {
                // Keep previously rendered data on transient network failures.
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void fetchOverview();
        const unsubscribe = webSocketService.subscribeJson<MarketOverviewUpdate>(
            accessToken,
            marketOverviewTopic(marketId),
            (update) => {
                if (update.marketId === Number(marketId)) applyOverview(update.marketOverview);
            },
            {onReconnect: () => void fetchOverview()}
        );

        return () => {
            active = false;
            controller.abort();
            unsubscribe();
        };
    }, [accessToken, enabled, marketId]);

    return {data, loading: enabled && loading};
}
