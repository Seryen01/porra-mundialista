/** Servidor de Atalaya: API REST de datos de mercado, canal de tiempo real y, en producción, la web. */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { isTimeframe, type Instrument, type Quote } from '@atalaya/core';
import { ProviderError } from './http';
import { providers, resolve } from './registry';
import { handleStreamClient } from './stream';

const app = Fastify();
await app.register(websocket);

app.setErrorHandler((err, request, reply) => {
  const error = err as Error & { statusCode?: number };
  const status = error instanceof ProviderError ? error.status : (error.statusCode ?? 500);
  console.error('[server] Petición fallida', { url: request.url, status, message: error.message });
  reply.status(status).send({ error: status >= 500 && !(error instanceof ProviderError) ? 'Error interno del servidor.' : error.message });
});

app.get('/api/health', async () => ({ ok: true }));

app.get('/api/providers', async () => providers.map((p) => p.info()));

app.get<{ Querystring: { q?: string } }>('/api/search', async (request) => {
  const q = (request.query.q ?? '').trim().slice(0, 40);
  if (!q) return [];
  // Un proveedor caído o sin cuota no debe dejar la búsqueda sin resultados de los demás.
  const settled = await Promise.allSettled(providers.map((p) => p.search(q)));
  // Las coincidencias exactas de ticker van primero, sea cual sea el proveedor.
  const exact = (i: Instrument) => (i.symbol.toUpperCase() === q.toUpperCase() ? 0 : 1);
  const results: Instrument[] = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])).sort((a, b) => exact(a) - exact(b));
  console.log('[server] Búsqueda', { q, results: results.length, failed: settled.filter((r) => r.status === 'rejected').length });
  return results;
});

app.get<{ Querystring: { id?: string } }>('/api/instrument', async (request) => {
  const { provider, symbol } = resolve(request.query.id ?? '');
  const instrument = await provider.instrument(symbol);
  if (!instrument) throw new ProviderError('Activo no encontrado.', 404);
  return instrument;
});

app.get<{ Querystring: { id?: string; tf?: string; limit?: string; before?: string } }>('/api/candles', async (request) => {
  const { id = '', tf, limit, before } = request.query;
  if (!isTimeframe(tf)) throw new ProviderError('Temporalidad no válida.', 400);
  const { provider, symbol } = resolve(id);
  const candles = await provider.candles({
    symbol, tf,
    limit: Math.min(Math.max(Number(limit) || 500, 1), 1000),
    before: Number(before) > 0 ? Math.floor(Number(before)) : undefined,
  });
  console.log('[server] Velas servidas', { id, tf, count: candles.length, before: before ?? null });
  return candles;
});

app.get<{ Querystring: { ids?: string } }>('/api/quotes', async (request) => {
  const ids = (request.query.ids ?? '').split(',').filter(Boolean).slice(0, 60);
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const { provider, symbol } = resolve(id);
    groups.set(provider.id, [...(groups.get(provider.id) ?? []), symbol]);
  }
  const settled = await Promise.allSettled([...groups].map(([pid, symbols]) => providers.find((p) => p.id === pid)!.quotes(symbols)));
  const quotes: Quote[] = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  console.log('[server] Cotizaciones servidas', { requested: ids.length, returned: quotes.length });
  return quotes;
});

app.get('/api/stream', { websocket: true }, (socket) => handleStreamClient(socket));

// En producción el mismo proceso sirve la web ya compilada.
const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));
if (existsSync(webDist)) {
  await app.register(fastifyStatic, { root: webDist });
  console.log('[server] Web estática activada', { webDist });
}

const port = Number(process.env.PORT) || 4000;
await app.listen({ port, host: process.env.HOST ?? '127.0.0.1' });
console.log('[server] Atalaya en marcha', { port, providers: providers.map((p) => ({ id: p.id, enabled: p.info().enabled })) });
