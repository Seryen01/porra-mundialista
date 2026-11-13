/** Registro de proveedores. Un identificador de activo es `PROVEEDOR:SÍMBOLO`. */
import { BinanceProvider } from './providers/binance';
import { TwelveDataProvider } from './providers/twelvedata';
import type { MarketDataProvider } from './providers/types';
import { ProviderError } from './http';

export const providers: MarketDataProvider[] = [
  new BinanceProvider(),
  new TwelveDataProvider(process.env.TWELVEDATA_API_KEY || undefined),
];

export function resolve(id: string): { provider: MarketDataProvider; symbol: string } {
  const cut = id.indexOf(':');
  const provider = providers.find((p) => p.id === id.slice(0, cut));
  const symbol = id.slice(cut + 1);
  if (cut < 1 || !provider || !/^[A-Za-z0-9._\-/@]{1,40}$/.test(symbol)) throw new ProviderError(`Activo desconocido: ${id}`, 400);
  return { provider, symbol };
}
