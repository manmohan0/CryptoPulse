import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ICoin, IPrices } from "./types/types";
import "./App.css";
import { Chart } from "./components/Chart";
import { MarketBar } from "./components/MarketBar";
import axios from "axios";
import { SignalingManager } from "./utils/SignalingManager";
import { getTickerPrice } from "./utils/httpClient";

function App() {
  const [coins] = useState([
    { name: "Bitcoin", symbol: "BTCUSDC" },
    { name: "Ethereum", symbol: "ETHUSDC" },
    { name: "Solana", symbol: "SOLUSDC" },
    { name: "Litecoin", symbol: "LTCUSDC" },
    { name: "Ripple", symbol: "XRPUSDC" },
    { name: "Cardano", symbol: "ADAUSDC" },
    { name: "Polkadot", symbol: "DOTUSDC" },
    { name: "Chainlink", symbol: "LINKUSDC" },
    { name: "Dogecoin", symbol: "DOGEUSDC" },
    { name: "Uniswap", symbol: "UNIUSDC" },
  ]);

  const [currentCoin, setCurrentCoin] = useState<ICoin | null>(null);
  const [prices, setPrices] = useState<IPrices | null>(null);
  const [timeFrame, setTimeFrame] = useState<string>("5m");
  const [ticker, setTicker] = useState<number>(0);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const selectCoin = (coin: ICoin) => {
    if (currentCoin) SignalingManager.getInstance().deregisterCallback("24hrTicker", `ticker_${currentCoin?.symbol}`);
    setCurrentCoin(coin);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results: Record<string, number> = {}

        await Promise.all(
          coins.map(async (coin) => {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/binance/avgPrice?symbol=${coin.symbol}`);
            results[coin.symbol] = parseFloat(response.data.price);
          })
        );

        setPrices(results);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [coins]);

  useEffect(() => {
    if (!currentCoin || !currentCoin.symbol) return;

    getTickerPrice(currentCoin.symbol).then(setTicker);

    SignalingManager.getInstance().registerCallback("24hrTicker", setTicker, `ticker_${currentCoin.symbol}`);
  
    return () => {
      SignalingManager.getInstance().deregisterCallback("24hrTicker", `ticker_${currentCoin.symbol}`);
    };
  }, [currentCoin]);

  function handleTimeFrame(e: ChangeEvent<HTMLSelectElement>) {
    setTimeFrame(e.target.value);
  }

  return (
    <>
      <div className="h-screen w-screen flex bg-gray-100 overflow-hidden">
        <div className="w-1/4 bg-amber-300 border-amber-500 border-r-2 overflow-y-auto">
          <div className={`max-w-full flex justify-between items-center font-mono text-2xl border-b-2 text-amber-900 border-amber-500 p-2`}>
            <span>CryptoPulse</span>
          </div>
          {coins.map((coin, index) => (
            <div
              key={index}
              onClick={() => selectCoin(coin)}
              className={`max-w-full flex justify-between items-center font-mono m-1 p-2 ${currentCoin?.symbol === coin.symbol ? "bg-amber-500" : ""} hover:bg-amber-400 cursor-pointer`}>
              <span>{coin.name}</span>
              <span>{currentCoin?.symbol === coin.symbol ? ticker?.toPrecision(6) : prices && prices[coin.symbol].toPrecision(6)}</span>
            </div>
          ))}
        </div>
        <div className="h-full flex flex-col relative w-3/4">
          {currentCoin && <MarketBar coin={currentCoin} timeFrame={timeFrame} chartContainerRef={chartContainerRef} ticker={ticker}> 
          <div className="h-full flex items-center font-mono">
            <select onChange={handleTimeFrame} defaultValue={"5m"} className="h-full hover:bg-amber-400">
              <option value="1s">1s</option>
              <option value="1m">1m</option>
              <option value="3m">3m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="30m">30m</option>
              <option value="1h">1h</option>
              <option value="2h">2h</option>
              <option value="4h">4h</option>
              <option value="6h">6h</option>
              <option value="8h">8h</option>
              <option value="12h">12h</option>
              <option value="1d">1d</option>
              <option value="3d">3d</option>
              <option value="1w">1w</option>
              <option value="1m">1m</option>
            </select>
          </div>
          </MarketBar>}
          {currentCoin && <Chart coin={currentCoin} timeFrame={timeFrame} chartContainerRef={chartContainerRef} />}
        </div>
      </div>
    </>
  );
}

export default App;