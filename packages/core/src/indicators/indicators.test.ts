import { describe, expect, it } from 'vitest';
import { atr, bollinger, ema, macd, rsi, sma } from './index';

// Serie de referencia clásica (Wilder / StockCharts) para validar el RSI de 14 periodos.
const closes = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.0,
  46.03, 46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 45.78, 45.35, 44.03, 44.18, 44.22, 44.57, 43.42, 42.66, 43.13];

describe('indicadores', () => {
  it('sma', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('ema arranca en la sma y aplica el factor 2/(n+1)', () => {
    const out = ema([1, 2, 3, 4, 5], 3);
    expect(out.slice(0, 3)).toEqual([null, null, 2]);
    expect(out[3]).toBeCloseTo(3, 10);
    expect(out[4]).toBeCloseTo(4, 10);
  });

  it('rsi coincide con los valores publicados de referencia', () => {
    const out = rsi(closes, 14);
    expect(out[13]).toBeNull();
    expect(out[14]).toBeCloseTo(70.46, 1);
    expect(out[15]).toBeCloseTo(66.25, 1);
    expect(out[16]).toBeCloseTo(66.48, 1);
    expect(out[32]).toBeCloseTo(37.79, 1);
  });

  it('rsi vale 100 si no hay caídas', () => {
    expect(rsi([1, 2, 3, 4, 5, 6], 3).at(-1)).toBe(100);
  });

  it('bollinger', () => {
    const { middle, upper, lower } = bollinger([2, 4, 4, 4, 5, 5, 7, 9], 8, 2);
    expect(middle[7]).toBe(5);
    expect(upper[7]).toBeCloseTo(9, 10); // desviación típica poblacional = 2
    expect(lower[7]).toBeCloseTo(1, 10);
  });

  it('macd: el histograma es línea menos señal', () => {
    const v = Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 5) * 10 + i * 0.3);
    const m = macd(v);
    expect(m.macd[24]).toBeNull();
    expect(m.macd[25]).not.toBeNull();
    expect(m.signal[32]).toBeNull();
    expect(m.signal[33]).not.toBeNull();
    expect(m.histogram[60]).toBeCloseTo(m.macd[60]! - m.signal[60]!, 12);
  });

  it('atr con rango constante', () => {
    const candles = Array.from({ length: 20 }, (_, i) => ({ time: i, open: 10, high: 11, low: 9, close: 10, volume: 1 }));
    const out = atr(candles, 14);
    expect(out[13]).toBeNull();
    expect(out[14]).toBeCloseTo(2, 10);
    expect(out[19]).toBeCloseTo(2, 10);
  });
});
