import type { ICoin } from "../types/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const MarketBar = ({ coin, timeFrame, chartContainerRef, children, ticker } : { coin: ICoin, timeFrame: string, chartContainerRef: React.RefObject<HTMLDivElement | null>, children: React.ReactNode, ticker:  number }) => {

    const DownloadPdf = async () => {
        if (!coin || !chartContainerRef.current) return;

        const canvas = await html2canvas(chartContainerRef.current);
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('landscape', 'mm', 'a4');

        pdf.setFontSize(20)
        pdf.text(`Candlestick Chart for ${coin.name} (${coin.symbol})`, 10, 10);

        pdf.setFontSize(12)
        pdf.text(`Time Frame: ${timeFrame}`, 10, 20);
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 50, 20);

        pdf.addImage(imgData, 'PNG', 10, 30, 270, 120)
        pdf.save(`${coin.symbol}_chart_report.pdf`);
    }

    return (
        <div className='h-12 grid grid-cols-5 justify-between items-center px-4 bg-amber-300 border-amber-500 border-b-2'>
            <div className='col-span-1 text-lg font-bold'>
                {coin?.symbol}
            </div>
            <div className={`col-span-2 text-lg font-mono font-semibold`}>
                {ticker !== null ? ticker.toPrecision(6) : "No data"}
            </div>
            { children }
            <div onClick={DownloadPdf} className='h-full col-span-1 flex justify-center items-center font-semibold hover:bg-amber-400 cursor-pointer'>
                Download Report
            </div>
        </div>
    );
}