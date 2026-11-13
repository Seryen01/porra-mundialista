/** Buscador de activos con resultados en vivo y manejo por teclado. */
import { useEffect, useRef, useState } from 'react';
import type { Instrument, ProviderInfo } from '@atalaya/core';
import { api } from './api';

const TYPE_LABEL: Record<Instrument['type'], string> = { crypto: 'Cripto', stock: 'Acción', etf: 'ETF', index: 'Índice', forex: 'Divisa', other: 'Otro' };

export function Search({ providers, onPick }: { providers: ProviderInfo[]; onPick: (i: Instrument) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Instrument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      api.search(q, abort.signal)
        .then((list) => {
          setResults(list);
          setError(null);
          setCursor(0);
        })
        .catch((e: Error) => {
          if (!abort.signal.aborted) setError(e.message);
        });
    }, 250);
    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setResults(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (i: Instrument) => {
    onPick(i);
    setQuery('');
    setResults(null);
  };
  const disabled = providers.filter((p) => !p.enabled);

  return (
    <div className="search" ref={box}>
      <input
        type="search" value={query} placeholder="Buscar símbolo o nombre" aria-label="Buscar activo" autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (!results?.length) return;
          if (e.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, results.length - 1));
          else if (e.key === 'ArrowUp') setCursor((c) => Math.max(c - 1, 0));
          else if (e.key === 'Enter') pick(results[cursor]!);
          else if (e.key === 'Escape') setResults(null);
          else return;
          e.preventDefault();
        }}
      />
      {(results || error) && query.trim() && (
        <div className="results" role="listbox">
          {error && <div className="hint error">{error}</div>}
          {results?.map((i, n) => (
            <button key={i.id} role="option" aria-selected={n === cursor} onMouseEnter={() => setCursor(n)} onClick={() => pick(i)}>
              <b>{i.symbol}</b>
              <span className="name">{i.name}</span>
              <span className="muted">{TYPE_LABEL[i.type]} · {i.exchange}</span>
            </button>
          ))}
          {results?.length === 0 && !error && <div className="hint">Sin resultados para «{query.trim()}».</div>}
          {disabled.map((p) => (
            <div className="hint" key={p.id}>{p.covers}: no disponible. {p.note}</div>
          ))}
        </div>
      )}
    </div>
  );
}
