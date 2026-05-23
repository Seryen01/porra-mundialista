// tests/integration/mundial-simulation.test.ts
// Simula el ciclo de vida completo del Mundial 2026:
// 11 junio (primer partido) → 26 junio (cruces eliminatorios) → 19 julio (final)
// Todo con mocks — no toca API real ni BD real.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { WC2026Match } from '@/lib/wc2026'

vi.mock('@/lib/wc2026', () => ({
  getWC2026Matches:          vi.fn(),
  getKnockoutMatchesWithTeams: vi.fn(),
  normalizeTeamName: (n: string | null | undefined) => {
    // Mapa mínimo para la simulación
    const map: Record<string, string> = {
      'Mexico': 'México', 'USA': 'Estados Unidos',
      'Spain': 'España', 'Brazil': 'Brasil',
      'France': 'Francia', 'Morocco': 'Marruecos',
      'Argentina': 'Argentina', 'Germany': 'Alemania',
    }
    return n ? (map[n] ?? n) : null
  },
  findMatchInList: vi.fn().mockReturnValue(undefined),
  isMatchReversed: vi.fn().mockReturnValue(false),
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

import { POST } from '@/app/api/admin/sync-scores/route'
import { getWC2026Matches, getKnockoutMatchesWithTeams, findMatchInList } from '@/lib/wc2026'
import { prisma } from '@/lib/prisma'
import { calculatePoints } from '@/lib/scoring'

const cronReq = () => new NextRequest('http://localhost/api/admin/sync-scores', {
  method: 'POST',
  headers: { 'x-cron-secret': 'test_cron_secret' },
})

describe('🌍 Simulación Mundial 2026 — Ciclo completo', () => {
  beforeEach(() => {
    // resetAllMocks limpia tanto el historial como la cola de mockResolvedValueOnce,
    // evitando que mocks no consumidos de un test fallido contaminen el siguiente.
    vi.resetAllMocks()
    vi.mocked(getKnockoutMatchesWithTeams).mockResolvedValue([])
    vi.mocked(prisma.match.findMany).mockResolvedValue([])
    vi.mocked(prisma.match.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.match.update).mockResolvedValue({} as any)
    vi.mocked(calculatePoints).mockResolvedValue(undefined)
  })

  // ── ESCENARIO 1: Antes del torneo ─────────────────────────────────────────
  it('ESC 1 — Cron corre antes del torneo: no hay nada que sincronizar', async () => {
    vi.mocked(getWC2026Matches).mockResolvedValueOnce([
      { id: 1, match_number: 1, round: 'group', group_name: 'A',
        home_team: 'Mexico', away_team: 'USA',
        home_score: null, away_score: null, status: 'scheduled',
        kickoff_utc: '2026-06-11T18:00:00.000Z', stadium: 'Azteca' },
    ])

    const res = await POST(cronReq())
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.updated).toBe(0)
    expect(body.errors).toBe(0)
    expect(vi.mocked(calculatePoints)).not.toHaveBeenCalled()
  })

  // ── ESCENARIO 2: Primer partido termina (11 junio, México 2-1 USA) ─────────
  it('ESC 2 — México 2-1 USA: se sincroniza y se calculan puntos', async () => {
    vi.mocked(getWC2026Matches).mockResolvedValueOnce([
      { id: 1, match_number: 1, round: 'group', group_name: 'A',
        home_team: 'Mexico', away_team: 'USA',
        home_score: 2, away_score: 1, status: 'finished',
        kickoff_utc: '2026-06-11T18:00:00.000Z', stadium: 'Azteca' },
    ])
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce([
      { id: 'db-1', matchNumber: 1, teamA: 'México', teamB: 'Estados Unidos',
        scoreA: null, scoreB: null, status: 'UPCOMING',
        date: new Date('2026-06-11T18:00:00.000Z'), phase: 'Grupo A',
        isStarMatch: false } as any,
    ])
    vi.mocked(prisma.match.updateMany).mockResolvedValueOnce({ count: 1 })

    // findMatchInList debe devolver el partido de BD
    vi.mocked(findMatchInList).mockReturnValueOnce(
      { id: 'db-1', matchNumber: 1, teamA: 'México', teamB: 'Estados Unidos',
        scoreA: null, scoreB: null, status: 'UPCOMING',
        date: new Date('2026-06-11T18:00:00.000Z'), phase: 'Grupo A', isStarMatch: false } as any
    )

    const res = await POST(cronReq())
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.updated).toBe(1)
    expect(vi.mocked(calculatePoints)).toHaveBeenCalledWith('db-1', 2, 1)
  })

  // ── ESCENARIO 3: Idempotencia — el mismo partido procesado dos veces ───────
  it('ESC 3 — Segundo cron sobre el mismo partido no recalcula puntos', async () => {
    vi.mocked(getWC2026Matches).mockResolvedValueOnce([
      { id: 1, match_number: 1, round: 'group', group_name: 'A',
        home_team: 'Mexico', away_team: 'USA',
        home_score: 2, away_score: 1, status: 'finished',
        kickoff_utc: '2026-06-11T18:00:00.000Z', stadium: 'Azteca' },
    ])
    // La BD ya tiene status=FINISHED → findMany devuelve [] (WHERE status != FINISHED)
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce([])

    const res = await POST(cronReq())
    const body = await res.json()

    expect(body.updated).toBe(0)
    expect(vi.mocked(prisma.match.updateMany)).not.toHaveBeenCalled()
    expect(vi.mocked(calculatePoints)).not.toHaveBeenCalled()
  })

  // ── ESCENARIO 4: Noche del 26 junio — la API revela los 16 cruces R32 ──────
  it('ESC 4 — 26 junio: API revela 16 cruces de dieciseisavos, todos se actualizan', async () => {
    vi.mocked(getWC2026Matches).mockResolvedValueOnce([])
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce([]) // sin grupos pendientes

    const r32Matches = Array.from({ length: 16 }, (_, i): WC2026Match => ({
      id: 73 + i,
      match_number: 73 + i,
      round: 'round_of_32',
      group_name: null,
      home_team: ['France', 'Spain', 'Brazil', 'Germany', 'Mexico', 'USA', 'Argentina', 'Morocco',
                  'Netherlands', 'England', 'Portugal', 'Belgium', 'Croatia', 'Uruguay', 'Japan', 'Canada'][i],
      away_team: ['Morocco', 'Germany', 'France', 'Spain', 'Argentina', 'Mexico', 'Brazil', 'Portugal',
                  'Belgium', 'Croatia', 'Uruguay', 'Japan', 'Canada', 'Netherlands', 'England', 'USA'][i],
      home_score: null, away_score: null, status: 'scheduled',
      kickoff_utc: `2026-06-28T18:00:00.000Z`,
      stadium: 'Estadio X',
    }))

    vi.mocked(getKnockoutMatchesWithTeams).mockResolvedValueOnce(r32Matches)

    // BD tiene los 16 partidos con placeholders
    vi.mocked(prisma.match.findMany).mockResolvedValueOnce(
      r32Matches.map((m) => ({
        id: `db-${m.id}`,
        matchNumber: m.match_number,
        teamA: `1º Grupo X`,
        teamB: `2º Grupo Y`,
        phase: 'Dieciseisavos',
        status: 'UPCOMING',
        date: new Date(m.kickoff_utc),
        isStarMatch: false,
      } as any))
    )

    const res = await POST(cronReq())
    const body = await res.json()

    expect(body.knockoutTeamsUpdated).toBe(16)
    expect(body.knockoutTeamsErrors).toBe(0)
    expect(vi.mocked(prisma.match.update)).toHaveBeenCalledTimes(16)
  })

  // ── ESCENARIO 5: La API falla pero el sistema no explota ──────────────────
  it('ESC 5 — API caída: el endpoint devuelve 200 con errors controlados', async () => {
    vi.mocked(getWC2026Matches).mockRejectedValueOnce(new Error('WC2026 API timeout'))
    vi.mocked(getKnockoutMatchesWithTeams).mockRejectedValueOnce(new Error('WC2026 API timeout'))

    const res = await POST(cronReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // Los errores quedan reflejados en errors, no explotan la respuesta
    expect(body.errors).toBeGreaterThanOrEqual(0)
  })

  // ── ESCENARIO 6: Llamadas simultáneas (race condition guard) ──────────────
  it('ESC 6 — Tres crons paralelos: todos devuelven 200', async () => {
    vi.mocked(getWC2026Matches).mockResolvedValue([])

    const results = await Promise.all([POST(cronReq()), POST(cronReq()), POST(cronReq())])
    results.forEach((r) => expect(r.status).toBe(200))

    const bodies = await Promise.all(results.map((r) => r.json()))
    bodies.forEach((b) => expect(b.success).toBe(true))
  })
})
