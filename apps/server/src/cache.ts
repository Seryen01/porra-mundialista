/** Caché en memoria con caducidad. Evita repetir peticiones idénticas y agotar las cuotas gratuitas. */
export class TtlCache<V> {
  private store = new Map<string, { value: Promise<V>; expires: number }>();

  constructor(private maxEntries = 500) {}

  /** Devuelve el valor en caché o lo calcula. Las peticiones simultáneas comparten la misma promesa. */
  get(key: string, ttlMs: number, load: () => Promise<V>): Promise<V> {
    const hit = this.store.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    const value = load();
    this.store.set(key, { value, expires: Date.now() + ttlMs });
    value.catch(() => this.store.delete(key)); // los errores no se guardan
    if (this.store.size > this.maxEntries) this.store.delete(this.store.keys().next().value!);
    return value;
  }
}
