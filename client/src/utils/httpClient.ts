import axios from "axios";
import type { UTCTimestamp } from "lightweight-charts";

export const getHistoricalPrices = async (symbol: string, timeframe: string) => {
    const response = await axios.get(`${import.meta.env.VITE_BINANCE_API_URL}/klines`, {
      params: {
        symbol,
        interval: timeframe,
        limit: 1000,
      },
    });

    const data = response.data.map((d: string[]) => ({
      time: Math.floor(Number(d[0]) / 1000) as UTCTimestamp,
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
    }));

    return data;
};

export const getTickerPrice = async (symbol: string) => {
    const response = await axios.get(`${import.meta.env.VITE_BINANCE_API_URL}/ticker/price`, {
      params: {
        symbol,
      },
    });
    return parseFloat(response.data.price);
}