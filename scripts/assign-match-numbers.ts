// scripts/assign-match-numbers.ts
// Ejecutar UNA SOLA VEZ: npx ts-node scripts/assign-match-numbers.ts
//
// Asigna matchNumber a todos los partidos de la BD usando la WC2026 API como fuente de verdad.
// Estrategia de matching en dos pasadas:
//   1ª pasada — Fase de grupos: matching por nombres de equipo (ES→EN) dentro de la misma jornada (±12h)
//   2ª pasada — Fase eliminatoria: matching por fecha exacta (±30 min), TBD en la API

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE_URL = 'https://api.wc2026api.com'
const API_KEY = process.env.WC2026_API_KEY

interface WC2026Match {
  id: number
  match_number: number
  round: string
  group_name: string | null
  home_team: string | null
  away_team: string | null
  home_score: number | null
  away_score: number | null
  status: string
  kickoff_utc: string
  stadium: string
}

// Español → Inglés (subset del mapa completo, todos los 48 equipos del torneo)
const ES_TO_EN: Record<string, string> = {
  'Argelia': 'Algeria',
  'Argentina': 'Argentina',
  'Australia': 'Australia',
  'Austria': 'Austria',
  'Bélgica': 'Belgium',
  'Bosnia y Herzegovina': 'Bosnia-Herzegovina',
  'Brasil': 'Brazil',
  'Cabo Verde': 'Cabo Verde',
  'Canadá': 'Canada',
  'Colombia': 'Colombia',
  'RD Congo': 'Congo DR',
  'Croacia': 'Croatia',
  'Curasao': 'Curaçao',
  'Chequia': 'Czechia',
  'Costa de Marfil': "Côte d'Ivoire",
  'Ecuador': 'Ecuador',
  'Egipto': 'Egypt',
  'Inglaterra': 'England',
  'Francia': 'France',
  'Alemania': 'Germany',
  'Ghana': 'Ghana',
  'Haití': 'Haiti',
  'Irán': 'IR Iran',
  'Irak': 'Iraq',
  'Japón': 'Japan',
  'Jordania': 'Jordan',
  'República de Corea': 'Korea Republic',
  'México': 'Mexico',
  'Marruecos': 'Morocco',
  'Países Bajos': 'Netherlands',
  'Nueva Zelanda': 'New Zealand',
  'Noruega': 'Norway',
  'Panamá': 'Panama',
  'Paraguay': 'Paraguay',
  'Portugal': 'Portugal',
  'Catar': 'Qatar',
  'Arabia Saudí': 'Saudi Arabia',
  'Escocia': 'Scotland',
  'Senegal': 'Senegal',
  'Sudáfrica': 'South Africa',
  'España': 'Spain',
  'Suecia': 'Sweden',
  'Suiza': 'Switzerland',
  'Túnez': 'Tunisia',
  'Turquía': 'Turkey',
  'Estados Unidos': 'USA',
  'Uruguay': 'Uruguay',
  'Uzbekistán': 'Uzbekistan',
}

async function fetchApiMatches(): Promise<WC2026Match[]> {
  if (!API_KEY) throw new Error('WC2026_API_KEY no configurada en .env')

  const res = await fetch(`${BASE_URL}/matches`, {
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)

  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error(`Esperaba array, recibí ${typeof data}`)
  return data as WC2026Match[]
}

async function main() {
  console.log('🔄 Conectando a la WC2026 API...')
  const apiMatches = await fetchApiMatches()
  console.log(`✓ ${apiMatches.length} partidos en la API`)

  console.log('🔄 Leyendo partidos de la BD...')
  const dbMatches = await prisma.match.findMany({
    orderBy: { date: 'asc' },
    select: { id: true, teamA: true, teamB: true, date: true, phase: true, matchNumber: true },
  })
  console.log(`✓ ${dbMatches.length} partidos en la BD\n`)

  const apiMatchesUsed = new Set<number>()
  const dbMatchesAssigned = new Set<string>()
  let totalAssigned = 0
  let alreadyHadNumber = 0

  // Pre-cargar los ya asignados para no sobreescribir
  for (const db of dbMatches) {
    if (db.matchNumber !== null) {
      apiMatchesUsed.add(db.matchNumber)
      dbMatchesAssigned.add(db.id)
      alreadyHadNumber++
    }
  }
  if (alreadyHadNumber > 0) {
    console.log(`ℹ️  ${alreadyHadNumber} partidos ya tienen matchNumber asignado — se mantienen\n`)
  }

  // ─── PASADA 1: Fase de grupos — matching por nombre de equipo (ES→EN) ──────
  console.log('─── Pasada 1: Fase de grupos (por nombre de equipo) ─────────────────')

  const knockoutPhases = new Set(['Dieciseisavos', 'Octavos', 'Cuartos', 'Semis', 'Final'])
  const TWELVE_HOURS = 7 * 24 * 60 * 60 * 1000 // 7 días — safe porque matcheamos por nombre exacto de equipo

  for (const db of dbMatches) {
    if (dbMatchesAssigned.has(db.id)) continue
    if (knockoutPhases.has(db.phase)) continue // reservar para pasada 2

    const dbMs = db.date.getTime()
    const teamAEn = ES_TO_EN[db.teamA]
    const teamBEn = ES_TO_EN[db.teamB]

    if (!teamAEn || !teamBEn) {
      console.log(`  ⚠️  Sin traducción EN: [${db.phase}] "${db.teamA}" vs "${db.teamB}"`)
      continue
    }

    // Buscar en la API: equipos coincidan (normal o invertido) dentro de ±12h
    let bestMatch: WC2026Match | null = null
    let bestDelta = Infinity

    for (const api of apiMatches) {
      if (apiMatchesUsed.has(api.match_number)) continue
      if (!api.home_team || !api.away_team) continue // TBD

      const sameTeams =
        (api.home_team === teamAEn && api.away_team === teamBEn) ||
        (api.home_team === teamBEn && api.away_team === teamAEn)
      if (!sameTeams) continue

      const delta = Math.abs(new Date(api.kickoff_utc).getTime() - dbMs)
      if (delta < TWELVE_HOURS && delta < bestDelta) {
        bestDelta = delta
        bestMatch = api
      }
    }

    if (!bestMatch) {
      console.log(`  ✗ No encontrado: [${db.phase}] "${db.teamA}" vs "${db.teamB}" (${db.date.toISOString().slice(0,16)})`)
      continue
    }

    await prisma.match.update({ where: { id: db.id }, data: { matchNumber: bestMatch.match_number } })
    apiMatchesUsed.add(bestMatch.match_number)
    dbMatchesAssigned.add(db.id)
    totalAssigned++

    const deltaMin = Math.round(bestDelta / 60000)
    console.log(`  ✓ #${bestMatch.match_number} Δ${deltaMin}min | "${db.teamA}" vs "${db.teamB}"`)
  }

  // ─── PASADA 2: Fase eliminatoria — matching por fecha exacta (±30 min) ─────
  console.log('\n─── Pasada 2: Fase eliminatoria (por fecha) ─────────────────────────')

  const THIRTY_MIN = 30 * 60 * 1000

  for (const db of dbMatches) {
    if (dbMatchesAssigned.has(db.id)) continue
    if (!knockoutPhases.has(db.phase)) continue

    const dbMs = db.date.getTime()
    let bestMatch: WC2026Match | null = null
    let bestDelta = Infinity

    for (const api of apiMatches) {
      if (apiMatchesUsed.has(api.match_number)) continue
      const delta = Math.abs(new Date(api.kickoff_utc).getTime() - dbMs)
      if (delta < THIRTY_MIN && delta < bestDelta) {
        bestDelta = delta
        bestMatch = api
      }
    }

    if (!bestMatch) {
      console.log(`  ✗ No encontrado: [${db.phase}] "${db.teamA}" vs "${db.teamB}" (${db.date.toISOString().slice(0,16)})`)
      continue
    }

    await prisma.match.update({ where: { id: db.id }, data: { matchNumber: bestMatch.match_number } })
    apiMatchesUsed.add(bestMatch.match_number)
    dbMatchesAssigned.add(db.id)
    totalAssigned++

    const deltaMin = Math.round(bestDelta / 60000)
    const apiLabel = bestMatch.home_team ? `${bestMatch.home_team} vs ${bestMatch.away_team}` : 'TBD vs TBD'
    console.log(`  ✓ #${bestMatch.match_number} [${bestMatch.round}] Δ${deltaMin}min | BD: "${db.teamA}" vs "${db.teamB}" | API: ${apiLabel}`)
  }

  // ─── Resumen ──────────────────────────────────────────────────────────────
  const stillUnassigned = dbMatches.filter((m) => !dbMatchesAssigned.has(m.id))

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`✅  Asignados ahora:   ${totalAssigned}`)
  console.log(`ℹ️   Ya tenían número: ${alreadyHadNumber}`)
  console.log(`⚠️   Sin asignar:      ${stillUnassigned.length}`)

  if (stillUnassigned.length > 0) {
    console.log('\nPartidos sin matchNumber:')
    for (const m of stillUnassigned) {
      console.log(`  [${m.phase}] "${m.teamA}" vs "${m.teamB}" — ${m.date.toISOString()}`)
    }
  }

  const apiUnmatched = apiMatches.filter((a) => !apiMatchesUsed.has(a.match_number))
  if (apiUnmatched.length > 0) {
    console.log('\nPartidos API sin correspondencia en BD:')
    for (const a of apiUnmatched) {
      console.log(`  API #${a.match_number} [${a.round}] ${a.home_team ?? 'TBD'} vs ${a.away_team ?? 'TBD'} — ${a.kickoff_utc}`)
    }
  }

  // Verificación final
  const final = await prisma.match.findMany({
    where: { matchNumber: { not: null } },
    orderBy: { matchNumber: 'asc' },
    select: { matchNumber: true },
  })
  const nums = final.map((m) => m.matchNumber as number)
  const duplicates = nums.filter((n, i) => nums.indexOf(n) !== i)
  if (duplicates.length > 0) {
    console.error(`\n❌ DUPLICADOS detectados: ${duplicates.join(', ')}`)
  } else {
    console.log(`\n✅ Sin duplicados. Rango: ${nums[0]}–${nums[nums.length - 1]}. Total con matchNumber: ${nums.length} / ${dbMatches.length} en BD`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
