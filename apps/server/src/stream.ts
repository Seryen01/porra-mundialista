/**
 * Concentrador de tiempo real. Mantiene una única conexión con el proveedor por cada
 * par activo/temporalidad y la reparte entre todos los clientes suscritos.
 */
import type { WebSocket } from 'ws';
import { isTimeframe, type StreamClientMessage, type StreamServerMessage, type Timeframe } from '@atalaya/core';
import { resolve } from './registry';

interface Channel { clients: Set<WebSocket>; close: () => void }
const channels = new Map<string, Channel>();
const send = (socket: WebSocket, message: StreamServerMessage) => socket.readyState === socket.OPEN && socket.send(JSON.stringify(message));

function subscribe(socket: WebSocket, id: string, tf: Timeframe) {
  const key = `${id}|${tf}`;
  let channel = channels.get(key);
  if (!channel) {
    const { provider, symbol } = resolve(id);
    if (!provider.subscribe) return send(socket, { type: 'error', message: 'Este activo no tiene datos en tiempo real.' });
    const clients = new Set<WebSocket>();
    const close = provider.subscribe(symbol, tf, (candle) => clients.forEach((c) => send(c, { type: 'candle', id, tf, candle })));
    channel = { clients, close };
    channels.set(key, channel);
  }
  channel.clients.add(socket);
  console.log('[stream] Cliente suscrito', { key, clients: channel.clients.size });
}

function unsubscribe(socket: WebSocket, key: string) {
  const channel = channels.get(key);
  if (!channel?.clients.delete(socket)) return;
  console.log('[stream] Cliente dado de baja', { key, clients: channel.clients.size });
  if (channel.clients.size === 0) {
    channel.close();
    channels.delete(key);
  }
}

export function handleStreamClient(socket: WebSocket) {
  const mine = new Set<string>();
  socket.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as StreamClientMessage;
      if (typeof msg.id !== 'string' || !isTimeframe(msg.tf)) throw new Error('Mensaje no válido');
      const key = `${msg.id}|${msg.tf}`;
      if (msg.op === 'sub' && mine.size < 50) {
        subscribe(socket, msg.id, msg.tf);
        mine.add(key);
      } else if (msg.op === 'unsub') {
        unsubscribe(socket, key);
        mine.delete(key);
      }
    } catch (error) {
      console.error('[stream] Mensaje de cliente rechazado', error);
      send(socket, { type: 'error', message: error instanceof Error ? error.message : 'Mensaje no válido' });
    }
  });
  socket.on('close', () => mine.forEach((key) => unsubscribe(socket, key)));
}
