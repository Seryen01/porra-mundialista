import type { Candle, Instrument, ProviderInfo, Quote, Timeframe } from '@atalaya/core';

export interface CandleQuery {
  symbol: string;
  tf: Timeframe;
  limit: number;
  /** Devuelve solo velas anteriores a este instante (segundos Unix). Sirve para paginar hacia atrás. */
  before?: number;
}

/**
 * Contrato que cumple cada proveedor de datos de mercado.
 * El resto de la aplicación solo conoce esta interfaz, de modo que cambiar o añadir
 * un proveedor no afecta a rutas, alertas ni cliente.
 */
export interface MarketDataProvider {
  readonly id: string;
  info(): ProviderInfo;
  search(query: string): Promise<Instrument[]>;
  /** Resuelve un símbolo del proveedor en un activo completo. */
  instrument(symbol: string): Promise<Instrument | null>;
  /** Velas en orden cronológico ascendente. */
  candles(query: CandleQuery): Promise<Candle[]>;
  quotes(symbols: string[]): Promise<Quote[]>;
  /** Suscripción a velas en directo. Devuelve la función para cancelarla. Ausente si no hay tiempo real. */
  subscribe?(symbol: string, tf: Timeframe, onCandle: (candle: Candle) => void): () => void;
}
