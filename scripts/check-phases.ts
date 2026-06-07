// scripts/check-phases.ts — inspeccionar fases
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Ver knockout matches sin importar si tienen equipos o no
  const knockouts = await prisma.match.findMany({
    where: {
      phase: { in: ['Dieciseisavos', 'Octavos', 'Cuartos', 'Semis', 'Final', '3er Puesto', 'Tercer Puesto'] }
    },
    select: { id: true, teamA: true, teamB: true, phase: true, date: true },
    orderBy: { date: 'asc' },
  })
  console.log(`\n=== Partidos eliminatorios (${knockouts.length} total) ===`)
  for (const m of knockouts) {
    console.log(`  [${m.phase}] "${m.teamA}" vs "${m.teamB}" — ${m.date.toISOString().slice(0,10)}`)
  }

  const allPhases = await prisma.$queryRaw<{ phase: string; cnt: bigint }[]>`
    SELECT DISTINCT phase, count(*) as cnt FROM "Match" GROUP BY phase ORDER BY phase
  `
  console.log('\n=== TODAS las phases ===')
  for (const row of allPhases) {
    console.log(`  "${row.phase}" → ${row.cnt} partidos`)
  }

  const totalMatches = await prisma.match.count()
  console.log(`\nTotal partidos en BD: ${totalMatches}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
