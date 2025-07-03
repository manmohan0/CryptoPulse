import { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'
import './App.css'

function App() {

  const [coins] = useState([{"name": "Bitcoin", "symbol": "BTCUSDC"}, {"name": "Ethereum", "symbol": "ETHUSDC"}, {"name": "Solana", "symbol": "SOLUSDC"}, {"name": "Litecoin", "symbol": "LTCUSDC"}, {"name": "Ripple", "symbol": "XRPUSDC"}, {"name": "Cardano", "symbol": "ADAUSDC"}, {"name": "Polkadot", "symbol": "DOTUSDC"}, {"name": "Chainlink", "symbol": "LINKUSDC"}, {"name": "Dogecoin", "symbol": "DOGEUSDC"}, {"name": "Uniswap", "symbol": "UNIUSDC"}]);
  const [currentCoin, setCurrentCoin] = useState<{ name: string, symbol: string } | null>(null);
  const [prices, setPrices] = useState<Record<string, number> | null>(null)
  const [chartData, setChartData] = useState<{ time: number; open: number, high: number, low: number, close: number }[] | null>(null);
  const [timeFrame, setTimeFrame] = useState<string>('5m');
  
  const ws = useRef<WebSocket | null>(null);
  const currentCoinRef = useRef<{ name: string; symbol: string } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const chartDataRef = useRef<{ time: UTCTimestamp; open: number, high: number, low: number, close: number }[] | null>(null);

  const getHistoricalPrices = async (symbol: string, timeframe: string) => {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
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

    chartDataRef.current = data;
    seriesRef.current?.setData(data);
    return data;
  };

  const selectCoin = async (coin: { name: string, symbol: string }) => {
    
    if (!ws.current) {
      console.error('WebSocket is not initialized');
      return;
    }

    console.log(chartRef.current, seriesRef.current);
    initChart();
    
    const historicalData = await getHistoricalPrices(coin.symbol, timeFrame);
    
    if (seriesRef.current) {
      seriesRef.current.setData(historicalData);
    }
    
    chartDataRef.current = historicalData;
    setChartData(historicalData);
    
    if (currentCoin) {
      ws.current.send(JSON.stringify({
        method: "UNSUBSCRIBE",
        params: [`${currentCoin.symbol.toLowerCase()}@kline_${timeFrame}`],
        id: Date.now()
      }));
    }
    
    setCurrentCoin(coin);
    
    ws.current.send(JSON.stringify({
      method: "SUBSCRIBE",
      params: [`${coin.symbol.toLowerCase()}@kline_${timeFrame}`],
      id: 1
    }));

    currentCoinRef.current = coin;
  }

  const handleTimeFrame = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!ws.current) {
      console.error('WebSocket is not initialized');
      return;
    }

    const newTimeFrame = e.target.value;
    
    ws.current.send(JSON.stringify({
      method: "UNSUBSCRIBE",
      params: [`${currentCoin?.symbol.toLowerCase()}@kline_${timeFrame}`],
      id: Date.now()
    }));
    
    setTimeFrame(newTimeFrame);

    ws.current.send(JSON.stringify({
      method: "SUBSCRIBE",
      params: [`${currentCoin?.symbol.toLowerCase()}@kline_${newTimeFrame}`],
      id: Date.now()
    }));

    const historicalData = await getHistoricalPrices(currentCoin?.symbol || '', newTimeFrame);
    chartDataRef.current = historicalData;
    setChartData(historicalData);
  };

  const initChart = () => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#f5f5f5' },
        textColor: '#333',
      }
    });

    chartRef.current.resize(
      chartContainerRef.current.clientWidth,
      chartContainerRef.current.clientHeight
    );

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries);
  };

  const DownloadPdf = async () => {
    if (!chartContainerRef.current || !currentCoin || !chartData) return;

    const canvas = await html2canvas(chartContainerRef.current);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('landscape', 'mm', 'a4');

    pdf.setFontSize(20)
    pdf.text(`Candlestick Chart for ${currentCoin.name} (${currentCoin.symbol})`, 10, 10);

    pdf.setFontSize(12)
    pdf.text(`Time Frame: ${timeFrame}`, 10, 20);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 50, 20);

    pdf.addImage(imgData, 'PNG', 10, 30, 270, 120)
    pdf.save(`${currentCoin.symbol}_chart_report.pdf`);
  }

  useEffect(() => {
    
    ws.current = new WebSocket(`wss://stream.binance.com:9443/ws`);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.e === 'kline' && data.s === currentCoinRef.current?.symbol) {
        
        const kline = data.k;
        const candlestick = {
          time: Math.floor(kline.t / 1000) as UTCTimestamp,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        
        seriesRef.current?.update(candlestick);
        chartDataRef.current = [...(chartDataRef.current ?? []), candlestick];

        setChartData((prevData) => {
          return [...(prevData ?? []).slice(-100), candlestick];
        });
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results: Record<string, number> = {}

        await Promise.all(
          coins.map(async (coin) => {
            const response = await axios.get(`http://localhost:3000/binance/api/v3/avgPrice?symbol=${coin.symbol}`);
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

  return (
    <>
      <div className='h-screen w-screen flex bg-gray-100 overflow-hidden'>
        <div className="w-1/4 bg-amber-300 border-amber-500 border-r-2 overflow-y-auto">
          <div className={`max-w-full flex justify-between items-center font-mono text-2xl border-b-2 text-amber-900 border-amber-500 p-2`}>
            <span>CryptoPulse</span>
          </div>
          {coins.map((coin, index) => (
            <div key={index} onClick={() => selectCoin(coin)} className={`max-w-full flex justify-between items-center font-mono m-1 p-2 ${currentCoin?.symbol === coin.symbol ? "bg-amber-500" : ""} hover:bg-amber-400 cursor-pointer`}>
              <span>{coin.name}</span>
              <span>{currentCoin?.symbol === coin.symbol && chartData ? chartData[chartData.length - 1].close.toPrecision(6) : prices ? prices[coin.symbol].toPrecision(6) : ''}</span>
            </div>
          ))}
        </div>
        <div className="h-full flex flex-col relative w-3/4">
        {chartData && (
          <>
          <div className='h-12 grid grid-cols-5 justify-between items-center px-4 bg-amber-300 border-amber-500 border-b-2'>
            <div className='col-span-1 text-lg font-bold'>
              {currentCoin?.symbol}
            </div>
            <div className='col-span-2 text-lg font-mono font-semibold'>
              {chartData.length > 0 ? chartData[chartData.length - 1].close.toPrecision(6) : "No data"}
            </div>
            <div className='h-full flex items-center font-mono'>
              <select onChange={handleTimeFrame} defaultValue={'5m'} className='h-full hover:bg-amber-400'>
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
            <div onClick={DownloadPdf} className='h-full col-span-1 flex justify-center items-center font-semibold hover:bg-amber-400 cursor-pointer'>
              Download Report
            </div>
          </div>
          </>
        )}
        <div ref={chartContainerRef} className='h-auto min-h-[400px] w-auto'>
        </div>
        {!chartData && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-gray-500">
            Select a coin to view its data
          </div>
        )}
        </div>
      </div>
    </>
  )
}

export default App
