// tests/api/sync-scores.test.ts
// Testea POST /api/admin/sync-scores
// Auth: header x-cron-secret (no NextAuth) — solo se aplica en NODE_ENV=production
// Imports reales del código: @/lib/prisma (no @/lib/db)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { WC2026Match } from '@/lib/wc2026'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/wc2026', () => ({
  getWC2026Matches:          vi.fn(),
  getKnockoutMatchesWithTeams: vi.fn(),
  normalizeTeamName: (n: string | null | undefined) => {
    if (!n) return null
    const map: Record<string, string> = {
      'France': 'Francia', 'Morocco': 'Marruecos',
      'Spain': 'España', 'Brazil': 'Brasil',
      'Germany': 'Alemania', 'Mexico': 'México',
      'USA': 'Estados Unidos', 'Argentina': 'Argentina',
    }
    return map[n] ?? n
  },
  findMatchInList:   vi.fn().mockReturnValue(undefined),
  isMatchReversed:   vi.fn().mockReturnValue(false),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany:   vi.fn(),
      updateMany: vi.fn(),
      update:     vi.fn(),
    },
  },
}))

vi.mock('@/lib/scoring', () => ({
  calculatePoints: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/cache', () => ({
  cacheGet:    vi.fn().mockReturnValue(null),
  cacheSet:    vi.fn(),
  cacheDelete: vi.fn(),
}))

import { POST, GET } from '@/app/api/admin/sync-scores/route'
import { getWC2026Matches, getKnockoutMatchesWithTeams, findMatchInList } from '@/lib/wc2026'
import { prisma } from '@/lib/prisma'

const mockGetMatches   = vi.mocked(getWC2026Matches)
const mockGetKnockout  = vi.mocked(getKnockoutMatchesWithTeams)
const mockFindMany     = vi.mocked(prisma.match.findMany)
const mockUpdateMany   = vi.mocked(prisma.match.updateMany)
const mockUpdate       = vi.mocked(prisma.match.update)

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/admin/sync-scores', {
    method: 'POST',
    headers,
  })
}

const CRON_HEADERS = { 'x-cron-secret': 'test_cron_secret' }

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('POST /api/admin/sync-scores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetKnockout.mockResolvedValue([])
    mockGetMatches.mockResolvedValue([])
    mockFindMany.mockResolvedValue([])
    mockUpdateMany.mockResolvedValue({ count: 0 })
    mockUpdate.mockResolvedValue({} as any)
  })

  // ── Autenticación ─────────────────────────────────────────────────────────

  describe('autenticación', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('rechaza con 401 en producción si no hay header cron-secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = await POST(makeRequest()) // sin header
      expect(response.status).toBe(401)
    })

    it('rechaza con 401 en producción si el header cron-secret es incorrecto', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = await POST(makeRequest({ 'x-cron-secret': 'secreto_malo' }))
      expect(response.status).toBe(401)
    })

    it('acepta en producción con el cron-secret correcto', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = await POST(makeRequest(CRON_HEADERS))
      expect(response.status).toBe(200)
    })

    it('acepta también con Authorization: Bearer <secret>', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = await POST(makeRequest({ 'authorization': 'Bearer test_cron_secret' }))
      expect(response.status).toBe(200)
    })

    it('en entorno de test (NODE_ENV=test) no requiere auth', async () => {
      const response = await POST(makeRequest()) // sin header, NODE_ENV=test
      expect(response.status).toBe(200)
    })
  })

  // ── Feature flag ──────────────────────────────────────────────────────────

  it('devuelve error si LIVE_SCORES_ENABLED no está activo', async () => {
    const original = process.env.LIVE_SCORES_ENABLED
    process.env.LIVE_SCORES_ENABLED = 'false'
    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()
    expect(body.success).toBe(false)
    process.env.LIVE_SCORES_ENABLED = original
  })

  // ── Sync de resultados ────────────────────────────────────────────────────

  it('retorna success:true con updated:0 cuando no hay partidos terminados', async () => {
    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.updated).toBe(0)
    expect(body.errors).toBe(0)
  })

  it('llama a getWC2026Matches y getKnockoutMatchesWithTeams en paralelo', async () => {
    await POST(makeRequest(CRON_HEADERS))
    expect(mockGetMatches).toHaveBeenCalledTimes(1)
    expect(mockGetKnockout).toHaveBeenCalledTimes(1)
  })

  it('responde 200 aunque la API externa falle', async () => {
    mockGetMatches.mockRejectedValueOnce(new Error('WC2026 API caída'))
    const response = await POST(makeRequest(CRON_HEADERS))
    expect(response.status).toBe(200)
  })

  it('incluye knockoutTeamsUpdated y knockoutTeamsErrors en la respuesta', async () => {
    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()
    expect(typeof body.knockoutTeamsUpdated).toBe('number')
    expect(typeof body.knockoutTeamsErrors).toBe('number')
  })

  // ── Sync de equipos eliminatorios ─────────────────────────────────────────

  it('actualiza teamA/teamB cuando la API tiene equipos y la BD tiene placeholder', async () => {
    const knockoutMatch: WC2026Match = {
      id: 73, match_number: 73, round: 'round_of_32', group_name: null,
      home_team: 'France', away_team: 'Morocco',
      home_score: null, away_score: null, status: 'scheduled',
      kickoff_utc: '2026-06-28T18:00:00.000Z', stadium: 'SoFi Stadium',
    }
    mockGetKnockout.mockResolvedValueOnce([knockoutMatch])

    // Primera llamada findMany (resultados grupos): vacío
    // Segunda llamada findMany (knockout): devuelve partido con placeholder
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'db-73', matchNumber: 73, teamA: '1º Grupo A', teamB: '2º Grupo B',
          phase: 'Dieciseisavos', status: 'UPCOMING', date: new Date('2026-06-28T18:00:00.000Z') } as any,
      ])

    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()

    expect(body.knockoutTeamsUpdated).toBe(1)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teamA: 'Francia', teamB: 'Marruecos' }),
      })
    )
  })

  it('es idempotente: no actualiza si el partido ya tiene los equipos correctos', async () => {
    const knockoutMatch: WC2026Match = {
      id: 73, match_number: 73, round: 'round_of_32', group_name: null,
      home_team: 'France', away_team: 'Morocco',
      home_score: null, away_score: null, status: 'scheduled',
      kickoff_utc: '2026-06-28T18:00:00.000Z', stadium: 'SoFi Stadium',
    }
    mockGetKnockout.mockResolvedValueOnce([knockoutMatch])

    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        // La BD ya tiene los equipos correctos en español
        { id: 'db-73', matchNumber: 73, teamA: 'Francia', teamB: 'Marruecos',
          phase: 'Dieciseisavos', status: 'UPCOMING', date: new Date('2026-06-28T18:00:00.000Z') } as any,
      ])

    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()

    expect(body.knockoutTeamsUpdated).toBe(0)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('knockoutTeamsUpdated:0 cuando la API aún no tiene equipos (TBD)', async () => {
    mockGetKnockout.mockResolvedValueOnce([]) // API devuelve array vacío para knockout

    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()

    expect(body.knockoutTeamsUpdated).toBe(0)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  // ── Cobertura: paths no cubiertos ─────────────────────────────────────────

  it('GET /api/admin/sync-scores devuelve el mismo resultado que POST', async () => {
    const response = await GET(makeRequest(CRON_HEADERS))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('actualiza status a LIVE cuando la API marca un partido como live', async () => {
    const liveApiMatch: WC2026Match = {
      id: 1, match_number: 1, round: 'group', group_name: 'A',
      home_team: 'France', away_team: 'Morocco',
      home_score: null, away_score: null, status: 'live',
      kickoff_utc: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      stadium: 'SoFi Stadium',
    }
    mockGetMatches.mockResolvedValueOnce([liveApiMatch])

    const dbMatch = {
      id: 'db-1', matchNumber: 1, teamA: 'Francia', teamB: 'Marruecos',
      scoreA: null, scoreB: null, status: 'UPCOMING',
      date: new Date(liveApiMatch.kickoff_utc), phase: 'Grupo A', isStarMatch: false,
    }
    mockFindMany.mockResolvedValueOnce([dbMatch] as any)
    vi.mocked(findMatchInList).mockReturnValueOnce(dbMatch as any)

    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()

    expect(body.updated).toBe(1)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'LIVE' } })
    )
  })

  it('knockoutTeamsErrors:1 cuando prisma.update lanza un error', async () => {
    const knockoutMatch: WC2026Match = {
      id: 73, match_number: 73, round: 'round_of_32', group_name: null,
      home_team: 'France', away_team: 'Morocco',
      home_score: null, away_score: null, status: 'scheduled',
      kickoff_utc: '2026-06-28T18:00:00.000Z', stadium: 'SoFi Stadium',
    }
    mockGetKnockout.mockResolvedValueOnce([knockoutMatch])

    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'db-73', matchNumber: 73, teamA: '1º Grupo A', teamB: '2º Grupo B',
          phase: 'Dieciseisavos', status: 'UPCOMING', date: new Date('2026-06-28T18:00:00.000Z') } as any,
      ])

    // Simular que el update falla
    mockUpdate.mockRejectedValueOnce(new Error('DB connection lost'))

    const response = await POST(makeRequest(CRON_HEADERS))
    const body = await response.json()

    expect(body.knockoutTeamsErrors).toBe(1)
    expect(body.knockoutTeamsUpdated).toBe(0)
  })
})
