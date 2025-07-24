import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi } from "lightweight-charts";
import type { ICandle } from "../types/types";

export class ChartManager {
    private candlestickSeries: ISeriesApi<"Candlestick">;
    private chartApi: IChartApi;

    constructor(chartContainer: HTMLDivElement, initialData: ICandle[]) {
        this.chartApi = createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
            layout: {
                background: { color: '#f5f5f5' },
                textColor: '#333',
            }
        })
        this.candlestickSeries = this.chartApi.addSeries(CandlestickSeries)
        this.candlestickSeries.setData(initialData);
    }

    public updateCandle(newCandle: ICandle) {
        this.candlestickSeries.update(newCandle);
    }

    public setData(data: ICandle[]) {
        this.candlestickSeries.setData(data);
    }

    public destroy() {
        this.chartApi.remove();
    }
}