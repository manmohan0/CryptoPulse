/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_URL: string = 'wss://stream.binance.com:9443/ws'

export class SignalingManager {
    private ws: WebSocket;
    private static instance: SignalingManager;
    private bufferedMessages: any[] = [];
    private callbacks: any = {};
    private isInitialized: boolean = false;

    private constructor() {
      this.ws = new WebSocket(BASE_URL);
      this.bufferedMessages = []
      this.callbacks = [];
      this.init();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new SignalingManager();
        }
        return this.instance;
    }

    private init() {
        this.ws.onopen = () => {
            this.isInitialized = true;
            this.bufferedMessages.forEach((message) => {
                this.ws.send(JSON.stringify(message));
            });
            this.bufferedMessages = [];
        }

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const type = message.e;
            if (this.callbacks[type]) {
                this.callbacks[type].forEach(({ callback }: { callback: (data: any) => void }) => {
                    if (type === 'kline') {
                        const newKline = {
                            time: Math.floor(message.k.t / 1000),
                            open: parseFloat(message.k.o),
                            high: parseFloat(message.k.h),
                            low: parseFloat(message.k.l),
                            close: parseFloat(message.k.c)
                        }
                        callback(newKline);
                    }
                    if (type === '24hrTicker') {
                        const close = parseFloat(message.c)
                        callback(close);
                    }
                })
            }
        }
    }

    public sendMessage(message: any) {
        if (!this.isInitialized) {
            this.bufferedMessages.push(message);
            return;
        }
        this.ws.send(JSON.stringify(message));
    }

    public registerCallback(type: string, callback: any, id: string) {
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({ callback, id });
    }

    public deregisterCallback(type: string, id: string) {
        if (this.callbacks[type]) {
            const index = this.callbacks[type].findIndex((cb: any) => cb.id === id );
            if (index !== -1) {
                this.callbacks[type].splice(index, 1);
            }
        }
    }
}