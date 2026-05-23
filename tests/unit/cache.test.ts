// tests/unit/cache.test.ts
// Importación estática para que v8 pueda rastrear la cobertura correctamente.
// Cada test usa claves únicas (prefijo + contador) para aislar el estado del Map
// sin necesidad de vi.resetModules().
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache'

let n = 0
const k = (base: string) => `${base}_${++n}`

describe('lib/cache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve null para una clave inexistente', () => {
    expect(cacheGet(k('inexistente'))).toBeNull()
  })

  it('almacena y recupera un valor correctamente', () => {
    const key = k('store')
    cacheSet(key, { data: 'hola' }, 60)
    const result = cacheGet<{ data: string }>(key)
    expect(result?.data).toBe('hola')
  })

  it('expira el valor después del TTL', () => {
    const key = k('expire')
    cacheSet(key, 'valor', 10) // TTL: 10 segundos
    vi.advanceTimersByTime(11_000)       // avanzar 11 segundos
    expect(cacheGet(key)).toBeNull()
  })

  it('no expira el valor antes del TTL', () => {
    const key = k('valid')
    cacheSet(key, 'valor', 60)
    vi.advanceTimersByTime(59_000)       // avanzar 59 segundos
    expect(cacheGet(key)).toBe('valor')
  })

  it('actualiza el valor si se vuelve a hacer set', () => {
    const key = k('update')
    cacheSet(key, 'valor_inicial', 60)
    cacheSet(key, 'valor_actualizado', 60)
    expect(cacheGet(key)).toBe('valor_actualizado')
  })

  it('maneja múltiples claves independientemente', () => {
    const keyA = k('multi_a')
    const keyB = k('multi_b')
    cacheSet(keyA, 'A', 60)
    cacheSet(keyB, 'B', 10)
    vi.advanceTimersByTime(11_000)
    expect(cacheGet(keyA)).toBe('A')     // sigue vivo
    expect(cacheGet(keyB)).toBeNull()    // expirado
  })

  it('cacheDelete elimina la clave correctamente', () => {
    const key = k('delete')
    cacheSet(key, 'valor', 60)
    cacheDelete(key)
    expect(cacheGet(key)).toBeNull()
  })

  it('cacheDelete en clave inexistente no lanza error', () => {
    expect(() => cacheDelete(k('no_existe'))).not.toThrow()
  })

  it('soporta cualquier tipo de valor (object, array, number)', () => {
    const kObj = k('obj')
    const kArr = k('arr')
    const kNum = k('num')
    cacheSet(kObj, { a: 1, b: [2, 3] }, 60)
    cacheSet(kArr, [1, 2, 3], 60)
    cacheSet(kNum, 42, 60)
    expect(cacheGet<{ a: number }>(kObj)).toEqual({ a: 1, b: [2, 3] })
    expect(cacheGet<number[]>(kArr)).toEqual([1, 2, 3])
    expect(cacheGet<number>(kNum)).toBe(42)
  })
})
