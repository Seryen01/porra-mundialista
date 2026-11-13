import { useEffect, useState } from 'react';
import { TIMEFRAMES, type Instrument, type ProviderInfo, type Timeframe } from '@atalaya/core';
import { api } from './api';
import { Chart, type ChartType } from './Chart';
import { INDICATORS } from './indicators';
import { Search } from './Search';
import { useStored } from './storage';
import { Watchlist } from './Watchlist';

const crypto = (symbol: string, base: string, quote: string): Instrument => ({
  id: `BINANCE:${symbol}`, symbol, name: `${base} / ${quote}`, exchange: 'Binance', type: 'crypto', currency: quote, realtime: true,
});
const DEFAULT_LIST = [crypto('BTCUSDT', 'BTC', 'USDT'), crypto('ETHUSDT', 'ETH', 'USDT'), crypto('SOLUSDT', 'SOL', 'USDT'), crypto('BTCEUR', 'BTC', 'EUR')];
const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: 'candles', label: 'Velas' }, { id: 'bars', label: 'Barras' }, { id: 'line', label: 'Línea' }, { id: 'area', label: 'Área' },
];
const TF_LABEL: Record<Timeframe, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1D': 'D', '1W': 'S', '1M': 'M' };

function useTheme() {
  const [choice, setChoice] = useStored<'dark' | 'light' | null>('atalaya.theme', null);
  const [system, setSystem] = useState<'dark' | 'light'>(() => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setSystem(mq.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const theme = choice ?? system;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return [theme, () => setChoice(theme === 'dark' ? 'light' : 'dark')] as const;
}

export function App() {
  const [theme, toggleTheme] = useTheme();
  const [instrument, setInstrument] = useStored<Instrument>('atalaya.instrument', DEFAULT_LIST[0]!);
  const [tf, setTf] = useStored<Timeframe>('atalaya.tf', '1D');
  const [type, setType] = useStored<ChartType>('atalaya.chartType', 'candles');
  const [active, setActive] = useStored<string[]>('atalaya.indicators', ['sma50', 'volume', 'rsi']);
  const [list, setList] = useStored<Instrument[]>('atalaya.watchlist', DEFAULT_LIST);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    api.providers().then(setProviders).catch((error) => console.error('[app] No se pudo leer el estado de los proveedores', error));
  }, []);

  const followed = list.some((i) => i.id === instrument.id);
  const toggleFollow = () => setList(followed ? list.filter((i) => i.id !== instrument.id) : [...list, instrument]);
  const toggleIndicator = (id: string) => setActive(active.includes(id) ? active.filter((x) => x !== id) : [...active, id]);

  return (
    <>
      <header className="top">
        <div className="brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 18V8l4-5 4 5v10M3 18h14M8.5 11h3" /></svg>
          <span>Atalaya</span>
        </div>
        <Search providers={providers} onPick={setInstrument} />
        <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>◐</button>
      </header>

      <main className="workspace">
        <section className="stage">
          <div className="bar">
            <div className="seg" role="group" aria-label="Temporalidad">
              {TIMEFRAMES.map((t) => <button key={t} aria-pressed={t === tf} onClick={() => setTf(t)}>{TF_LABEL[t]}</button>)}
            </div>
            <div className="seg" role="group" aria-label="Tipo de gráfico">
              {CHART_TYPES.map((t) => <button key={t.id} aria-pressed={t.id === type} onClick={() => setType(t.id)}>{t.label}</button>)}
            </div>
            <div className="seg" role="group" aria-label="Indicadores">
              {INDICATORS.map((d) => <button key={d.id} aria-pressed={active.includes(d.id)} onClick={() => toggleIndicator(d.id)}>{d.label}</button>)}
            </div>
            <button className="follow" aria-pressed={followed} onClick={toggleFollow}>{followed ? '★ Siguiendo' : '☆ Seguir'}</button>
          </div>
          <Chart instrument={instrument} tf={tf} type={type} active={active} theme={theme} />
        </section>

        <aside className="side">
          <header><h2>Lista de seguimiento</h2></header>
          <Watchlist items={list} currentId={instrument.id} onPick={setInstrument} onRemove={(id) => setList(list.filter((i) => i.id !== id))} />
        </aside>
      </main>
    </>
  );
}
