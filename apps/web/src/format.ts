/** Formato numérico en español. */

/** Decimales adecuados al orden de magnitud del precio. */
export function priceDecimals(price: number): number {
  const p = Math.abs(price);
  return p >= 1 ? 2 : p >= 0.1 ? 4 : p >= 0.001 ? 6 : 8;
}

export const fmt = (v: number, decimals = 2) =>
  v.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);

export const fmtPrice = (v: number) => fmt(v, priceDecimals(v));
export const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${fmt(v, 2)} %`;
export const fmtVolume = (v: number) => new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 2 }).format(v);
export const trend = (v: number) => (v > 0 ? 'up' : v < 0 ? 'down' : 'muted');
