/**
 * Proveedor de acciones, ETF e índices: Twelve Data.
 * Necesita una clave (la gratuita basta para empezar). El plan gratuito limita las
 * peticiones por minuto y día, por eso todas las respuestas pasan por la caché.
 * No hay velas en directo en este plan: los precios son diferidos o de cierre.
 */
import type { Candle, Instrument, InstrumentType, Quote, Timeframe } from '@atalaya/core';
import { isIntraday } from '@atalaya/core';
import { TtlCache } from '../cache';
import { fetchJson, ProviderError } from '../http';
import type { CandleQuery, MarketDataProvider } from './types';

const REST = 'https://api.twelvedata.com';
const INTERVAL: Record<Timeframe, string> = { '1m': '1min', '5m': '5min', '15m': '15min', '1h': '1h', '4h': '4h', '1D': '1day', '1W': '1week', '1M': '1month' };

interface TdSymbol { symbol: string; instrument_name: string; exchange: string; mic_code: string; instrument_type: string; currency: string }
interface TdError { status?: string; code?: number; message?: string }

const typeOf = (t: string): InstrumentType =>
  /etf/i.test(t) ? 'etf' : /index/i.test(t) ? 'index' : /stock|equity|share|receipt|reit/i.test(t) ? 'stock' : /currency/i.test(t) ? 'forex' : 'other';

/** El símbolo interno es `TICKER@MIC` para distinguir el mismo ticker en bolsas distintas. */
const toInstrument = (s: TdSymbol): Instrument => ({
  id: `TD:${s.symbol}@${s.mic_code}`, symbol: s.symbol, name: s.instrument_name,
  exchange: s.exchange, type: typeOf(s.instrument_type), currency: s.currency, realtime: false,
});

const parseTime = (datetime: string) => Date.parse(datetime.length === 10 ? `${datetime}T00:00:00Z` : `${datetime.replace(' ', 'T')}Z`) / 1000;

export class TwelveDataProvider implements MarketDataProvider {
  readonly id = 'TD';
  private cache = new TtlCache<unknown>();

  constructor(private apiKey: string | undefined) {}

  info() {
    return {
      id: this.id, name: 'Twelve Data', enabled: !!this.apiKey, covers: 'Acciones, ETF e índices (diferido o cierre)',
      note: this.apiKey ? undefined : 'Falta la clave TWELVEDATA_API_KEY en el archivo .env.',
    };
  }

  private async call<T>(path: string, params: Record<string, string>): Promise<T> {
    if (!this.apiKey) throw new ProviderError('Twelve Data no está configurado: falta la clave.', 503);
    const query = new URLSearchParams({ ...params, apikey: this.apiKey });
    const data = await fetchJson<T & TdError>('twelvedata', `${REST}${path}?${query}`);
    // Twelve Data devuelve los errores con HTTP 200 y un campo `status: "error"`.
    if (data.status === 'error') {
      console.error('[twelvedata] Error del proveedor', { path, code: data.code, message: data.message });
      throw new ProviderError(data.code === 429 ? 'Se ha agotado la cuota gratuita de Twelve Data. Vuelve a intentarlo en un minuto.' : `Twelve Data: ${data.message ?? 'error desconocido'}`, data.code === 429 ? 429 : 502);
    }
    return data;
  }

  private split(symbol: string) {
    const [ticker = '', mic = ''] = symbol.split('@');
    return { symbol: ticker, ...(mic ? { mic_code: mic } : {}) };
  }

  search(query: string) {
    if (!this.apiKey) return Promise.resolve([]);
    return this.cache.get(`s:${query.toLowerCase()}`, 24 * 3600_000, async () => {
      const data = await this.call<{ data: TdSymbol[] }>('/symbol_search', { symbol: query, outputsize: '15' });
      return data.data.filter((s) => s.mic_code).map(toInstrument);
    }) as Promise<Instrument[]>;
  }

  async instrument(symbol: string) {
    const { symbol: ticker, mic_code } = this.split(symbol) as { symbol: string; mic_code?: string };
    const list = await this.search(ticker);
    return list.find((i) => i.id === `TD:${ticker}@${mic_code}`) ?? null;
  }

  candles({ symbol, tf, limit, before }: CandleQuery) {
    const params: Record<string, string> = { ...this.split(symbol), interval: INTERVAL[tf], outputsize: String(Math.min(limit, 5000)), timezone: 'UTC', order: 'ASC' };
    if (before) params.end_date = new Date((before - 1) * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const ttl = before ? 6 * 3600_000 : isIntraday(tf) ? 60_000 : 15 * 60_000;
    return this.cache.get(`k:${JSON.stringify(params)}`, ttl, async () => {
      const data = await this.call<{ values?: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }[] }>('/time_series', params);
      return (data.values ?? []).map((v) => ({ time: parseTime(v.datetime), open: +v.open, high: +v.high, low: +v.low, close: +v.close, volume: +(v.volume ?? 0) }));
    }) as Promise<Candle[]>;
  }

  async quotes(symbols: string[]) {
    // Una petición por símbolo, con cinco minutos de caché para no gastar la cuota por minuto.
    const results = await Promise.allSettled(symbols.map((s) =>
      this.cache.get(`q:${s}`, 5 * 60_000, async () => {
        const q = await this.call<{ close: string; percent_change: string }>('/quote', this.split(s));
        return { id: `TD:${s}`, last: +q.close, changePct: +q.percent_change } satisfies Quote;
      }) as Promise<Quote>));
    return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  }
}
