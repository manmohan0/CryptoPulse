import type { UTCTimestamp } from "lightweight-charts";

export interface ICoin { 
    name: string, symbol: string 
}

export interface IPrices {
    [key: string]: number;
}

export interface ICandle { 
    time: UTCTimestamp, 
    open: number, 
    high: number, 
    low: number, 
    close: number 
}