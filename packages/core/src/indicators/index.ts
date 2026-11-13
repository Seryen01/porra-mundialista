/**
 * Motor de indicadores técnicos.
 *
 * Todas las funciones son puras: reciben series numéricas alineadas con las velas y
 * devuelven series de la misma longitud, con `null` donde aún no hay datos suficientes.
 * Las definiciones siguen las convenciones habituales (Wilder para RSI y ATR), de modo
 * que los valores coinciden con los de las plataformas de referencia.
 */
import type { Candle } from '../types';

export type Series = (number | null)[];

const empty = (n: number): Series => Array<number | null>(n).fill(null);

/** Media móvil simple. */
export function sma(values: number[], period: number): Series {
  const out = empty(values.length);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Media móvil exponencial, inicializada con la SMA de los primeros `period` valores. */
export function ema(values: number[], period: number): Series {
  const out = empty(values.length);
  const k = 2 / (period + 1);
  let prev = 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (i < period) {
      sum += v;
      if (i === period - 1) out[i] = prev = sum / period;
    } else {
      out[i] = prev = v * k + prev * (1 - k);
    }
  }
  return out;
}

/** RSI con suavizado de Wilder. */
export function rsi(values: number[], period = 14): Series {
  const out = empty(values.length);
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const d = values[i]! - values[i - 1]!;
    const up = Math.max(d, 0);
    const down = Math.max(-d, 0);
    if (i <= period) {
      gain += up;
      loss += down;
      if (i < period) continue;
      gain /= period;
      loss /= period;
    } else {
      gain = (gain * (period - 1) + up) / period;
      loss = (loss * (period - 1) + down) / period;
    }
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

/** Bandas de Bollinger con desviación típica poblacional. */
export function bollinger(values: number[], period = 20, mult = 2): { middle: Series; upper: Series; lower: Series } {
  const middle = sma(values, period);
  const upper = empty(values.length);
  const lower = empty(values.length);
  for (let i = period - 1; i < values.length; i++) {
    const m = middle[i]!;
    let acc = 0;
    for (let j = i - period + 1; j <= i; j++) acc += (values[j]! - m) ** 2;
    const sd = Math.sqrt(acc / period);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { middle, upper, lower };
}

/** MACD: línea (EMA rápida − EMA lenta), señal (EMA de la línea) e histograma. */
export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): { macd: Series; signal: Series; histogram: Series } {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line: Series = values.map((_, i) => (f[i] != null && s[i] != null ? f[i]! - s[i]! : null));
  const start = line.findIndex((v) => v != null);
  const signal = empty(values.length);
  const histogram = empty(values.length);
  if (start >= 0) {
    const sig = ema(line.slice(start) as number[], signalPeriod);
    sig.forEach((v, i) => {
      signal[start + i] = v;
      if (v != null) histogram[start + i] = line[start + i]! - v;
    });
  }
  return { macd: line, signal, histogram };
}

/** Rango verdadero medio (ATR) con suavizado de Wilder. */
export function atr(candles: Candle[], period = 14): Series {
  const out = empty(candles.length);
  let acc = 0;
  let prev = 0;
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    const pc = candles[i - 1]!.close;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc));
    if (i <= period) {
      acc += tr;
      if (i === period) out[i] = prev = acc / period;
    } else {
      out[i] = prev = (prev * (period - 1) + tr) / period;
    }
  }
  return out;
}
