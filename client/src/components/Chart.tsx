import { useRef, useEffect } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getHistoricalPrices } from "../utils/httpClient";
import type { ICandle, ICoin } from "../types/types";
import { SignalingManager } from "../utils/SignalingManager";

export const Chart = ({ coin, timeFrame, chartContainerRef } : { coin: ICoin, timeFrame: string, chartContainerRef: React.RefObject<HTMLDivElement | null> }) => {
    const chartManagerRef = useRef<ChartManager>(null);
    
    useEffect(() => {
        if (!coin || !timeFrame || !chartContainerRef || !chartContainerRef.current) return;

        // SignalingManager.getInstance().sendMessage({
        //     method: "UNSUBSCRIBE",
        //     params: [`${coin?.symbol.toLowerCase()}@kline_${timeFrame}`, `${coin?.symbol.toLowerCase()}@ticker`],
        //     id: Date.now()
        // });
        // SignalingManager.getInstance().deregisterCallback("kline", `kline_${coin?.symbol}_${timeFrame}`);
        // SignalingManager.getInstance().deregisterCallback("24hrTicker", `ticker_${coin?.symbol}`);

        getHistoricalPrices(coin.symbol, timeFrame).then(historicalData => {
            if (chartContainerRef.current) {
                if (chartManagerRef.current) {
                    chartManagerRef.current.destroy();
                }
                const chartManager = new ChartManager(chartContainerRef.current!, historicalData);
                chartManagerRef.current = chartManager;
            }
        });

        SignalingManager.getInstance().sendMessage({
            method: "SUBSCRIBE",
            params: [`${coin?.symbol.toLowerCase()}@kline_${timeFrame}`, `${coin?.symbol.toLowerCase()}@ticker`],
            id: Date.now()
        });
        
        SignalingManager.getInstance().registerCallback("kline", (data: ICandle) => {
            if (chartManagerRef.current) {
                chartManagerRef.current.updateCandle(data);
            }
        }, `kline_${coin?.symbol}_${timeFrame}`);

            return () => {
                SignalingManager.getInstance().deregisterCallback("kline", `kline_${coin?.symbol}_${timeFrame}`);
                SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`${coin?.symbol.toLowerCase()}@kline_${timeFrame}`, `${coin.symbol.toLowerCase()}@ticker`], id: Date.now() });       
            };
        }, [coin, timeFrame]);

    return <div ref={chartContainerRef} className="min-h-[400px]" />

}