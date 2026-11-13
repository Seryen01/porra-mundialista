/** Cliente HTTP mínimo para las APIs de proveedores: tiempo límite, registro y errores tipados. */

export class ProviderError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

export async function fetchJson<T>(module: string, url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<T> {
  // Nunca se registra la URL completa: puede llevar la clave en la query.
  const safe = url.replace(/apikey=[^&]+/i, 'apikey=***');
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    console.error(`[${module}] Fallo de red`, { url: safe, error });
    throw new ProviderError('No se pudo contactar con el proveedor de datos.');
  }
  console.log(`[${module}] Petición al proveedor`, { url: safe, status: res.status, ms: Date.now() - started });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[${module}] Respuesta de error`, { status: res.status, body: body.slice(0, 200) });
    throw new ProviderError(`El proveedor respondió con el código ${res.status}.`, res.status === 429 ? 429 : 502);
  }
  return (await res.json()) as T;
}
