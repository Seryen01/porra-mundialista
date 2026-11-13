/**
 * Proveedor de criptomonedas: API pública de datos de mercado de Binance.
 * No requiere clave y ofrece histórico y velas en tiempo real por WebSocket.
 */
import WebSocket from 'ws';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type { Candle, Instrument, Quote, Timeframe } from '@atalaya/core';
import { TtlCache } from '../cache';
import { fetchJson, ProviderError } from '../http';
import type { CandleQuery, MarketDataProvider } from './types';

const REST = 'https://data-api.binance.vision/api/v3';
const STREAM = 'wss://data-stream.binance.vision/ws';
const INTERVAL: Record<Timeframe, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1D': '1d', '1W': '1w', '1M': '1M' };
const QUOTE_RANK = ['USDT', 'EUR', 'USDC', 'BTC'];

interface ExchangeSymbol { symbol: string; status: string; baseAsset: string; quoteAsset: string }
type Kline = [number, string, string, string, string, string, ...unknown[]];

const toInstrument = (s: ExchangeSymbol): Instrument => ({
  id: `BINANCE:${s.symbol}`, symbol: s.symbol, name: `${s.baseAsset} / ${s.quoteAsset}`,
  exchange: 'Binance', type: 'crypto', currency: s.quoteAsset, realtime: true,
});

export class BinanceProvider implements MarketDataProvider {
  readonly id = 'BINANCE';
  private symbols = new TtlCache<ExchangeSymbol[]>();
  private cache = new TtlCache<Candle[] | Quote[]>();

  info() {
    return { id: this.id, name: 'Binance', enabled: true, covers: 'Criptomonedas en tiempo real' };
  }

  private universe() {
    return this.symbols.get('all', 12 * 3600_000, async () => {
      const data = await fetchJson<{ symbols: ExchangeSymbol[] }>('binance', `${REST}/exchangeInfo`, {}, 30_000);
      const list = data.symbols.filter((s) => s.status === 'TRADING' && QUOTE_RANK.includes(s.quoteAsset));
      console.log('[binance] Universo de símbolos cargado', { count: list.length });
      return list;
    });
  }

  async search(query: string) {
    const q = query.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!q) return [];
    const score = (s: ExchangeSymbol) =>
      (s.symbol === q ? 0 : s.baseAsset === q ? 1 : s.baseAsset.startsWith(q) ? 2 : s.symbol.startsWith(q) ? 3 : s.symbol.includes(q) ? 4 : 9) * 10 +
      QUOTE_RANK.indexOf(s.quoteAsset);
    return (await this.universe()).filter((s) => score(s) < 90).sort((a, b) => score(a) - score(b)).slice(0, 12).map(toInstrument);
  }

  async instrument(symbol: string) {
    const found = (await this.universe()).find((s) => s.symbol === symbol);
    return found ? toInstrument(found) : null;
  }

  candles({ symbol, tf, limit, before }: CandleQuery) {
    const params = new URLSearchParams({ symbol, interval: INTERVAL[tf], limit: String(Math.min(limit, 1000)) });
    if (before) params.set('endTime', String(before * 1000 - 1));
    // Las velas históricas no cambian; la última sí, así que la consulta "actual" caduca pronto.
    return this.cache.get(`k:${params}`, before ? 3600_000 : 5_000, async () => {
      const rows = await fetchJson<Kline[]>('binance', `${REST}/klines?${params}`);
      return rows.map((k) => ({ time: k[0] / 1000, open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] }));
    }) as Promise<Candle[]>;
  }

  quotes(symbols: string[]) {
    const key = [...symbols].sort().join(',');
    return this.cache.get(`q:${key}`, 5_000, async () => {
      const url = `${REST}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
      const rows = await fetchJson<{ symbol: string; lastPrice: string; priceChangePercent: string }[]>('binance', url);
      return rows.map((r) => ({ id: `BINANCE:${r.symbol}`, last: +r.lastPrice, changePct: +r.priceChangePercent }));
    }) as Promise<Quote[]>;
  }

  subscribe(symbol: string, tf: Timeframe, onCandle: (candle: Candle) => void) {
    const url = `${STREAM}/${symbol.toLowerCase()}@kline_${INTERVAL[tf]}`;
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    let socket: WebSocket | null = null;
    let closed = false;
    let retry = 0;
    let timer: NodeJS.Timeout | undefined;

    const connect = () => {
      socket = new WebSocket(url, proxy ? { agent: new HttpsProxyAgent(proxy) } : {});
      socket.on('open', () => {
        retry = 0;
        console.log('[binance] Flujo en directo abierto', { symbol, tf });
      });
      socket.on('message', (raw) => {
        try {
          const { k } = JSON.parse(raw.toString()) as { k?: { t: number; o: string; h: string; l: string; c: string; v: string } };
          if (k) onCandle({ time: k.t / 1000, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v });
        } catch (error) {
          console.error('[binance] Mensaje de flujo no válido', error);
        }
      });
      socket.on('error', (error) => console.error('[binance] Error en el flujo', { symbol, tf, error: error.message }));
      socket.on('close', () => {
        if (closed) return;
        // Reconexión con espera creciente (máx. 30 s); Binance corta cada conexión a las 24 h.
        const wait = Math.min(30_000, 1000 * 2 ** retry++);
        console.warn('[binance] Flujo cerrado, se reintenta', { symbol, tf, waitMs: wait });
        timer = setTimeout(connect, wait);
      });
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(timer);
      socket?.close();
      console.log('[binance] Flujo en directo cerrado', { symbol, tf });
    };
  }
}

export { ProviderError };
