/**
 * Catálogo de indicadores que el gráfico sabe dibujar.
 * Cada indicador se describe con datos (dónde va y qué series pinta), de modo que
 * añadir uno nuevo no requiere tocar el componente del gráfico.
 */
import { bollinger, ema, macd, rsi, sma, type Candle, type Series } from '@atalaya/core';

export interface PlotDef {
  kind: 'line' | 'histogram';
  /** Nombre de la variable CSS con el color. */
  color: string;
  width?: 1 | 2;
  dashed?: boolean;
  calc: (candles: Candle[]) => Series;
}

export interface IndicatorDef {
  id: string;
  label: string;
  /** `price`: superpuesto al precio. `own`: en un panel propio bajo el gráfico. `volume`: histograma de volumen. */
  pane: 'price' | 'own' | 'volume';
  plots: PlotDef[];
  /** Niveles horizontales de referencia (p. ej. 30 y 70 en el RSI). */
  levels?: number[];
  /** Decimales fijos del eje. Si se omite, usa los del precio. */
  precision?: number;
}

const closes = (c: Candle[]) => c.map((x) => x.close);

export const INDICATORS: IndicatorDef[] = [
  { id: 'sma50', label: 'SMA 50', pane: 'price', plots: [{ kind: 'line', color: '--ind1', width: 2, calc: (c) => sma(closes(c), 50) }] },
  { id: 'sma200', label: 'SMA 200', pane: 'price', plots: [{ kind: 'line', color: '--ind2', width: 2, calc: (c) => sma(closes(c), 200) }] },
  { id: 'ema20', label: 'EMA 20', pane: 'price', plots: [{ kind: 'line', color: '--accent', calc: (c) => ema(closes(c), 20) }] },
  {
    id: 'bb', label: 'Bollinger', pane: 'price',
    plots: [
      { kind: 'line', color: '--ind3', dashed: true, calc: (c) => bollinger(closes(c)).upper },
      { kind: 'line', color: '--ind3', calc: (c) => bollinger(closes(c)).middle },
      { kind: 'line', color: '--ind3', dashed: true, calc: (c) => bollinger(closes(c)).lower },
    ],
  },
  { id: 'volume', label: 'Volumen', pane: 'volume', plots: [] },
  { id: 'rsi', label: 'RSI 14', pane: 'own', precision: 1, levels: [70, 30], plots: [{ kind: 'line', color: '--ind2', width: 2, calc: (c) => rsi(closes(c), 14) }] },
  {
    id: 'macd', label: 'MACD', pane: 'own',
    plots: [
      { kind: 'histogram', color: '--muted', calc: (c) => macd(closes(c)).histogram },
      { kind: 'line', color: '--ind1', calc: (c) => macd(closes(c)).macd },
      { kind: 'line', color: '--accent', calc: (c) => macd(closes(c)).signal },
    ],
  },
];
