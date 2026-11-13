/** Tipos de dominio compartidos entre servidor y cliente. */

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

/** Duración aproximada de cada temporalidad en segundos. */
export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1D': 86400, '1W': 604800, '1M': 2592000,
};

export const isTimeframe = (v: unknown): v is Timeframe => TIMEFRAMES.includes(v as Timeframe);
export const isIntraday = (tf: Timeframe) => TIMEFRAME_SECONDS[tf] < 86400;

/** Vela OHLCV. `time` es el inicio de la vela en segundos Unix (UTC). */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type InstrumentType = 'crypto' | 'stock' | 'etf' | 'index' | 'forex' | 'other';

/** Activo negociable. `id` es `PROVEEDOR:SÍMBOLO` y es único en toda la aplicación. */
export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  type: InstrumentType;
  currency: string;
  /** Indica si el proveedor emite velas en directo para este activo. */
  realtime: boolean;
}

export interface Quote {
  id: string;
  last: number;
  /** Variación porcentual respecto al cierre anterior (o a 24 h en cripto). */
  changePct: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  enabled: boolean;
  covers: string;
  /** Motivo por el que está desactivado, si lo está. */
  note?: string;
}

/** Mensajes del canal de tiempo real (WebSocket /api/stream). */
export type StreamClientMessage = { op: 'sub' | 'unsub'; id: string; tf: Timeframe };
export type StreamServerMessage =
  | { type: 'candle'; id: string; tf: Timeframe; candle: Candle }
  | { type: 'error'; message: string };
