// tests/api/live.test.ts
// Testea GET /api/matches/live
// La ruta usa getWC2026Matches + prisma internamente.
// Se mockean ambos para no tocar la API real ni la BD.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WC2026Match } from '@/lib/wc2026'

// ─── Mocks declarados ANTES de los imports de la ruta ───────────────────────

vi.mock('@/lib/wc2026', () => ({
  getWC2026Matches: vi.fn(),
  normalizeTeamName: (name: string | null | undefined) => name ?? null,
  findMatchInList: vi.fn().mockReturnValue(undefined),
  isMatchReversed: vi.fn().mockReturnValue(false),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany:    vi.fn().mockResolvedValue([]),
      updateMany:  vi.fn().mockResolvedValue({ count: 0 }),
      update:      vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('@/lib/scoring', () => ({
  calculatePoints: vi.fn().mockResolvedValue(undefined),
}))

// Mockear caché para que empiece siempre vacía
vi.mock('@/lib/cache', () => ({
  cacheGet:    vi.fn().mockReturnValue(null), // siempre cache MISS
  cacheSet:    vi.fn(),
  cacheDelete: vi.fn(),
}))

import { GET } from '@/app/api/matches/live/route'
import { getWC2026Matches, findMatchInList } from '@/lib/wc2026'
import { cacheGet } from '@/lib/cache'
import { prisma } from '@/lib/prisma'

const mockGetMatches = vi.mocked(getWC2026Matches)

const LIVE_MATCH: WC2026Match = {
  id: 2,
  match_number: 2,
  round: 'group',
  group_name: 'A',
  home_team: 'Canada',
  away_team: 'Netherlands',
  home_score: 1,
  away_score: 0,
  status: 'live',
  kickoff_utc: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // hace 30min
  stadium: 'BMO Field',
}

describe('GET /api/matches/live', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Resetear el mock de cacheGet para siempre devolver null (cache MISS)
    vi.mocked(cacheGet).mockReturnValue(null)
  })

  it('devuelve { enabled: false } cuando LIVE_SCORES_ENABLED no es "true"', async () => {
    const original = process.env.LIVE_SCORES_ENABLED
    process.env.LIVE_SCORES_ENABLED = 'false'

    const response = await GET()
    const body = await response.json()

    expect(body.enabled).toBe(false)
    expect(body.matches).toEqual([])
    expect(body.syncedCount).toBe(0)
    process.env.LIVE_SCORES_ENABLED = original
  })

  it('devuelve los partidos en directo con los campos esperados', async () => {
    mockGetMatches.mockResolvedValueOnce([LIVE_MATCH])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.enabled).toBe(true)
    expect(body.matches).toHaveLength(1)
    expect(body.matches[0].status).toBe('live')
    expect(body.matches[0].homeScore).toBe(1)
    expect(body.matches[0].awayScore).toBe(0)
    expect(body.matches[0].homeTeam).toBe('Canada')
    expect(body.updatedAt).toBeDefined()
  })

  it('devuelve array vacío y no lanza 500 cuando la API externa falla', async () => {
    mockGetMatches.mockRejectedValueOnce(new Error('API caída'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200) // NUNCA 500
    expect(body.enabled).toBe(true)
    expect(body.matches).toEqual([])
    expect(body.error).toBeDefined()
  })

  it('filtra los partidos TBD (home_team o away_team null)', async () => {
    const tbdMatch: WC2026Match = {
      id: 73,
      match_number: 73,
      round: 'round_of_32',
      group_name: null,
      home_team: null as unknown as string,
      away_team: null as unknown as string,
      home_score: null,
      away_score: null,
      status: 'live',
      kickoff_utc: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      stadium: 'SoFi Stadium',
    }
    mockGetMatches.mockResolvedValueOnce([tbdMatch])

    const response = await GET()
    const body = await response.json()

    expect(body.matches).toHaveLength(0) // TBD excluido de la respuesta
  })

  it('incluye partidos terminados recientemente (últimas 3h)', async () => {
    const recentFinished: WC2026Match = {
      id: 1,
      match_number: 1,
      round: 'group',
      group_name: 'A',
      home_team: 'Mexico',
      away_team: 'USA',
      home_score: 2,
      away_score: 1,
      status: 'finished',
      kickoff_utc: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // hace 90min
      stadium: 'Azteca',
    }
    mockGetMatches.mockResolvedValueOnce([recentFinished])

    const response = await GET()
    const body = await response.json()

    expect(body.matches.some((m: { status: string }) => m.status === 'finished')).toBe(true)
  })

  // ── Cobertura: syncMatchesToDB ──────────────────────────────────────────────

  it('devuelve la respuesta cacheada sin llamar a la API (cache HIT)', async () => {
    const cached = {
      enabled: true,
      updatedAt: '2026-06-11T18:00:00.000Z',
      matches: [],
      syncedCount: 0,
    }
    vi.mocked(cacheGet).mockReturnValueOnce(cached)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.enabled).toBe(true)
    expect(mockGetMatches).not.toHaveBeenCalled() // sin llamada a la API
  })

  it('sincroniza UPCOMING → LIVE y devuelve syncedCount:1', async () => {
    mockGetMatches.mockResolvedValueOnce([LIVE_MATCH])

    const dbMatch = {
      id: 'db-2', matchNumber: 2, teamA: 'Canada', teamB: 'Netherlands',
      scoreA: null, scoreB: null, status: 'UPCOMING',
      date: new Date(LIVE_MATCH.kickoff_utc), phase: 'Grupo A', isStarMatch: false,
    }
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce([dbMatch] as any)
    vi.mocked(findMatchInList).mockReturnValueOnce(dbMatch as any)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(vi.mocked(prisma.match.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'LIVE' } })
    )
    expect(body.syncedCount).toBe(1)
  })

  it('sincroniza LIVE → FINISHED, calcula puntos y devuelve syncedCount:1', async () => {
    const finishedMatch: WC2026Match = {
      id: 2, match_number: 2, round: 'group', group_name: 'A',
      home_team: 'Canada', away_team: 'Netherlands',
      home_score: 2, away_score: 0, status: 'finished',
      kickoff_utc: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      stadium: 'BMO Field',
    }
    mockGetMatches.mockResolvedValueOnce([finishedMatch])

    const dbMatch = {
      id: 'db-2', matchNumber: 2, teamA: 'Canada', teamB: 'Netherlands',
      scoreA: null, scoreB: null, status: 'LIVE',
      date: new Date(finishedMatch.kickoff_utc), phase: 'Grupo A', isStarMatch: false,
    }
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce([dbMatch] as any)
    vi.mocked(findMatchInList).mockReturnValueOnce(dbMatch as any)
    vi.mocked(prisma.match.updateMany).mockResolvedValueOnce({ count: 1 })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(vi.mocked(prisma.match.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FINISHED', scoreA: 2, scoreB: 0 }) })
    )
    expect(body.syncedCount).toBe(1)
  })

  it('incluye partidos scheduled que empiezan en menos de 2 horas', async () => {
    const upcomingSoon: WC2026Match = {
      id: 5, match_number: 5, round: 'group', group_name: 'B',
      home_team: 'Spain', away_team: 'Brazil',
      home_score: null, away_score: null, status: 'scheduled',
      kickoff_utc: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // en 1h
      stadium: 'MetLife Stadium',
    }
    mockGetMatches.mockResolvedValueOnce([upcomingSoon])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.matches.some((m: { status: string }) => m.status === 'scheduled')).toBe(true)
  })
})
