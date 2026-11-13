/** Lista de seguimiento con cotizaciones que se refrescan solas. */
import { useEffect, useState } from 'react';
import type { Instrument, Quote } from '@atalaya/core';
import { api } from './api';
import { fmtPct, fmtPrice, trend } from './format';

interface Props {
  items: Instrument[];
  currentId: string;
  onPick: (i: Instrument) => void;
  onRemove: (id: string) => void;
}

export function Watchlist({ items, currentId, onPick, onRemove }: Props) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const ids = items.map((i) => i.id).join(',');

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api.quotes(ids ? ids.split(',') : [])
        .then((list) => {
          if (!cancelled) setQuotes(Object.fromEntries(list.map((q) => [q.id, q])));
        })
        .catch((error) => console.error('[watchlist] No se pudieron cargar las cotizaciones', error));
    load();
    const timer = window.setInterval(load, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ids]);

  if (items.length === 0) return <p className="hint">La lista está vacía. Busca un activo y pulsa «Seguir» para añadirlo.</p>;

  return (
    <ul className="wl">
      {items.map((i) => {
        const q = quotes[i.id];
        return (
          <li key={i.id} aria-current={i.id === currentId}>
            <button className="row" onClick={() => onPick(i)}>
              <span className="id"><b>{i.symbol}</b><small>{i.name}</small></span>
              <span className="num">{q ? fmtPrice(q.last) : '—'}</span>
              <span className={`num ${q ? trend(q.changePct) : 'muted'}`}>{q ? fmtPct(q.changePct) : '—'}</span>
            </button>
            <button className="remove" title={`Quitar ${i.symbol} de la lista`} aria-label={`Quitar ${i.symbol} de la lista`} onClick={() => onRemove(i.id)}>×</button>
          </li>
        );
      })}
    </ul>
  );
}
