// tests/unit/wc2026.test.ts
// La WC2026 API devuelve un ARRAY DIRECTO (no un objeto envoltorio).
// El mock refleja eso: json: async () => MOCK_MATCHES (no { matches: ... })

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WC2026Match } from '@/lib/wc2026'

// ─── Datos mock que simulan la respuesta real de la API ─────────────────────
const MOCK_MATCHES: WC2026Match[] = [
  {
    id: 1,
    match_number: 1,
    round: 'group',
    group_name: 'A',
    home_team: 'Mexico',
    away_team: 'USA',
    home_score: 2,
    away_score: 1,
    status: 'finished',
    kickoff_utc: '2026-06-11T18:00:00.000Z',
    stadium: 'Estadio Azteca',
  },
  {
    id: 2,
    match_number: 2,
    round: 'group',
    group_name: 'A',
    home_team: 'Canada',
    away_team: 'Netherlands',
    home_score: null,
    away_score: null,
    status: 'live',
    kickoff_utc: '2026-06-11T21:00:00.000Z',
    stadium: 'BMO Field',
  },
  {
    id: 3,
    match_number: 3,
    round: 'group',
    group_name: 'B',
    home_team: 'Spain',
    away_team: 'Brazil',
    home_score: null,
    away_score: null,
    status: 'scheduled',
    kickoff_utc: '2026-06-12T21:00:00.000Z',
    stadium: 'MetLife Stadium',
  },
  {
    id: 73,
    match_number: 73,
    round: 'round_of_32',
    group_name: null,
    home_team: 'France',
    away_team: 'Morocco',
    home_score: null,
    away_score: null,
    status: 'scheduled',
    kickoff_utc: '2026-06-28T18:00:00.000Z',
    stadium: 'SoFi Stadium',
  },
  {
    id: 74,
    match_number: 74,
    round: 'round_of_32',
    group_name: null,
    home_team: null as unknown as string, // TBD — aún sin equipos
    away_team: null as unknown as string,
    home_score: null,
    away_score: null,
    status: 'scheduled',
    kickoff_utc: '2026-06-28T21:00:00.000Z',
    stadium: 'Lumen Field',
  },
]

// ─── Mock global de fetch ────────────────────────────────────────────────────
const mockFetch = vi.fn()
global.fetch = mockFetch

/** Simula una respuesta OK de la API devolviendo el array directo */
function mockApiOk(data: WC2026Match[] = MOCK_MATCHES) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data, // ← array directo, no { matches: data }
  } as unknown as Response)
}

// ─── Suite principal ─────────────────────────────────────────────────────────
describe('lib/wc2026', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules() // caché del módulo limpio en cada test
  })

  // ── getWC2026Matches ──────────────────────────────────────────────────────

  describe('getWC2026Matches', () => {
    it('llama a la API con la Authorization header correcta', async () => {
      mockApiOk()
      const { getWC2026Matches } = await import('@/lib/wc2026')
      await getWC2026Matches()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('wc2026api.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_key_fake',
          }),
        })
      )
    })

    it('devuelve todos los partidos correctamente parseados', async () => {
      mockApiOk()
      const { getWC2026Matches } = await import('@/lib/wc2026')
      const matches = await getWC2026Matches()

      expect(matches).toHaveLength(MOCK_MATCHES.length)
      expect(matches[0].match_number).toBe(1)
      expect(matches[0].status).toBe('finished')
      expect(matches[0].home_team).toBe('Mexico')
    })

    it('usa caché: la segunda llamada NO hace una segunda petición a fetch', async () => {
      mockApiOk()
      const { getWC2026Matches } = await import('@/lib/wc2026')
      await getWC2026Matches()
      await getWC2026Matches() // segunda llamada — debe usar caché

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('lanza error cuando la API devuelve status no-OK', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' } as Response)
      const { getWC2026Matches } = await import('@/lib/wc2026')
      await expect(getWC2026Matches()).rejects.toThrow('503')
    })

    it('lanza error cuando la API devuelve un objeto en vez de array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ matches: [] }), // formato incorrecto
      } as unknown as Response)
      const { getWC2026Matches } = await import('@/lib/wc2026')
      await expect(getWC2026Matches()).rejects.toThrow()
    })
  })

  // ── getLiveAndRecentMatches ───────────────────────────────────────────────

  describe('getLiveAndRecentMatches', () => {
    it('devuelve solo partidos en directo (filtra scheduled y finished no recientes)', async () => {
      mockApiOk()
      const { getLiveAndRecentMatches } = await import('@/lib/wc2026')
      const matches = await getLiveAndRecentMatches()

      // Solo debe incluir "live"
      // (finished con kickoff hace más de 3h se filtra; scheduled no se incluye)
      const statuses = matches.map((m) => m.status)
      expect(statuses.every((s) => s === 'live' || s === 'finished')).toBe(true)
    })
  })

  // ── getKnockoutMatchesWithTeams ───────────────────────────────────────────

  describe('getKnockoutMatchesWithTeams', () => {
    it('devuelve solo eliminatorios con equipos reales (excluye grupos y TBD)', async () => {
      mockApiOk()
      const { getKnockoutMatchesWithTeams } = await import('@/lib/wc2026')
      const matches = await getKnockoutMatchesWithTeams()

      // Solo partido 73 (round_of_32 con France vs Morocco)
      // Partido 74 tiene home_team=null → excluido
      expect(matches).toHaveLength(1)
      expect(matches[0].match_number).toBe(73)
      expect(matches[0].home_team).toBe('France')
    })

    it('devuelve array vacío cuando todos los eliminatorios son TBD', async () => {
      const allTbd: WC2026Match[] = [
        { id: 73, match_number: 73, round: 'round_of_32', group_name: null,
          home_team: null as unknown as string, away_team: null as unknown as string,
          home_score: null, away_score: null, status: 'scheduled',
          kickoff_utc: '2026-06-28T18:00:00.000Z', stadium: 'SoFi' },
      ]
      mockApiOk(allTbd)
      const { getKnockoutMatchesWithTeams } = await import('@/lib/wc2026')
      const matches = await getKnockoutMatchesWithTeams()
      expect(matches).toHaveLength(0)
    })
  })

  // ── normalizeTeamName ─────────────────────────────────────────────────────

  describe('normalizeTeamName', () => {
    it('traduce nombres de la API al español correctamente', async () => {
      const { normalizeTeamName } = await import('@/lib/wc2026')
      expect(normalizeTeamName('France')).toBe('Francia')
      expect(normalizeTeamName('Germany')).toBe('Alemania')
      expect(normalizeTeamName('Spain')).toBe('España')
      expect(normalizeTeamName('Brazil')).toBe('Brasil')
      expect(normalizeTeamName('Morocco')).toBe('Marruecos')
      expect(normalizeTeamName('USA')).toBe('Estados Unidos')
      expect(normalizeTeamName('United States')).toBe('Estados Unidos')
      expect(normalizeTeamName('Korea Republic')).toBe('República de Corea')
      expect(normalizeTeamName('IR Iran')).toBe('Irán')
      expect(normalizeTeamName('Bosnia-Herzegovina')).toBe('Bosnia y Herzegovina')
    })

    it('devuelve el mismo nombre si no hay traducción', async () => {
      const { normalizeTeamName } = await import('@/lib/wc2026')
      expect(normalizeTeamName('NombreDesconocido')).toBe('NombreDesconocido')
    })

    it('devuelve null para entrada null/undefined', async () => {
      const { normalizeTeamName } = await import('@/lib/wc2026')
      expect(normalizeTeamName(null)).toBeNull()
      expect(normalizeTeamName(undefined)).toBeNull()
      expect(normalizeTeamName('')).toBeNull()
    })
  })

  // ── findMatchInList ───────────────────────────────────────────────────────

  describe('findMatchInList', () => {
    it('encuentra un partido por nombres españoles', async () => {
      const { findMatchInList } = await import('@/lib/wc2026')
      const dbMatches = [
        { teamA: 'Francia', teamB: 'Marruecos', date: new Date('2026-06-28T18:00:00.000Z') },
      ]
      const result = findMatchInList(
        dbMatches,
        'Francia', 'Marruecos',
        'France', 'Morocco',
        new Date('2026-06-28T18:00:00.000Z')
      )
      expect(result).toBeDefined()
    })

    it('encuentra un partido con equipos en orden invertido', async () => {
      const { findMatchInList } = await import('@/lib/wc2026')
      const dbMatches = [
        { teamA: 'Marruecos', teamB: 'Francia', date: new Date('2026-06-28T18:00:00.000Z') },
      ]
      const result = findMatchInList(
        dbMatches,
        'Francia', 'Marruecos',
        'France', 'Morocco',
        new Date('2026-06-28T18:00:00.000Z')
      )
      expect(result).toBeDefined()
    })

    it('devuelve undefined si la fecha está fuera de la ventana (±5h)', async () => {
      const { findMatchInList } = await import('@/lib/wc2026')
      const dbMatches = [
        { teamA: 'Francia', teamB: 'Marruecos', date: new Date('2026-06-28T01:00:00.000Z') },
      ]
      const result = findMatchInList(
        dbMatches,
        'Francia', 'Marruecos',
        'France', 'Morocco',
        new Date('2026-06-28T18:00:00.000Z') // 17h de diferencia
      )
      expect(result).toBeUndefined()
    })

    it('devuelve undefined si algún nombre de equipo es null (TBD)', async () => {
      const { findMatchInList } = await import('@/lib/wc2026')
      const dbMatches = [{ teamA: 'Francia', teamB: 'Marruecos', date: new Date() }]
      expect(findMatchInList(dbMatches, null, 'Marruecos', null, 'Morocco', new Date())).toBeUndefined()
    })
  })
})
