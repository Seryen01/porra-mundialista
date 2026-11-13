/**
 * Gráfico financiero. Carga el histórico del activo, lo amplía al desplazarse hacia atrás,
 * aplica las velas en directo y dibuja los indicadores activos.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AreaSeries, BarSeries, CandlestickSeries, ColorType, CrosshairMode, HistogramSeries, LineSeries, LineStyle, TickMarkType, createChart,
  type ISeriesApi, type SeriesType, type Time, type UTCTimestamp,
} from 'lightweight-charts';
import { isIntraday, type Candle, type Instrument, type Series, type Timeframe } from '@atalaya/core';
import { api, streamCandles } from './api';
import { fmtPct, fmtPrice, fmtVolume, priceDecimals, trend } from './format';
import { INDICATORS } from './indicators';

export type ChartType = 'candles' | 'bars' | 'line' | 'area';

interface Props {
  instrument: Instrument;
  tf: Timeframe;
  type: ChartType;
  active: string[];
  theme: 'dark' | 'light';
}

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const at = (time: number) => time as UTCTimestamp;
const toLine = (candles: Candle[], values: Series) =>
  candles.flatMap((c, i) => (values[i] == null ? [] : [{ time: at(c.time), value: values[i]! }]));

/** Índice de la vela con ese instante, por búsqueda binaria. */
function indexOfTime(candles: Candle[], time: number) {
  let lo = 0;
  let hi = candles.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = candles[mid]!.time;
    if (t === time) return mid;
    if (t < time) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

export function Chart({ instrument, tf, type, active, theme }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const data = useRef<Candle[]>([]);
  const applyTick = useRef<(c: Candle) => void>(() => {});
  const paging = useRef({ busy: false, done: false });
  const savedRange = useRef<{ key: string; from: number; to: number } | null>(null);
  const currentKey = useRef('');
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });
  const [live, setLive] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [, repaintLegend] = useState(0);

  const key = `${instrument.id}|${tf}`;
  currentKey.current = key;

  // 1. Carga del histórico y suscripción a datos nuevos.
  useEffect(() => {
    const abort = new AbortController();
    data.current = [];
    paging.current = { busy: false, done: false };
    setStatus({ loading: true, error: null });
    setLive(false);
    setHoverTime(null);
    setVersion((v) => v + 1);

    api.candles(instrument.id, tf, { signal: abort.signal })
      .then((candles) => {
        data.current = candles;
        setStatus({ loading: false, error: candles.length ? null : 'El proveedor no tiene datos de este activo en esta temporalidad.' });
        setVersion((v) => v + 1);
      })
      .catch((error: Error) => {
        if (abort.signal.aborted) return;
        console.error('[chart] No se pudieron cargar las velas', error);
        setStatus({ loading: false, error: error.message });
      });

    let stop: () => void;
    if (instrument.realtime) {
      stop = streamCandles(instrument.id, tf, (c) => applyTick.current(c), setLive);
    } else {
      // Sin flujo en directo: se refrescan las últimas velas una vez por minuto.
      const timer = window.setInterval(() => {
        api.candles(instrument.id, tf).then((c) => c.slice(-2).forEach((x) => applyTick.current(x))).catch(() => {});
      }, 60_000);
      stop = () => window.clearInterval(timer);
    }
    return () => {
      abort.abort();
      stop();
    };
  }, [instrument.id, instrument.realtime, tf]);

  // 2. Construcción del gráfico. Se rehace al cambiar datos de base, tipo, indicadores o tema.
  const activeKey = active.join(',');
  useEffect(() => {
    const el = container.current;
    const candles = data.current;
    if (!el || candles.length === 0) return;

    const intraday = isIntraday(tf);
    const up = cssVar('--up');
    const down = cssVar('--down');
    const decimals = priceDecimals(candles[candles.length - 1]!.close);
    const priceFormat = { type: 'price' as const, precision: decimals, minMove: 1 / 10 ** decimals };
    const local = (t: Time) => new Date((t as number) * 1000);

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: cssVar('--panel') }, textColor: cssVar('--muted'),
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11, panes: { separatorColor: cssVar('--line') },
      },
      grid: { vertLines: { color: cssVar('--grid') }, horzLines: { color: cssVar('--grid') } },
      rightPriceScale: { borderColor: cssVar('--line') },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: cssVar('--line'), timeVisible: intraday, rightOffset: 4,
        // Las velas intradía se rotulan en la hora local del usuario; las diarias, por fecha.
        tickMarkFormatter: (t: Time, kind: TickMarkType) => {
          if (!intraday) return null;
          const d = local(t);
          if (kind === TickMarkType.Year) return String(d.getFullYear());
          if (kind === TickMarkType.Month) return d.toLocaleDateString('es-ES', { month: 'short' });
          if (kind === TickMarkType.DayOfMonth) return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        },
      },
      localization: {
        locale: 'es-ES',
        timeFormatter: (t: Time) =>
          intraday
            ? local(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : local(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
      },
    });

    // Serie principal
    const simple = type === 'line' || type === 'area';
    const toMain = (c: Candle) => (simple ? { time: at(c.time), value: c.close } : { time: at(c.time), open: c.open, high: c.high, low: c.low, close: c.close });
    let main: ISeriesApi<SeriesType>;
    if (type === 'candles') main = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, borderVisible: false, wickUpColor: up, wickDownColor: down, priceFormat });
    else if (type === 'bars') main = chart.addSeries(BarSeries, { upColor: up, downColor: down, priceFormat });
    else if (type === 'line') main = chart.addSeries(LineSeries, { color: cssVar('--fg'), lineWidth: 2, priceFormat });
    else main = chart.addSeries(AreaSeries, { lineColor: cssVar('--accent'), topColor: alpha(cssVar('--accent'), 0.3), bottomColor: alpha(cssVar('--accent'), 0), lineWidth: 2, priceFormat });
    main.setData(candles.map(toMain));

    // Indicadores
    const volumePoint = (c: Candle) => ({ time: at(c.time), value: c.volume, color: alpha(c.close >= c.open ? up : down, 0.4) });
    const histPoint = (time: number, value: number) => ({ time: at(time), value, color: alpha(value >= 0 ? up : down, 0.6) });
    let volume: ISeriesApi<'Histogram'> | null = null;
    const plots: { series: ISeriesApi<SeriesType>; calc: (c: Candle[]) => Series; histogram: boolean }[] = [];
    let nextPane = 1;
    for (const def of INDICATORS) {
      if (!active.includes(def.id)) continue;
      if (def.pane === 'volume') {
        volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol', priceLineVisible: false, lastValueVisible: false });
        chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
        volume.setData(candles.map(volumePoint));
        continue;
      }
      const pane = def.pane === 'own' ? nextPane++ : 0;
      const format = def.precision != null ? { type: 'price' as const, precision: def.precision, minMove: 1 / 10 ** def.precision } : priceFormat;
      def.plots.forEach((plot, i) => {
        const values = plot.calc(candles);
        const common = { priceLineVisible: false, lastValueVisible: def.pane === 'own' && plot.kind === 'line', priceFormat: format };
        let series: ISeriesApi<SeriesType>;
        if (plot.kind === 'histogram') {
          series = chart.addSeries(HistogramSeries, common, pane);
          series.setData(candles.flatMap((c, j) => (values[j] == null ? [] : [histPoint(c.time, values[j]!)])));
        } else {
          series = chart.addSeries(LineSeries, { ...common, color: cssVar(plot.color), lineWidth: plot.width ?? 1, lineStyle: plot.dashed ? LineStyle.Dashed : LineStyle.Solid, crosshairMarkerVisible: false }, pane);
          series.setData(toLine(candles, values));
        }
        if (i === 0) def.levels?.forEach((price) => series.createPriceLine({ price, color: cssVar('--muted'), lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: true, title: '' }));
        plots.push({ series, calc: plot.calc, histogram: plot.kind === 'histogram' });
      });
    }
    // Reparto de altura: el precio manda y cada panel de indicador recibe una franja igual.
    const panes = chart.panes();
    panes.forEach((p, i) => p.setStretchFactor(i === 0 ? Math.max(2, 5 - (panes.length - 1)) : 1));

    // Rango visible: se conserva entre reconstrucciones del mismo activo y temporalidad.
    const ts = chart.timeScale();
    if (savedRange.current?.key === key) ts.setVisibleLogicalRange(savedRange.current);
    else ts.setVisibleLogicalRange({ from: candles.length - 160, to: candles.length + 4 });

    // Al acercarse al borde izquierdo se piden velas más antiguas.
    const loadOlder = () => {
      const state = paging.current;
      if (state.busy || state.done) return;
      state.busy = true;
      const first = data.current[0]!.time;
      api.candles(instrument.id, tf, { before: first })
        .then((older) => {
          if (currentKey.current !== key) return;
          const fresh = older.filter((c) => c.time < first);
          if (fresh.length === 0) {
            state.done = true;
            return;
          }
          data.current = [...fresh, ...data.current];
          if (savedRange.current?.key === key) {
            savedRange.current = { key, from: savedRange.current.from + fresh.length, to: savedRange.current.to + fresh.length };
          }
          setVersion((v) => v + 1);
        })
        .catch((error) => console.error('[chart] No se pudo ampliar el histórico', error))
        .finally(() => {
          state.busy = false;
        });
    };
    ts.subscribeVisibleLogicalRangeChange((range) => {
      if (!range) return;
      savedRange.current = { key, from: range.from, to: range.to };
      if (range.from < 20) loadOlder();
    });

    chart.subscribeCrosshairMove((param) => setHoverTime(typeof param.time === 'number' ? param.time : null));

    // Velas en directo: actualizan la última vela o añaden una nueva, sin reconstruir el gráfico.
    applyTick.current = (c) => {
      const list = data.current;
      const last = list[list.length - 1];
      if (!last || c.time < last.time) return;
      if (c.time === last.time) list[list.length - 1] = c;
      else list.push(c);
      main.update(toMain(c));
      volume?.update(volumePoint(c));
      for (const p of plots) {
        const value = p.calc(list).at(-1);
        if (value != null) p.series.update(p.histogram ? histPoint(c.time, value) : { time: at(c.time), value });
      }
      repaintLegend((n) => n + 1);
    };

    return () => {
      applyTick.current = () => {};
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, type, activeKey, theme]);

  // Leyenda: vela bajo el cursor o, si no hay, la última.
  const candles = data.current;
  const index = hoverTime != null ? indexOfTime(candles, hoverTime) : candles.length - 1;
  const candle = candles[index];
  const previous = candles[index - 1];
  const change = candle && previous ? (candle.close / previous.close - 1) * 100 : 0;

  return (
    <div className="chart-wrap">
      <div className="legend">
        <span className="sym">{instrument.symbol}</span>
        <span className="muted">{instrument.name} · {instrument.exchange} · {tf}</span>
        <span className={`badge ${instrument.realtime && live ? 'live' : ''}`}>
          {instrument.realtime ? (live ? 'En directo' : 'Conectando') : 'Diferido'}
        </span>
        {candle && (
          <>
            <span className="num">A {fmtPrice(candle.open)}</span>
            <span className="num">Máx {fmtPrice(candle.high)}</span>
            <span className="num">Mín {fmtPrice(candle.low)}</span>
            <span className="num">C {fmtPrice(candle.close)}</span>
            <span className={`num ${trend(change)}`}>{fmtPct(change)}</span>
            <span className="num muted">Vol {fmtVolume(candle.volume)}</span>
          </>
        )}
      </div>
      <div className="chart" ref={container} />
      {status.loading && <div className="overlay">Cargando velas…</div>}
      {status.error && <div className="overlay error">{status.error}</div>}
    </div>
  );
}
