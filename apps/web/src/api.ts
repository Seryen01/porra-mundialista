/** Acceso a la API del servidor y al canal de tiempo real. */
import type { Candle, Instrument, ProviderInfo, Quote, StreamClientMessage, StreamServerMessage, Timeframe } from '@atalaya/core';

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Error ${res.status}`);
  return body as T;
}

export const api = {
  providers: () => get<ProviderInfo[]>('/api/providers'),
  search: (q: string, signal?: AbortSignal) => get<Instrument[]>(`/api/search?q=${encodeURIComponent(q)}`, signal),
  candles: (id: string, tf: Timeframe, opts: { before?: number; signal?: AbortSignal } = {}) =>
    get<Candle[]>(`/api/candles?id=${encodeURIComponent(id)}&tf=${tf}&limit=600${opts.before ? `&before=${opts.before}` : ''}`, opts.signal),
  quotes: (ids: string[]) => (ids.length ? get<Quote[]>(`/api/quotes?ids=${ids.map(encodeURIComponent).join(',')}`) : Promise.resolve([])),
};

/**
 * Suscripción a velas en directo. Reconecta sola si se cae la conexión.
 * Devuelve la función para cancelar.
 */
export function streamCandles(id: string, tf: Timeframe, onCandle: (c: Candle) => void, onStatus: (live: boolean) => void): () => void {
  let socket: WebSocket | null = null;
  let closed = false;
  let timer: number | undefined;
  let retry = 0;

  const connect = () => {
    socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/stream`);
    socket.onopen = () => {
      retry = 0;
      socket!.send(JSON.stringify({ op: 'sub', id, tf } satisfies StreamClientMessage));
    };
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as StreamServerMessage;
      if (msg.type === 'candle' && msg.id === id && msg.tf === tf) {
        onStatus(true);
        onCandle(msg.candle);
      } else if (msg.type === 'error') {
        console.warn('[api] Aviso del canal en directo', { message: msg.message });
      }
    };
    socket.onclose = () => {
      onStatus(false);
      if (!closed) timer = window.setTimeout(connect, Math.min(15_000, 1000 * 2 ** retry++));
    };
  };
  connect();

  return () => {
    closed = true;
    window.clearTimeout(timer);
    socket?.close();
  };
}
